import { anoDaTurma } from "../utils/matriculaYear";
import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { MailService } from "../services/MailService";
import { buildConfirmacaoInscricaoHtml } from "../utils/confirmacaoInscricaoEmail";

interface SantanderPixTransaction {
  endToEndId: string;
  txid: string;
  chave: string;
  valor: string;
  horario: string;
}

const webhookSantanderRoutes = Router();
const mailService = new MailService(); 

webhookSantanderRoutes.get('/santander', async (req: Request, res: Response) => {
  console.log('Recebida chamada de VALIDAÇÃO (GET) do Webhook Santander.');
  res.sendStatus(200);
});

webhookSantanderRoutes.post('/santander', async (req: Request, res: Response) => {
  console.log('Webhook Santander PIX (POST) acionado');

  try {
    const pixNotifications: SantanderPixTransaction[] = req.body.pix;

    if (!pixNotifications || !Array.isArray(pixNotifications) || pixNotifications.length === 0) {
      console.warn('Payload do webhook Santander vazio ou em formato inesperado. Body recebido:', JSON.stringify(req.body));
      return res.sendStatus(200);
    }

    for (const pixRecebido of pixNotifications) {
      console.log(`Processando txid: ${pixRecebido.txid}`);

      // 1. Doações
      const donation = await prisma.donations.findFirst({ where: { txid: pixRecebido.txid } });
      if (donation) {
         if (donation.paymentStatus !== 'CONCLUIDA') {
             await prisma.donations.update({
                 where: { id: donation.id },
                 data: { pixStatus: 'CONCLUIDA', paymentStatus: 'CONCLUIDA' },
             });
         }
         continue;
      }

      // 2. Inscrições (Students)
      const studentWithSubscription = await prisma.students.findFirst({
        where: {
          purcharsedSubscriptions: { some: { txid: pixRecebido.txid } },
        },
      });

      if (studentWithSubscription) {
        const subscription = studentWithSubscription.purcharsedSubscriptions.find(sub => sub.txid === pixRecebido.txid);
        
        if (subscription && subscription.paymentStatus === 'CONCLUIDA') {
           console.log(`Inscrição com txid ${pixRecebido.txid} já foi processada. Ignorando.`);
           continue;
        }

        let novaMatriculaID = null;
        let turma = null;

        try {
          // Incrementa contador e JÁ recupera os dados da turma, incluindo documents se necessário
          // O update retorna o objeto atualizado
          turma = await prisma.schoolClass.update({
            where: { id: subscription!.schoolClassID },
            data: { registrationCounter: { increment: 1 } },
            include: { documents: true } // <--- ADICIONADO PARA PUXAR OS LINKS
          });

          const ano = anoDaTurma(turma.title);
          const codigoTurma = turma.code || 'GERAL';
          const sequencial = turma.registrationCounter.toString().padStart(4, '0');
          novaMatriculaID = `${ano}${codigoTurma}${sequencial}`;
        } catch (error: any) {
          console.error(`Erro ao gerar matrícula: ${error.message}`);
           // Tenta buscar a turma apenas para pegar os documentos caso o update falhe (embora improvável aqui se chegou até aqui)
           if (!turma && subscription?.schoolClassID) {
               turma = await prisma.schoolClass.findUnique({ 
                 where: { id: subscription.schoolClassID },
                 include: { documents: true } // <--- ADICIONADO PARA PUXAR OS LINKS
               });
           }
        }

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
                  matriculaID: novaMatriculaID,
                },
              },
            },
          },
        });
        console.log(`Inscrição do estudante ${studentWithSubscription.name} atualizada para CONCLUIDA. Matrícula: ${novaMatriculaID}`);

        // Envia e-mail de confirmação (fire-and-forget — falha aqui não afeta o webhook)
        console.log(`Enviando e-mail de confirmação para ${studentWithSubscription.email}...`);
        mailService.sendEmail({
            toEmail: studentWithSubscription.email,
            toName: studentWithSubscription.name,
            subject: 'Inscrição Confirmada - Cursinho FEA USP',
            htmlContent: buildConfirmacaoInscricaoHtml({ nome: studentWithSubscription.name, turma: turma, pedido: novaMatriculaID }),
            textContent: `Olá ${studentWithSubscription.name}, sua inscrição foi confirmada! Número do pedido: ${novaMatriculaID}. A equipe entrará em contato em breve. Acesse os documentos da turma pelo portal.`,
        }).catch((err: any) => console.error(`Erro ao enviar e-mail para ${studentWithSubscription.email}:`, err));

      } else {
        console.warn(`Nenhuma doação ou inscrição encontrada para o txid: ${pixRecebido.txid}`);
      }
    }

    res.sendStatus(200);

  } catch (error) {
    console.error('Erro ao processar o webhook do Santander:', error);
    // Retorna 200 mesmo em erro interno: evita retentativas do Santander que causariam
    // processamento duplicado. O erro fica registrado nos logs para investigação manual.
    res.sendStatus(200);
  }
});

export { webhookSantanderRoutes };