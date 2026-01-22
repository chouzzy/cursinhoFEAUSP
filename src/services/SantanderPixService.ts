import { prisma } from "../prisma";
import { santanderApiClient } from "../lib/santanderApiClient";
import { randomBytes, randomUUID } from 'crypto';
import { Students } from "@prisma/client";
import { crc16ccitt } from 'crc'; 

type InscriptionData = Omit<Students, 'id' | 'createdAt' | 'purcharsedSubscriptions' | 'stripeCustomerID' | 'name' | 'emailResponsavel' | 'aceiteTermoCiencia' | 'aceiteTermoInscricao'> & {
  schoolClassID: string;
  nome: string;
  sobrenome: string;
  codigoDesconto?: string; 
  emailResponsavel?: string; 
  paymentMethod?: string;
};

const INSCRIPTION_PRICE_DEFAULT = 36.00

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

export class SantanderPixService {

  async createInscriptionWithPix(inscriptionData: any) { 
    // Limpeza de dados
    // ADICIONADO: 'cpf' na desestruturação para retirá-lo de studentModelData
    const { 
      schoolClassID, 
      price, 
      nome, 
      sobrenome, 
      codigoDesconto, 
      emailResponsavel,
      aceiteTermoCiencia,
      aceiteTermoInscricao,
      paymentMethod,
      cpf, // <--- REMOVIDO DO SPREAD
      ...studentModelData 
    } = inscriptionData;

    if (!aceiteTermoCiencia || !aceiteTermoInscricao) {
      throw new Error('Os termos de ciência e inscrição são obrigatórios.');
    }

    const nomeCompleto = `${nome} ${sobrenome}`;
    // Usamos o CPF que extraímos para sanitizar
    const sanitizedCpf = cpf.replace(/\D/g, '');
    
    // Busca informações da turma
    const schoolClass = await prisma.schoolClass.findUnique({
        where: { id: schoolClassID }
    });
    const nomeTurma = schoolClass?.title || 'Turma';

    // Lógica de Desconto
    let finalPrice = INSCRIPTION_PRICE_DEFAULT;
    let couponCodeUsed: string | undefined = undefined;

    if (codigoDesconto) {
      const coupon = await prisma.discountCoupon.findFirst({
        where: { code: codigoDesconto, isActive: true }
      });
      if (coupon) {
        finalPrice = INSCRIPTION_PRICE_DEFAULT - coupon.discountValue;
        if (finalPrice < 0) finalPrice = 0; 
        couponCodeUsed = coupon.code;
      }
    }

    // 1. GERAÇÃO DE NOVO TXID
    const txid = `insc${randomBytes(14).toString('hex')}`; 

    let studentId: string;

    // 2. BUSCA DO ESTUDANTE
    let existingStudent = await prisma.students.findFirst({
        where: { cpf: sanitizedCpf }
    });

    if (existingStudent) {
        studentId = existingStudent.id;
        console.log(`Estudante encontrado por CPF. ID: ${studentId}`);

        // Verifica se já existe inscrição CONCLUÍDA para esta turma
        const completedSubscription = existingStudent.purcharsedSubscriptions.find(
            sub => sub.schoolClassID === schoolClassID && sub.paymentStatus === 'CONCLUIDA'
        );

        if (completedSubscription) {
            throw new Error('Você já está inscrito e com o pagamento confirmado para esta turma.');
        }

        console.log(`Criando nova intenção de pagamento (push) para o aluno existente...`);
        
        await prisma.students.update({
            where: { id: studentId },
            data: {
                ...studentModelData, // NÃO CONTÉM MAIS O CPF BRUTO
                name: nomeCompleto,
                email: inscriptionData.email,
                emailResponsavel: emailResponsavel,
                aceiteTermoCiencia: aceiteTermoCiencia,
                aceiteTermoInscricao: aceiteTermoInscricao,
                // Garantimos que o CPF no banco seja o sanitizado (embora já deva ser)
                cpf: sanitizedCpf, 
                
                purcharsedSubscriptions: {
                    push: [{
                        schoolClassID: schoolClassID,
                        productName: nomeTurma,
                        txid: txid,
                        paymentMethod: "pix_santander",
                        paymentStatus: "PENDENTE",
                        pixStatus: "PENDENTE",
                        paymentDate: new Date(),
                        valuePaid: finalPrice,
                        codigoDesconto: couponCodeUsed,
                    }]
                }
            }
        });

    } else {
        // 3. CRIAR NOVO ESTUDANTE
        console.log(`CPF não encontrado. Criando novo registro de estudante...`);
        const newInscription = await prisma.students.create({
          data: {
            ...studentModelData, // NÃO CONTÉM MAIS O CPF BRUTO
            name: nomeCompleto, 
            cpf: sanitizedCpf, // CPF Limpo
            email: inscriptionData.email,
            emailResponsavel: emailResponsavel,
            aceiteTermoCiencia: aceiteTermoCiencia,
            aceiteTermoInscricao: aceiteTermoInscricao,
            stripeCustomerID: randomUUID(), 
            purcharsedSubscriptions: [{
                schoolClassID: schoolClassID,
                productName: nomeTurma,
                txid: txid,
                paymentMethod: "pix_santander",
                paymentStatus: "PENDENTE",
                pixStatus: "PENDENTE",
                paymentDate: new Date(),
                valuePaid: finalPrice,
                codigoDesconto: couponCodeUsed,
            }]
          },
        });
        studentId = newInscription.id;
    }
    
    // --- GERAÇÃO DA COBRANÇA PIX ---
    console.log(`Gerando cobrança PIX para txid: ${txid}`);
    
    const priceForPix = finalPrice.toFixed(2); 

    const cobData = {
      calendario: { expiracao: 3600 },
      devedor: {
        cpf: sanitizedCpf,
        nome: nomeCompleto,
      },
      valor: { original: priceForPix },
      chave: process.env.SANTANDER_PIX_KEY!,
      solicitacaoPagador: "Taxa de Inscrição Cursinho FEA USP",
    };

    const createResponse = await santanderApiClient.createCob(txid, cobData);
    
    const nomeRecebedor = process.env.SANTANDER_RECEBEDOR_NOME || "CURSINHO FEA USP";
    const cidadeRecebedor = process.env.SANTANDER_RECEBEDOR_CIDADE || "SAO PAULO";
    
    const pixCopiaECola = buildEMVString(
      createResponse.location.replace('https://', ''),
      createResponse.txid,
      createResponse.valor.original,
      nomeRecebedor,
      cidadeRecebedor
    );

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

    return {
      txid: txid,
      qrCodePayload: pixCopiaECola,
      copiaECola: pixCopiaECola,
      valor: createResponse.valor.original,
    };
  }
}