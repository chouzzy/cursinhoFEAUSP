import { prisma } from "../prisma";
import { santanderApiClient } from "../lib/santanderApiClient";
import { randomBytes, randomUUID } from 'crypto';
import { Students } from "@prisma/client";

// Este tipo representa os dados que esperamos que o frontend envie.
type InscriptionData = Omit<Students, 'id' | 'createdAt' | 'purcharsedSubscriptions' | 'stripeCustomerID'> & {
  schoolClassID: string;
};

const INSCRIPTION_PRICE = "10.00"; 

export class SantanderPixService {

  async createInscriptionWithPix(inscriptionData: any) {
    const txid = `insc${randomBytes(14).toString('hex')}`;

    const { schoolClassID, price, ...studentModelData } = inscriptionData;

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

    // **A CORREÇÃO ESTÁ AQUI**
    // Limpamos o CPF para remover pontos, traços e qualquer outro caractere não numérico.
    const sanitizedCpf = inscriptionData.cpf.replace(/\D/g, '');

    console.log(`CPF sanitizado para a cobrança PIX: ${sanitizedCpf}`);
    console.log(`Nome do devedor: ${inscriptionData.name}`);
    console.log(`Valor da cobrança: ${INSCRIPTION_PRICE}`);
    console.log(`Chave PIX usada: ${process.env.SANTANDER_PIX_KEY}`);

    // Montar o corpo da requisição para a API do Santander
    const cobData = {
      calendario: {
        expiracao: 3600,
      },
      devedor: {
        cpf: sanitizedCpf, // Usamos o CPF "limpo" aqui
        nome: inscriptionData.name,
      },
      valor: {
        original: INSCRIPTION_PRICE,
      },
      chave: process.env.SANTANDER_PIX_KEY!,
      solicitacaoPagador: "Taxa de Inscrição Cursinho FEA USP",
    };

    // Chamar nosso cliente de API para criar a cobrança no Santander
    const santanderResponse = await santanderApiClient.createCob(txid, cobData);

    console.log(`Cobrança PIX criada no Santander para o txid: ${txid}`);

    // Atualizar a inscrição no banco com os dados do PIX gerado
    await prisma.students.update({
        where: { id: newInscription.id },
        data: {
            purcharsedSubscriptions: {
                updateMany: {
                    where: { txid: txid },
                    data: {
                        pixCopiaECola: santanderResponse.pixCopiaECola,
                        pixQrCode: santanderResponse.location,
                    }
                }
            }
        }
    });

    // Retornar os dados essenciais para o frontend
    return {
      txid: santanderResponse.txid,
      qrCodePayload: santanderResponse.location,
      copiaECola: santanderResponse.pixCopiaECola,
      valor: santanderResponse.valor.original,
    };
  }
}

