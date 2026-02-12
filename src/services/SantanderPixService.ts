import { prisma } from "../prisma";
import { santanderApiClient } from "../lib/santanderApiClient";
import { randomBytes, randomUUID } from 'crypto';
import { Students } from "@prisma/client";
import { crc16ccitt } from 'crc'; // Usando a lib oficial de CRC

type InscriptionData = Omit<Students, 'id' | 'createdAt' | 'purcharsedSubscriptions' | 'stripeCustomerID' | 'name' | 'emailResponsavel' | 'aceiteTermoCiencia' | 'aceiteTermoInscricao'> & {
  schoolClassID: string;
  nome: string;
  sobrenome: string;
  codigoDesconto?: string; 
  emailResponsavel?: string; 
  paymentMethod?: string;
};

const INSCRIPTION_PRICE_DEFAULT = 35.00; 

// Remove acentos e caracteres especiais para garantir compatibilidade bancária
function normalizeText(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^a-zA-Z0-9 ]/g, "")   // Remove símbolos não-alfanuméricos
        .toUpperCase()
        .trim();
}

function formatEMVField(id: string, value: string): string {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
}

// Função robusta para gerar o PIX Copia e Cola DINÂMICO (Baseado em URL/Location)
// Padrão BR Code do Banco Central
function generateDynamicEMV(location: string, nomeRecebedor: string, cidadeRecebedor: string): string {
    // 1. Tratamento da URL (Remove protocolo https://)
    const cleanLocation = location.replace(/^https?:\/\//, '');

    // 2. Normalização de Textos (Limites rígidos do padrão EMV)
    const nome = normalizeText(nomeRecebedor).substring(0, 25);
    const cidade = normalizeText(cidadeRecebedor).substring(0, 15);

    // 3. Montagem dos Campos
    const f00 = formatEMVField("00", "01"); // Payload Format
    const f01 = formatEMVField("01", "12"); // Point of Initiation (12 = Dinâmico)
    
    // Campo 26: Merchant Account Information
    const gui = formatEMVField("00", "br.gov.bcb.pix");
    const urlField = formatEMVField("25", cleanLocation);
    const f26 = formatEMVField("26", gui + urlField);

    const f52 = formatEMVField("52", "0000"); // Merchant Category Code
    const f53 = formatEMVField("53", "986");  // Moeda (BRL)
    const f58 = formatEMVField("58", "BR");   // País
    const f59 = formatEMVField("59", nome);   // Nome Recebedor
    const f60 = formatEMVField("60", cidade); // Cidade Recebedor
    
    // Campo 62: Additional Data (TxID)
    // Em QR Dinâmico, o TxID já está atrelado à URL no banco, então usamos ***
    // Isso evita conflitos de validação em alguns bancos
    const f62 = formatEMVField("62", formatEMVField("05", "***"));

    // 4. Montagem do Payload parcial (tudo exceto o CRC)
    const payload = f00 + f01 + f26 + f52 + f53 + f58 + f59 + f60 + f62 + "6304";

    // 5. Cálculo do CRC16
    // Usamos a lib 'crc' para garantir precisão (polinômio 0x1021, init 0xFFFF)
    const crc = crc16ccitt(payload).toString(16).toUpperCase().padStart(4, '0');

    return payload + crc;
}

export class SantanderPixService {

  async createInscriptionWithPix(inscriptionData: any) { 
    // Removemos campos desnecessários antes de salvar
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
      cpf, // Removemos cpf bruto
      ...studentModelData 
    } = inscriptionData;

    if (!aceiteTermoCiencia || !aceiteTermoInscricao) {
      throw new Error('Os termos de ciência e inscrição são obrigatórios.');
    }

    const nomeCompleto = `${nome} ${sobrenome}`;
    const sanitizedCpf = cpf.replace(/\D/g, '');
    let studentId: string;

    const schoolClass = await prisma.schoolClass.findUnique({
        where: { id: schoolClassID }
    });
    const nomeTurma = schoolClass?.title || 'Turma';

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

    const txid = `insc${randomBytes(14).toString('hex')}`; 

    let existingStudent = await prisma.students.findFirst({
        where: { cpf: sanitizedCpf }
    });

    if (existingStudent) {
        studentId = existingStudent.id;
        const completedSubscription = existingStudent.purcharsedSubscriptions.find(
            sub => sub.schoolClassID === schoolClassID && sub.paymentStatus === 'CONCLUIDA'
        );

        if (completedSubscription) {
            throw new Error('Você já está inscrito e com o pagamento confirmado para esta turma.');
        }
        
        await prisma.students.update({
            where: { id: existingStudent.id },
            data: {
                ...studentModelData, 
                name: nomeCompleto,
                email: inscriptionData.email,
                emailResponsavel: emailResponsavel,
                aceiteTermoCiencia: aceiteTermoCiencia,
                aceiteTermoInscricao: aceiteTermoInscricao,
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
        const newInscription = await prisma.students.create({
          data: {
            ...studentModelData, 
            name: nomeCompleto, 
            cpf: sanitizedCpf,
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
    
    // --- GERAÇÃO PIX ---
    const priceForPix = finalPrice.toFixed(2); 

    const cobData = {
      calendario: { expiracao: 3600 },
      devedor: {
        cpf: sanitizedCpf,
        nome: normalizeText(nomeCompleto).substring(0, 200),
      },
      valor: { original: priceForPix },
      chave: process.env.SANTANDER_PIX_KEY!,
      solicitacaoPagador: "Inscricao Cursinho FEA USP",
    };

    // 1. Cria cobrança no Santander
    const createResponse = await santanderApiClient.createCob(txid, cobData);
    
    // 2. Gera o Copia e Cola CORRETO (Dinâmico) usando a location
    const pixCopiaECola = generateDynamicEMV(
      createResponse.location, 
      "ASSOC EDUC VISCONDE CAIRU", // Nome exato da conta bancária
      "SAO PAULO"
    );

    // 3. Atualiza o banco
    await prisma.students.update({
        where: { id: studentId },
        data: {
            purcharsedSubscriptions: {
                updateMany: {
                    where: { txid: txid },
                    data: {
                        pixCopiaECola: pixCopiaECola,
                        pixQrCode: pixCopiaECola, // O QRCode usa o mesmo payload EMV
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