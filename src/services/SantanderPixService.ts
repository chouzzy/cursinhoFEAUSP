import { prisma } from "../prisma";
import { santanderApiClient } from "../lib/santanderApiClient";
import { randomBytes, randomUUID } from 'crypto';
import { Students } from "@prisma/client";
import { crc16ccitt } from 'crc'; // Importamos a função de CRC

// Este tipo representa os dados que esperamos que o frontend envie.
// Note que agora ele espera 'nome' e 'sobrenome' em vez de 'name'.
type InscriptionData = Omit<Students, 'id' | 'createdAt' | 'purcharsedSubscriptions' | 'stripeCustomerID' | 'name'> & {
  schoolClassID: string;
  nome: string;
  sobrenome: string;
};

const INSCRIPTION_PRICE = "00.01"; 

// --- Funções Auxiliares para montar o EMV ---

/**
 * Formata um campo no padrão EMV (ID + Tamanho + Valor).
 * @param id O ID do campo (ex: "00")
 * @param value O valor do campo (ex: "01")
 * @returns A string formatada (ex: "000201")
 */
function formatEMVField(id: string, value: string): string {
    const length = value.length.toString().padStart(2, '0');
    if (length.length > 2) {
        console.warn(`Valor do campo EMV (ID ${id}) muito longo: ${value.length}`);
    }
    return `${id}${length}${value}`;
}

/**
 * Constrói a string EMV (Pix Copia e Cola) manualmente.
 * @param location A URL do payload vinda da resposta do /cob (sem o https://)
 * @param txid O ID da transação
 * @param valor O valor da cobrança (ex: "10.00")
 * @param nomeRecebedor O nome do recebedor (loja/empresa)
 * @param cidadeRecebedor A cidade do recebedor
 * @returns A string EMV completa (Copia e Cola).
 */
