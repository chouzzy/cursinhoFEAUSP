import { Router } from "express";
import { prisma } from "../prisma";

// Interface para o payload que o Santander envia.
// Ele envia um array de transações diretamente no corpo da requisição.
interface SantanderPixTransaction {
  endToEndId: string;
  txid: string;
  chave: string;
  valor: string; // Santander envia valor como string
  horario: string;
}

const webhookSantanderRoutes = Router();

// Criamos uma rota específica, por exemplo, /santander
webhookSantanderRoutes.post('/santander', async (req, res) => {
  console.log('Webhook Santander PIX acionado');

  try {
    // O corpo da requisição do Santander é um array de transações
    const pixNotifications: SantanderPixTransaction[] = req.body.pix;

    // Verificamos se o corpo é um array e se tem itens
    if (!pixNotifications || !Array.isArray(pixNotifications) || pixNotifications.length === 0) {
      console.log('Payload do webhook Santander vazio ou em formato inesperado.');
      return res.sendStatus(200); // Retornamos 200 para o Santander não tentar de novo
    }

    // Processamos cada notificação recebida (geralmente vem uma por vez)
    for (const pixRecebido of pixNotifications) {
      console.log(`Processando txid: ${pixRecebido.txid}`);

      // A lógica de busca no banco é a mesma que você já tem
      const donation = await prisma.donations.findFirst({
        where: {
          txid: pixRecebido.txid
        }
      });

      if (donation) {
        await prisma.donations.update({
          where: {
            txid: pixRecebido.txid
          },
          data: {
            pixStatus: 'CONCLUIDA',
            paymentStatus: 'CONCLUIDA'
          }
        });
        console.log(`Doação com txid ${pixRecebido.txid} atualizada para CONCLUIDA.`);
      } else {
        // Se não for doação, procura em assinaturas de estudantes
        const student = await prisma.students.findFirst({
          where: {
            purcharsedSubscriptions: {
              some: {
                txid: pixRecebido.txid
              }
            }
          }
        });

        if (student) {
          await prisma.students.update({
            where: { id: student.id },
            data: {
              purcharsedSubscriptions: {
                updateMany: {
                  where: { txid: pixRecebido.txid },
                  data: {
                    paymentStatus: "CONCLUIDA",
                    pixStatus: "CONCLUIDA",
                  }
                }
              }
            }
          });
          console.log(`Assinatura do estudante ${student.name} (txid: ${pixRecebido.txid}) atualizada para CONCLUIDA.`);
        } else {
          console.warn(`Nenhuma doação ou assinatura encontrada para o txid: ${pixRecebido.txid}`);
        }
      }
    }

    res.sendStatus(200); // Envia a resposta de sucesso para o Santander

  } catch (error) {
    console.error('Erro ao processar o webhook do Santander:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { webhookSantanderRoutes };
