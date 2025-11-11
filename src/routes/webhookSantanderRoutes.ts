import { Router, Request, Response } from "express";
import { prisma } from "../prisma";

interface SantanderPixTransaction {
  endToEndId: string;
  txid: string;
  chave: string;
  valor: string; // Santander envia valor como string
  horario: string;
}

const webhookSantanderRoutes = Router();

// Rota GET (validação) - permanece igual
webhookSantanderRoutes.get('/santander', async (req: Request, res: Response) => {
  console.log('Recebida chamada de VALIDAÇÃO (GET) do Webhook Santander.');
  res.sendStatus(200);
});


// Rota POST (notificação de pagamento)
webhookSantanderRoutes.post('/santander', async (req: Request, res: Response) => {
  console.log('Webhook Santander PIX (POST) acionado');

  try {
    const pixNotifications: SantanderPixTransaction[] = req.body.pix;

    if (!pixNotifications || !Array.isArray(pixNotifications) || pixNotifications.length === 0) {
      console.log('Payload do webhook Santander vazio ou em formato inesperado.');
      return res.sendStatus(200);
    }

    for (const pixRecebido of pixNotifications) {
      console.log(`Processando txid: ${pixRecebido.txid}`);

      // 1. Tenta encontrar o txid em uma Doação (lógica existente)
      const donation = await prisma.donations.findFirst({
        where: { txid: pixRecebido.txid },
      });

      if (donation) {
        // ... (lógica de atualização da doação) ...
        if (donation.paymentStatus === 'CONCLUIDA') {
          console.log(`Doação com txid ${pixRecebido.txid} já foi processada. Ignorando.`);
          continue;
        }
        await prisma.donations.update({
          where: { id: donation.id },
          data: { pixStatus: 'CONCLUIDA', paymentStatus: 'CONCLUIDA' },
        });
        console.log(`Doação com txid ${pixRecebido.txid} atualizada.`);
        continue;
      }

      // 2. Se não encontrou em doações, procura em inscrições (Students)
      const studentWithSubscription = await prisma.students.findFirst({
        where: {
          purcharsedSubscriptions: {
            some: { txid: pixRecebido.txid },
          },
        },
      });

      if (studentWithSubscription) {
        // Encontra a inscrição específica
        const subscription = studentWithSubscription.purcharsedSubscriptions.find(sub => sub.txid === pixRecebido.txid);
        
        if (!subscription) {
            console.warn(`Inscrição não encontrada para o txid ${pixRecebido.txid} dentro do aluno ${studentWithSubscription.id}`);
            continue;
        }

        // Checagem de idempotência
        if (subscription.paymentStatus === 'CONCLUIDA') {
           console.log(`Inscrição com txid ${pixRecebido.txid} já foi processada. Ignorando.`);
           continue;
        }

        // **INÍCIO DA NOVA LÓGICA DE GERAÇÃO DE MATRÍCULA**
        let novaMatriculaID = null;
        try {
          // 1. Incrementa o contador da turma atomicamente
          // Esta operação garante que o número seja único
          const turma = await prisma.schoolClass.update({
            where: { id: subscription.schoolClassID },
            data: {
              registrationCounter: {
                increment: 1
              }
            }
          });

          // 2. Pega os dados para formar o ID
          const ano = new Date().getFullYear();
          const codigoTurma = turma.code || 'GERAL'; // Usa 'GERAL' se o código da turma não estiver definido
          // O 'registrationCounter' retornado já é o número incrementado e único
          const sequencial = turma.registrationCounter.toString().padStart(4, '0'); // Formata para 0001, 0002...

          novaMatriculaID = `${ano}${codigoTurma}${sequencial}`;
          console.log(`Novo ID de Matrícula gerado: ${novaMatriculaID}`);

        } catch (error: any) {
          console.error(`ERRO CRÍTICO ao gerar ID de Matrícula para txid ${pixRecebido.txid}: ${error.message}`);
          // Continua para salvar o pagamento mesmo se a geração da matrícula falhar, mas loga o erro
        }
        // **FIM DA NOVA LÓGICA**

        // Atualiza a inscrição no banco
        await prisma.students.update({
          where: { id: studentWithSubscription.id },
          data: {
            purcharsedSubscriptions: {
              updateMany: {
                where: { txid: pixRecebido.txid },
                data: {
                  paymentStatus: "CONCLUIDA",
                  pixStatus: "CONCLUIDA",
                  pixDate: pixRecebido.horario,
                  matriculaID: novaMatriculaID, // Salva o novo ID de matrícula
                },
              },
            },
          },
        });
        console.log(`Inscrição do estudante ${studentWithSubscription.name} (txid: ${pixRecebido.txid}) atualizada para CONCLUIDA.`);
      
      } else {
        console.warn(`Nenhuma doação ou inscrição encontrada para o txid: ${pixRecebido.txid}`);
      }
    }

    res.sendStatus(200);

  } catch (error) {
    console.error('Erro ao processar o webhook do Santander:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { webhookSantanderRoutes };