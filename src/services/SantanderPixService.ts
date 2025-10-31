import { prisma } from "../prisma";
import { santanderApiClient } from "../lib/santanderApiClient";
import { randomBytes, randomUUID } from 'crypto';
import { Students } from "@prisma/client";
import { crc16ccitt } from "crc";

// Este tipo representa os dados que esperamos que o frontend envie.
type InscriptionData = Omit<Students, 'id' | 'createdAt' | 'purcharsedSubscriptions' | 'stripeCustomerID'> & {
  schoolClassID: string;
};

const INSCRIPTION_PRICE = "10.00";

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

  async createInscriptionWithPix(inscriptionData: any) {
    // 1. Gerar txid sem hífen
    const txid = `insc${randomBytes(14).toString('hex')}`;

    const { schoolClassID, price, ...studentModelData } = inscriptionData;

    // 2. Salvar a inscrição no banco de dados com status "PENDENTE"
    const newInscription = await prisma.students.create({
      data: {
        ...studentModelData,
        stripeCustomerID: randomUUID(),
        purcharsedSubscriptions: [{
          schoolClassID: schoolClassID,
          txid: txid,
          paymentMethod: "pix_santander",
          paymentStatus: "PENDENTE",
          pixStatus: "PENDENTE",
          paymentDate: new Date(),
          valuePaid: parseFloat(INSCRIPTION_PRICE),
        }]
      },
    });

    console.log(`Inscrição criada no banco para ${newInscription.name} com txid: ${txid}`);

    // 3. Limpar o CPF
    const sanitizedCpf = inscriptionData.cpf.replace(/\D/g, '');

    console.log(`CPF sanitizado para a cobrança PIX: ${sanitizedCpf}`);
    console.log(`Nome do devedor: ${inscriptionData.name}`);
    console.log(`Valor da cobrança: ${INSCRIPTION_PRICE}`);
    console.log(`Chave PIX usada: ${process.env.SANTANDER_PIX_KEY}`);


    // 4. Montar o corpo da requisição para o Santander
    const cobData = {
      calendario: {
        expiracao: 3600,
      },
      devedor: {
        cpf: sanitizedCpf,
        nome: inscriptionData.name,
      },
      valor: {
        original: INSCRIPTION_PRICE,
      },
      chave: process.env.SANTANDER_PIX_KEY!,
      solicitacaoPagador: "Taxa de Inscrição Cursinho FEA USP",
    };

    // 5. Chamar nosso cliente de API para CRIAR a cobrança
    // (Esta chamada ainda está falhando com 500, o que precisamos resolver a seguir,
    // mas a lógica de tratamento da *resposta* está sendo corrigida agora)
    const createResponse = await santanderApiClient.createCob(txid, cobData);
    console.log(`Cobrança PIX criada no Santander para o txid: ${txid}. Status: ${createResponse.status}`);

    // **ETAPA CORRIGIDA: Construir o "Copia e Cola" (EMV) manualmente**
    const nomeRecebedor = process.env.SANTANDER_RECEBEDOR_NOME || "CURSINHO FEA USP";
    const cidadeRecebedor = process.env.SANTANDER_RECEBEDOR_CIDADE || "SAO PAULO";

    const pixCopiaECola = buildEMVString(
      createResponse.location.replace('https://', ''), // O 'location' não deve ter o 'https://'
      createResponse.txid,
      createResponse.valor.original,
      nomeRecebedor,
      cidadeRecebedor
    );

    console.log(`PIX Copia e Cola gerado: ${pixCopiaECola}`);

    // 7. Atualizar a inscrição no banco com os dados do PIX gerado
    await prisma.students.update({
      where: { id: newInscription.id },
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
      qrCodePayload: pixCopiaECola, // O frontend usa isso para o <QRCode>
      copiaECola: pixCopiaECola,             // E usa isso para o botão de copiar
      valor: createResponse.valor.original,
    };
  }
}