function buildEMVString(location: string, txid: string, valor: string, nomeRecebedor: string, cidadeRecebedor: string): string {
    // ID 00: Payload Format Indicator (Sempre "01")
    const f00 = formatEMVField("00", "01");
    
    // ID 01: Point of Initiation Method (Sempre "12" para QR dinâmico)
    const f01 = formatEMVField("01", "12");

    // ID 26: Merchant Account Information
    const f26_sub00 = formatEMVField("00", "br.gov.bcb.pix"); // GUI (Global Unique Identifier)
    const f26_sub25 = formatEMVField("25", location);       // URL do Payload (location)
    const f26_value = f26_sub00 + f26_sub25;
    const f26 = formatEMVField("26", f26_value);

    // ID 52: Merchant Category Code (Sempre "0000")
    const f52 = formatEMVField("52", "0000");

    // ID 53: Transaction Currency (Sempre "986" para BRL)
    const f53 = formatEMVField("53", "986");

    // ID 54: Transaction Amount
    const f54 = formatEMVField("54", valor);

    // ID 58: Country Code (Sempre "BR")
    const f58 = formatEMVField("58", "BR");

    // ID 59: Merchant Name (Nome do Recebedor, 25 chars max, sem acentos)
    const f59 = formatEMVField("59", nomeRecebedor.substring(0, 25));

    // ID 60: Merchant City (Cidade do Recebedor, 15 chars max, sem acentos)
    const f60 = formatEMVField("60", cidadeRecebedor.substring(0, 15));

    // ID 62: Additional Data Field Template (usado para o TXID)
    const f62_sub05 = formatEMVField("05", txid); // Subcampo 05 é o TXID
    const f62 = formatEMVField("62", f62_sub05);

    // Concatena todos os campos
    let payload = f00 + f01 + f26 + f52 + f53 + f54 + f58 + f59 + f60 + f62;

    // ID 63: CRC16 Checksum
    const payloadComCrcInfo = payload + "6304";
    const crc = crc16ccitt(payloadComCrcInfo, 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    const f63 = "6304" + crc;

    return payload + f63;
}
// --- Fim das Funções Auxiliares ---


export class SantanderPixService {

  async createInscriptionWithPix(inscriptionData: any) { // Recebe 'any' para flexibilidade
    // 1. Separar dados, limpar CPF e CONCATENAR O NOME
    const { schoolClassID, price, nome, sobrenome, ...studentModelData } = inscriptionData;
    const nomeCompleto = `${nome} ${sobrenome}`;
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
        // Procurar por QUALQUER inscrição para o mesmo curso
        const existingSubscription = existingStudent.purcharsedSubscriptions.find(
            sub => sub.schoolClassID === schoolClassID
        );

        if (existingSubscription) {
            // Caso 1: Já está pago
            if (existingSubscription.paymentStatus === 'CONCLUIDA') {
                console.warn(`Estudante ${existingStudent.id} já possui inscrição PAGA para a turma ${schoolClassID}.`);
                throw new Error('Você já está inscrito e com o pagamento confirmado para esta turma.');
            }

            // Caso 2: Já existe um PIX pendente.
            if (existingSubscription.paymentStatus === 'PENDENTE') {
                
                // **NOVA VALIDAÇÃO:** Checa se o PIX pendente é válido (sem hífen e com dados)
                const isDataPresent = existingSubscription.pixCopiaECola && existingSubscription.pixQrCode;
                const isTxidValid = existingSubscription.txid && !existingSubscription.txid.includes('-');
                const agora = new Date();
                const dataCriacao = new Date(existingSubscription.paymentDate!);
                const expiracao = new Date(dataCriacao.getTime() + 3600 * 1000); // 1 hora
                const isExpired = agora > expiracao;

                if (isDataPresent && isTxidValid && !isExpired) {
                    // O PIX pendente é VÁLIDO. Reutiliza.
                    console.log(`Estudante ${existingStudent.id} já possui um PIX PENDENTE VÁLIDO. Reutilizando...`);
                    
                    // Atualiza dados cadastrais
                    await prisma.students.update({
                        where: { id: existingStudent.id },
                        data: {
                            ...studentModelData,
                            name: nomeCompleto, // Atualiza o nome completo
                            cpf: sanitizedCpf,
                        }
                    });
                    
                    // Retorna os dados do PIX que já existe
                    return {
                      txid: existingSubscription.txid,
                      qrCodePayload: existingSubscription.pixCopiaECola, // Corrigido para retornar o Copia e Cola
                      copiaECola: existingSubscription.pixCopiaECola,
                      valor: existingSubscription.valuePaid.toFixed(2),
                    };
                } else {
                    // O PIX pendente é INVÁLIDO ou EXPIRADO
                    const newTxid = `insc${randomBytes(14).toString('hex')}`;
                    console.warn(`Estudante ${existingStudent.id} possui PIX pendente inválido/expirado (txid: ${existingSubscription.txid}). Atualizando com novo txid: ${newTxid}`);

                    // Atualiza a inscrição pendente existente com o novo txid
                    await prisma.students.update({
                        where: { id: existingStudent.id },
                        data: {
                            ...studentModelData, // Atualiza dados cadastrais
                            name: nomeCompleto, 
                            cpf: sanitizedCpf,
                            purcharsedSubscriptions: {
                                updateMany: { // Encontra a inscrição pendente
                                    where: { 
                                        schoolClassID: schoolClassID,
                                        paymentStatus: 'PENDENTE' 
                                    },
                                    data: { // E atualiza com o novo txid e limpa dados antigos
                                        txid: newTxid, 
                                        paymentMethod: "pix_santander",
                                        paymentDate: new Date(),
                                        valuePaid: parseFloat(INSCRIPTION_PRICE),
                                        pixCopiaECola: null, 
                                        pixQrCode: null,
                                    }
                                }
                            }
                        }
                    });
                    studentId = existingStudent.id;
                    // O fluxo continua para gerar o PIX para o newTxid
                }
            }
        } else {
            // Se o estudante existe, mas não tem inscrição para ESTE curso,
            // atualizamos os dados e adicionamos a nova tentativa de pagamento ao array
            console.log(`Estudante ${existingStudent.id} existe, mas não possui inscrição para ${schoolClassID}. Criando nova...`);
            await prisma.students.update({
                where: { id: existingStudent.id },
                data: {
                    ...studentModelData,
                    name: nomeCompleto, // Atualiza o nome completo
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
            studentId = existingStudent.id;
        }
    } else {
        // 3. Se não existe, CRIAR novo estudante
        console.log(`Novo estudante. Criando registro...`);
        const newInscription = await prisma.students.create({
          data: {
            ...studentModelData,
            name: nomeCompleto, // Salva o nome completo
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
        console.log(`Inscrição criada no banco para ${nomeCompleto}.`);
    }

    // --- O restante do fluxo é para gerar um NOVO PIX ---
    
    // Recarregar os dados do estudante para pegar o TXID correto
    const studentData = await prisma.students.findUnique({ where: { id: studentId } });
    // Encontra a inscrição pendente para este curso (seja a recém-criada ou a recém-atualizada)
    const currentSubscription = studentData?.purcharsedSubscriptions.find(
        sub => sub.schoolClassID === schoolClassID && sub.paymentStatus === 'PENDENTE'
    );

    if (!currentSubscription || !currentSubscription.txid) {
         throw new Error('Falha ao localizar a inscrição pendente recém-criada/atualizada.');
    }

    const txid = currentSubscription.txid;
    console.log(`Iniciando geração de PIX para o txid: ${txid}`);

    // 4. Montar o corpo da requisição para o Santander
    const cobData = {
      calendario: { expiracao: 3600 },
      devedor: {
        cpf: sanitizedCpf,
        nome: nomeCompleto, // Usa o nome completo
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
      qrCodePayload: pixCopiaECola, // Corrigido: O payload do QR Code é o EMV
      copiaECola: pixCopiaECola,
      valor: createResponse.valor.original,
    };
  }
}

