import { prisma } from "../prisma";
import { santanderApiClient } from "../lib/santanderApiClient";
import { randomBytes, randomUUID } from 'crypto';
import { Students } from "@prisma/client";
import { crc16ccitt } from 'crc'; // Importamos a função de CRC

// Este tipo representa os dados que esperamos que o frontend envie.
// Atualizado com os novos campos obrigatórios e opcionais.
type InscriptionData = Omit<Students, 'id' | 'createdAt' | 'purcharsedSubscriptions' | 'stripeCustomerID' | 'name' | 'emailResponsavel' | 'aceiteTermoCiencia' | 'aceiteTermoInscricao'> & {
  schoolClassID: string;
  nome: string;
  sobrenome: string;
  aceiteTermoCiencia: boolean;
  aceiteTermoInscricao: boolean;
  emailResponsavel?: string; // Opcional
  codigoDesconto?: string; // Opcional
};

// O valor da taxa de inscrição PADRÃO.
const INSCRIPTION_PRICE_DEFAULT = 36.00; 

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
    // 1. Separar dados, limpar CPF e CONCATENAR O NOME
    const { 
      schoolClassID, 
      price, // Ignoramos o 'price' vindo do front
      nome, 
      sobrenome, 
      codigoDesconto, 
      emailResponsavel,
      aceiteTermoCiencia,
      aceiteTermoInscricao, 
      ...studentModelData 
    } = inscriptionData;

    // Validação dos termos (o frontend já deve fazer isso, mas é bom garantir)
    if (!aceiteTermoCiencia || !aceiteTermoInscricao) {
      throw new Error('Os termos de ciência e inscrição são obrigatórios.');
    }

    const nomeCompleto = `${nome} ${sobrenome}`;
    const sanitizedCpf = inscriptionData.cpf.replace(/\D/g, '');
    let studentId: string;

    // --- LÓGICA DE DESCONTO ---
    console.log('Inscription data received:', inscriptionData.price);
    let finalPrice = inscriptionData.price   || INSCRIPTION_PRICE_DEFAULT;
    let couponCodeUsed: string | undefined = undefined;

    if (codigoDesconto) {
      console.log(`Verificando código de desconto: ${codigoDesconto}`);
      const coupon = await prisma.discountCoupon.findFirst({
        where: {
          code: codigoDesconto,
          isActive: true
        }
      });

      if (coupon) {
        // TODO: Adicionar checagem de maxUses vs currentUses se necessário
        finalPrice = finalPrice - coupon.discountValue;
        if (finalPrice < 0) finalPrice = 0; // Não permite preço negativo
        couponCodeUsed = coupon.code;
        console.log(`Cupom aplicado! Novo preço: ${finalPrice}`);
      } else {
        console.warn(`Código de desconto inválido ou inativo: ${codigoDesconto}`);
        // Opcional: Lançar um erro se o cupom for inválido
        // throw new Error('Código de desconto inválido.');
      }
    }
    // --- FIM DA LÓGICA DE DESCONTO ---

    // 2. VERIFICAR SE O USUÁRIO JÁ EXISTE (POR CPF OU EMAIL)
    let existingStudent = await prisma.students.findFirst({
        where: { OR: [{ email: inscriptionData.email }, { cpf: sanitizedCpf }] }
    });

    if (existingStudent) {
        console.log(`Estudante já encontrado com email/cpf. ID: ${existingStudent.id}`);
        studentId = existingStudent.id;

        const existingSubscription = existingStudent.purcharsedSubscriptions.find(
            sub => sub.schoolClassID === schoolClassID
        );

        if (existingSubscription) {
            if (existingSubscription.paymentStatus === 'CONCLUIDA') {
                console.warn(`Estudante ${existingStudent.id} já possui inscrição PAGA para a turma ${schoolClassID}.`);
                throw new Error('Você já está inscrito e com o pagamento confirmado para esta turma.');
            }

            if (existingSubscription.paymentStatus === 'PENDENTE') {
                const isDataPresent = existingSubscription.pixCopiaECola && existingSubscription.pixQrCode;
                const isTxidValid = existingSubscription.txid && !existingSubscription.txid.includes('-');
                const agora = new Date();
                const dataCriacao = new Date(existingSubscription.paymentDate!);
                const expiracao = new Date(dataCriacao.getTime() + 3600 * 1000); // 1 hora
                const isExpired = agora > expiracao;

                if (isDataPresent && isTxidValid && !isExpired && !codigoDesconto) {
                    console.log(`Estudante ${existingStudent.id} já possui um PIX PENDENTE VÁLIDO. Reutilizando...`);
                    
                    // Atualiza dados cadastrais
                    await prisma.students.update({
                        where: { id: existingStudent.id },
                        data: {
                            ...studentModelData,
                            name: nomeCompleto,
                            cpf: sanitizedCpf,
                            emailResponsavel: emailResponsavel,
                            aceiteTermoCiencia: aceiteTermoCiencia,
                            aceiteTermoInscricao: aceiteTermoInscricao,
                        }
                    });
                    
                    return {
                      txid: existingSubscription.txid,
                      qrCodePayload: existingSubscription.pixCopiaECola,
                      copiaECola: existingSubscription.pixCopiaECola,
                      valor: existingSubscription.valuePaid.toFixed(2),
                    };
                } else {
                    const newTxid = `insc${randomBytes(14).toString('hex')}`;
                    console.warn(`Estudante ${existingStudent.id} possui PIX pendente inválido/expirado. Atualizando com novo txid: ${newTxid}`);

                    await prisma.students.update({
                      where: { id: existingStudent.id },
                      data: {
                        ...studentModelData,
                        name: nomeCompleto, 
                        cpf: sanitizedCpf,
                        emailResponsavel: emailResponsavel,
                        aceiteTermoCiencia: aceiteTermoCiencia,
                        aceiteTermoInscricao: aceiteTermoInscricao,
                        purcharsedSubscriptions: {
                          updateMany: {
                            where: { 
                              schoolClassID: schoolClassID,
                              paymentStatus: 'PENDENTE' 
                            },
                            data: {
                              txid: newTxid, 
                              paymentMethod: "pix_santander",
                              paymentDate: new Date(),
                              valuePaid: parseFloat(String(finalPrice)), // Converte string '36.50' para número 36.5
                              codigoDesconto: couponCodeUsed, // Salva o cupom
                              pixCopiaECola: null, 
                              pixQrCode: null,
                            }
                          }
                        }
                      }
                    });
                    studentId = existingStudent.id;
                }
            }
        } else {
            console.log(`Estudante ${existingStudent.id} existe, mas não possui inscrição para ${schoolClassID}. Criando nova...`);
            await prisma.students.update({
                where: { id: existingStudent.id },
                data: {
                    ...studentModelData,
                    name: nomeCompleto,
                    cpf: sanitizedCpf,
                    emailResponsavel: emailResponsavel,
                    aceiteTermoCiencia: aceiteTermoCiencia,
                    aceiteTermoInscricao: aceiteTermoInscricao,
                    purcharsedSubscriptions: {
                        push: [{
                            schoolClassID: schoolClassID,
                            txid: `insc${randomBytes(14).toString('hex')}`,
                            paymentMethod: "pix_santander",
                            paymentStatus: "PENDENTE",
                            pixStatus: "PENDENTE",
                            paymentDate: new Date(),
                            valuePaid: parseFloat(String(finalPrice)),
                            codigoDesconto: couponCodeUsed,
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
            name: nomeCompleto, 
            cpf: sanitizedCpf,
            emailResponsavel: emailResponsavel,
            aceiteTermoCiencia: aceiteTermoCiencia,
            aceiteTermoInscricao: aceiteTermoInscricao,
            stripeCustomerID: randomUUID(), 
            purcharsedSubscriptions: [{
                schoolClassID: schoolClassID,
                txid: `insc${randomBytes(14).toString('hex')}`,
                paymentMethod: "pix_santander",
                paymentStatus: "PENDENTE",
                pixStatus: "PENDENTE",
                paymentDate: new Date(),
                valuePaid: parseFloat(String(finalPrice)),
                codigoDesconto: couponCodeUsed,
            }]
          },
        });
        studentId = newInscription.id;
        console.log(`Inscrição criada no banco para ${nomeCompleto}.`);
    }

    // --- O restante do fluxo é para gerar um NOVO PIX ---
    
    const studentData = await prisma.students.findUnique({ where: { id: studentId } });
    const currentSubscription = studentData?.purcharsedSubscriptions.find(
        sub => sub.schoolClassID === schoolClassID && sub.paymentStatus === 'PENDENTE'
    );

    if (!currentSubscription || !currentSubscription.txid) {
         throw new Error('Falha ao localizar a inscrição pendente recém-criada/atualizada.');
    }

    const txid = currentSubscription.txid;
    const priceForPix = currentSubscription.valuePaid.toFixed(2); // Pega o preço final do banco
    console.log(`Iniciando geração de PIX para o txid: ${txid} com valor de R$${priceForPix}`);

    // 4. Montar o corpo da requisição para o Santander
    const cobData = {
      calendario: { expiracao: 3600 },
      devedor: {
        cpf: sanitizedCpf,
        nome: nomeCompleto,
      },
      valor: { original: priceForPix }, // Usa o preço final (com desconto, se houver)
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
      qrCodePayload: pixCopiaECola, // Corrigido para enviar o EMV para o QR Code
      copiaECola: pixCopiaECola,
      valor: createResponse.valor.original,
    };
  }
}

