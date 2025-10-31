import { Router, Request, Response } from "express";
import { prisma } from "../prisma";

// Interface para garantir a tipagem do payload que o Santander envia
interface SantanderPixTransaction {
  endToEndId: string;
  txid: string;
  chave: string;
  valor: string;
  horario: string;
}

const webhookSantanderRoutes = Router();

webhookSantanderRoutes.get('/santander', async (req: Request, res: Response) => {
  console.log('Recebida chamada de VALIDAÇÃO (GET) do Webhook Santander.');
  // Apenas retornamos 200 OK para confirmar que o endpoint existe e está vivo.
  res.sendStatus(200);
});


webhookSantanderRoutes.post('/santander', async (req: Request, res: Response) => {
  console.log('Webhook Santander PIX acionado');

  try {
    // O Santander envia um objeto que contém uma propriedade 'pix' com um array de notificações
    const pixNotifications: SantanderPixTransaction[] = req.body.pix;

    if (!pixNotifications || !Array.isArray(pixNotifications) || pixNotifications.length === 0) {
      console.log('Payload do webhook Santander vazio ou em formato inesperado.');
      // Retornamos 200 para o Santander entender que recebemos, mesmo que vazio, e não tente de novo.
      return res.sendStatus(200);
    }

    // Processamos cada notificação recebida (geralmente vem uma de cada vez)
    for (const pixRecebido of pixNotifications) {
      console.log(`Processando notificação para o txid: ${pixRecebido.txid}`);

      // Lógica principal: encontrar a inscrição (Student) que contém a subscrição com este txid
      const studentWithSubscription = await prisma.students.findFirst({
        where: {
          purcharsedSubscriptions: {
            some: { txid: pixRecebido.txid },
          },
        },
      });

      if (studentWithSubscription) {
        // Encontra a subscrição específica dentro do array para checar o status
        const subscription = studentWithSubscription.purcharsedSubscriptions.find(sub => sub.txid === pixRecebido.txid);

        // *** VERIFICAÇÃO DE IDEMPOTÊNCIA ***
        // Se a inscrição já foi marcada como paga, apenas ignoramos para evitar processamento duplicado.
        if (subscription && subscription.paymentStatus === 'CONCLUIDA') {
           console.log(`A inscrição com txid ${pixRecebido.txid} já foi processada anteriormente. Ignorando.`);
           continue; // Pula para a próxima notificação no loop
        }

        // Atualiza a inscrição específica dentro do array 'purcharsedSubscriptions'
        await prisma.students.update({
          where: { id: studentWithSubscription.id },
          data: {
            purcharsedSubscriptions: {
              updateMany: {
                where: { txid: pixRecebido.txid },
                data: {
                  paymentStatus: "CONCLUIDA",
                  pixStatus: "CONCLUIDA",
                  pixDate: pixRecebido.horario, // Guardamos a data/hora exata do pagamento
                },
              },
            },
          },
        });
        console.log(`Inscrição do estudante ${studentWithSubscription.name} (txid: ${pixRecebido.txid}) atualizada para CONCLUIDA.`);
      
      } else {
        // Adicionamos um log de aviso se nenhuma inscrição for encontrada
        console.warn(`Nenhuma inscrição de estudante encontrada para o txid: ${pixRecebido.txid}. Verificando doações...`);
        // Aqui você pode manter a lógica para checar doações, se necessário.
      }
    }

    // Responde ao Santander que o webhook foi recebido e processado com sucesso.
    res.sendStatus(200);

  } catch (error) {
    console.error('Erro fatal ao processar o webhook do Santander:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { webhookSantanderRoutes };