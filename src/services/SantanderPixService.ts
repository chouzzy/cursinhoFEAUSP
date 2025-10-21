import { prisma } from "../prisma";
import { santanderApiClient } from "../lib/santanderApiClient";
import { randomBytes, randomUUID } from 'crypto';
import { Students } from "@prisma/client";

// Este tipo representa os dados que esperamos que o frontend envie.
// Ele inclui todos os campos do modelo Student + o schoolClassID.
type InscriptionData = Omit<Students, 'id' | 'createdAt' | 'purcharsedSubscriptions' | 'stripeCustomerID'> & {
  schoolClassID: string;
};

const INSCRIPTION_PRICE = "10.00"; 

export class SantanderPixService {

  async createInscriptionWithPix(inscriptionData: any) { // Alterado para 'any' para lidar com dados inesperados do frontend
    const txid = `insc-${randomBytes(14).toString('hex')}`;

    // **A CORREÇÃO ESTÁ AQUI**
    // 1. Separamos os campos que NÃO pertencem diretamente ao modelo Student.
    // O frontend está enviando 'price' e 'schoolClassID' que não devem ser salvos na raiz do documento.
    const { schoolClassID, price, ...studentModelData } = inscriptionData;

    // 2. Criamos o Student no banco de dados
    const newInscription = await prisma.students.create({
      data: {
        // Agora, espalhamos apenas os dados que realmente existem no modelo 'Students'
        ...studentModelData, 
        
        // Geramos um UUID como placeholder para o campo obrigatório stripeCustomerID
        stripeCustomerID: randomUUID(), 

        // Criamos a subscription com o schoolClassID que separamos
        purcharsedSubscriptions: [{
            schoolClassID: schoolClassID, // Usamos a variável separada aqui
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

    // Montar o corpo da requisição para a API do Santander
    const cobData = {
      calendario: {
        expiracao: 3600,
      },
      devedor: {
        cpf: inscriptionData.cpf,
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

