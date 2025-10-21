import { prisma } from "../prisma";
import { santanderApiClient } from "../lib/santanderApiClient";
import { randomBytes, randomUUID } from 'crypto';
import { Students } from "@prisma/client";

// **TIPO ATUALIZADO** - Derivado diretamente do modelo Prisma 'Students'
// Omitimos os campos gerados pelo servidor e adicionamos o 'schoolClassID' que vem do frontend.
type InscriptionData = Omit<Students, 'id' | 'createdAt' | 'purcharsedSubscriptions' | 'stripeCustomerID'> & {
  schoolClassID: string;
};

// O valor da taxa de inscrição. Colocamos aqui para fácil manutenção.
// Lembre-se que o Santander espera uma string com duas casas decimais.
const INSCRIPTION_PRICE = "10.00"; 

export class SantanderPixService {

  /**
   * Orquestra a criação de uma nova inscrição e a geração da cobrança PIX.
   * @param inscriptionData - Os dados do estudante vindos do formulário.
   */
  async createInscriptionWithPix(inscriptionData: InscriptionData) {
    // 1. Gerar um txid único para esta transação
    // O padrão do Santander é [a-zA-Z0-9]{26,35}. Usamos um prefixo para fácil identificação nos logs.
    const txid = `insc-${randomBytes(14).toString('hex')}`;

    // 2. Salvar a inscrição (Student) no banco de dados com status inicial "PENDENTE"
    const newInscription = await prisma.students.create({
      data: {
        ...inscriptionData, // Salva todos os dados recebidos do formulário
        // Como o fluxo é via Santander, geramos um UUID como placeholder
        // para o campo obrigatório stripeCustomerID.
        stripeCustomerID: randomUUID(), 
        purcharsedSubscriptions: [{
            schoolClassID: inscriptionData.schoolClassID,
            txid: txid,
            paymentMethod: "pix_santander",
            paymentStatus: "PENDENTE",
            pixStatus: "PENDENTE",
            paymentDate: new Date(), // Data da criação da tentativa de pagamento
            valuePaid: parseFloat(INSCRIPTION_PRICE),
        }]
      },
    });

    console.log(`Inscrição criada no banco para ${newInscription.name} com txid: ${txid}`);

    // 3. Montar o corpo da requisição para a API do Santander
    const cobData = {
      calendario: {
        expiracao: 3600, // Cobrança PIX expira em 1 hora
      },
      devedor: {
        cpf: inscriptionData.cpf,
        nome: inscriptionData.name,
      },
      valor: {
        original: INSCRIPTION_PRICE,
      },
      chave: process.env.SANTANDER_PIX_KEY!, // Sua chave PIX de produção, vinda do .env
      solicitacaoPagador: "Taxa de Inscrição Cursinho FEA USP",
    };

    // 4. Chamar nosso cliente de API para criar a cobrança no Santander
    const santanderResponse = await santanderApiClient.createCob(txid, cobData);

    console.log(`Cobrança PIX criada no Santander para o txid: ${txid}`);

    // 5. Opcional, mas recomendado: Atualizar a inscrição no banco com os dados do PIX gerado.
    // Isso permite que você regenere o QR Code para o usuário se ele fechar a página, por exemplo.
    await prisma.students.update({
        where: { id: newInscription.id },
        data: {
            purcharsedSubscriptions: {
                updateMany: { // Encontra o item certo no array para atualizar
                    where: { txid: txid },
                    data: {
                        pixCopiaECola: santanderResponse.pixCopiaECola,
                        pixQrCode: santanderResponse.location,
                    }
                }
            }
        }
    });

    // 6. Retornar os dados essenciais para o frontend
    return {
      txid: santanderResponse.txid,
      qrCodePayload: santanderResponse.location, // O frontend usa isso para gerar a imagem do QR Code
      copiaECola: santanderResponse.pixCopiaECola, // O payload "copia e cola"
      valor: santanderResponse.valor.original,
    };
  }
}

