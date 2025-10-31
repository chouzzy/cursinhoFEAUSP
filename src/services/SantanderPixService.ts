import { prisma } from "../prisma";
import { santanderApiClient } from "../lib/santanderApiClient";
import { randomBytes, randomUUID } from 'crypto';
import { Students } from "@prisma/client";
import { crc16ccitt } from 'crc'; // Importamos a função de CRC

// Este tipo representa os dados que esperamos que o frontend envie.
type InscriptionData = Omit<Students, 'id' | 'createdAt' | 'purcharsedSubscriptions' | 'stripeCustomerID'> & {
  schoolClassID: string;
};

const INSCRIPTION_PRICE = "10.00"; 

// --- Funções Auxiliares para montar o EMV (sem alterações) ---
function formatEMVField(id: string, value: string): string {
    const length = value.length.toString().padStart(2, '0');
    if (length.length > 2) {
        console.warn(`Valor do campo EMV (ID ${id}) muito longo: ${value.length}`);
    }
    return `${id}${length}${value}`;
}

function buildEMVString(location: string, txid: string, valor: string, nomeRecebedor: string, cidadeRecebedor: string): string {
    const f00 = formatEMVField("00", "01");
    const f01 = formatEMVField("01", "12");
    const f26_sub00 = formatEMVField("00", "br.gov.bcb.pix");
    const f26_sub25 = formatEMVField("25", location);
    const f26_value = f26_sub00 + f26_sub25;
    const f26 = formatEMVField("26", f26_value);
    const f52 = formatEMVField("52", "0000");
    const f53 = formatEMVField("53", "986");
    const f54 = formatEMVField("54", valor);
    const f58 = formatEMVField("58", "BR");
    const f59 = formatEMVField("59", nomeRecebedor.substring(0, 25));
    const f60 = formatEMVField("60", cidadeRecebedor.substring(0, 15));
    const f62_sub05 = formatEMVField("05", txid);
    const f62 = formatEMVField("62", f62_sub05);
    let payload = f00 + f01 + f26 + f52 + f53 + f54 + f58 + f59 + f60 + f62;
    const payloadComCrcInfo = payload + "6304";
    const crc = crc16ccitt(payloadComCrcInfo, 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    const f63 = "6304" + crc;
    return payload + f63;
}
// --- Fim das Funções Auxiliares ---


export class SantanderPixService {

  async createInscriptionWithPix(inscriptionData: any) {
    // 1. Separar dados e limpar CPF
    const { schoolClassID, price, ...studentModelData } = inscriptionData;
    const sanitizedCpf = inscriptionData.cpf.replace(/\D/g, '');
    let studentId: string;

    // 2. VERIFICAR SE O USUÁRIO JÁ EXISTE (POR CPF OU EMAIL)
    let existingStudent = await prisma.students.findFirst({
        where: {
            OR: [
                { email: inscriptionData.email },
                { cpf: sanitizedCpf }
            ]
        }
    });

    if (existingStudent) {
        console.log(`Estudante já encontrado com email/cpf. ID: ${existingStudent.id}`);
        studentId = existingStudent.id;

        // **LÓGICA DE VALIDAÇÃO REFORÇADA**
        // Procurar por QUALQUER inscrição (paga OU pendente) para o mesmo curso
        const existingSubscription = existingStudent.purcharsedSubscriptions.find(
            sub => sub.schoolClassID === schoolClassID
        );

        if (existingSubscription) {
            // Caso 1: Já está pago
            if (existingSubscription.paymentStatus === 'CONCLUIDA') {
                console.warn(`Estudante ${existingStudent.id} já possui inscrição PAGA para a turma ${schoolClassID}.`);
                throw new Error('Você já está inscrito e com o pagamento confirmado para esta turma.');
            }

            // Caso 2: Já existe um PIX pendente. Vamos reutilizá-lo!
            // (Adicionaríamos uma lógica de expiração aqui no futuro, por enquanto, reutilizamos)
            if (existingSubscription.paymentStatus === 'PENDENTE' && existingSubscription.pixCopiaECola && existingSubscription.pixQrCode) {
                console.log(`Estudante ${existingStudent.id} já possui um PIX PENDENTE para a turma ${schoolClassID}. Reutilizando...`);
                
                // Atualiza os dados cadastrais do aluno, mas não mexe na inscrição
                await prisma.students.update({
                    where: { id: existingStudent.id },
                    data: {
                        ...studentModelData,
                        cpf: sanitizedCpf,
                    }
                });
                
                // Retorna os dados do PIX que já existe
                return {
                  txid: existingSubscription.txid,
                  qrCodePayload: existingSubscription.pixQrCode,
                  copiaECola: existingSubscription.pixCopiaECola,
                  valor: existingSubscription.valuePaid.toFixed(2),
                };
            }
        }
        
        // Se o estudante existe, mas não tem inscrição para ESTE curso,
        // atualizamos os dados e adicionamos a nova tentativa de pagamento ao array
        console.log(`Estudante ${existingStudent.id} existe, mas não possui inscrição para ${schoolClassID}. Criando nova...`);
        const updatedStudent = await prisma.students.update({
            where: { id: existingStudent.id },
            data: {
                ...studentModelData,
                cpf: sanitizedCpf,
                purcharsedSubscriptions: {
                    push: [{ // Adiciona a nova tentativa
                        schoolClassID: schoolClassID,
                        txid: `insc${randomBytes(14).toString('hex')}`, // Geramos um txid aqui
                        paymentMethod: "pix_santander",
                        paymentStatus: "PENDENTE",
                        pixStatus: "PENDENTE",
                        paymentDate: new Date(),
                        valuePaid: parseFloat(INSCRIPTION_PRICE),
                    }]
                }
            }
        });
        studentId = updatedStudent.id;
    } else {
        // 3. Se não existe, CRIAR novo estudante
        console.log(`Novo estudante. Criando registro...`);
        const newInscription = await prisma.students.create({
          data: {
            ...studentModelData,
            cpf: sanitizedCpf,
            stripeCustomerID: randomUUID(), 
            purcharsedSubscriptions: [{
                schoolClassID: schoolClassID,
                txid: `insc${randomBytes(14).toString('hex')}`, // Geramos um txid aqui
                paymentMethod: "pix_santander",
                paymentStatus: "PENDENTE",
                pixStatus: "PENDENTE",
                paymentDate: new Date(),
                valuePaid: parseFloat(INSCRIPTION_PRICE),
            }]
          },
        });
        studentId = newInscription.id;
        console.log(`Inscrição criada no banco para ${newInscription.name}.`);
    }

    // --- O restante do fluxo é para gerar um NOVO PIX ---
    
    // Recarregar os dados do estudante para pegar o TXID correto
    const studentData = await prisma.students.findUnique({ where: { id: studentId } });
    const currentSubscription = studentData?.purcharsedSubscriptions.find(
        sub => sub.schoolClassID === schoolClassID && sub.paymentStatus === 'PENDENTE'
    );

    if (!currentSubscription || !currentSubscription.txid) {
         throw new Error('Falha ao localizar a inscrição pendente recém-criada.');
    }

    const txid = currentSubscription.txid;
    console.log(`Iniciando geração de PIX para o txid: ${txid}`);

    // 4. Montar o corpo da requisição para o Santander
    const cobData = {
      calendario: { expiracao: 3600 },
      devedor: {
        cpf: sanitizedCpf,
        nome: inscriptionData.name,
      },
      valor: { original: INSCRIPTION_PRICE },
      chave: process.env.SANTANDER_PIX_KEY!,
      solicitacaoPagador: "Taxa de Inscrição Cursinho FEA USP",
    };

    // 5. Chamar nosso cliente de API para CRIAR a cobrança
    const createResponse = await santanderApiClient.createCob(txid, cobData);
    console.log(`Cobrança PIX criada no Santander para o txid: ${txid}. Status: ${createResponse.status}`);
    
    // 6. Construir o "Copia e Cola" (EMV) manualmente
    const nomeRecebedor = process.env.SANTANDER_RECEBEDOR_NOME || "CURSINHO FEA USP";
    const cidadeRecebedor = process.env.SANTANDER_RECEBEDOR_CIDADE || "SAO PAULO";
    
    const pixCopiaECola = buildEMVString(
      createResponse.location.replace('https://', ''),
      createResponse.txid,
      createResponse.valor.original,
      nomeRecebedor,
      cidadeRecebedor
    );
    console.log(`PIX Copia e Cola gerado: ${pixCopiaECola}`);

    // 7. Atualizar a inscrição no banco com os dados do PIX gerado
    await prisma.students.update({
        where: { id: studentId },
        data: {
            purcharsedSubscriptions: {
                updateMany: {
                    where: { txid: txid },
                    data: {
                        pixCopiaECola: pixCopiaECola,
                        pixQrCode: createResponse.location,
                    }
                }
            }
        }
    });

    // 8. Retornar os dados essenciais para o frontend
    return {
      txid: createResponse.txid,
      qrCodePayload: createResponse.location,
      copiaECola: pixCopiaECola,
      valor: createResponse.valor.original,
    };
  }
}

