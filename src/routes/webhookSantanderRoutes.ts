import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { MailService } from "../services/MailService"; 

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

          const ano = new Date().getFullYear();
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
        let linksHtml = '';
        if (turma && turma.documents && turma.documents.length > 0) {
            linksHtml = `
              <div style="margin: 20px 0; padding: 15px; background-color: #f0f7ff; border-left: 4px solid #004aad; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #004aad;">Documentos Importantes</h3>
                <p style="margin-bottom: 10px;">Por favor, acesse e leia os documentos abaixo:</p>
                <ul style="padding-left: 20px;">
                  ${turma.documents.map((doc: any) =>
                    `<li style="margin-bottom: 8px;">
                       <a href="${doc.downloadLink}" target="_blank" style="color: #004aad; text-decoration: none; font-weight: bold; font-size: 16px;">
                         ${doc.title}
                         <span style="font-size: 12px; color: #666;">(Clique para acessar)</span>
                       </a>
                     </li>`
                  ).join('')}
                </ul>
              </div>
            `;
        }

        mailService.sendEmail({
            toEmail: studentWithSubscription.email,
            toName: studentWithSubscription.name,
            subject: 'Inscrição Confirmada - Cursinho FEA USP',
            htmlContent: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px; background-color: #ffffff;">

                    <div style="text-align: center; border-bottom: 2px solid #f4c430; padding-bottom: 15px; margin-bottom: 20px;">
                        <h1 style="color: #00274c; margin: 0;">Inscrição Confirmada!</h1>
                    </div>

                    <p style="font-size: 16px;">Olá, <strong>${studentWithSubscription.name}</strong>!</p>

                    <p>Temos o prazer de confirmar que o seu pagamento foi recebido e sua inscrição no <strong>Cursinho FEA USP</strong> foi realizada com sucesso.</p>

                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 25px 0; text-align: center; border: 1px solid #eee;">
                        <p style="margin: 0; font-size: 0.9em; color: #666; text-transform: uppercase; letter-spacing: 1px;">Número de Matrícula</p>
                        <p style="margin: 5px 0 0 0; font-size: 2em; font-weight: bold; color: #00274c;">${novaMatriculaID || 'Em processamento'}</p>
                    </div>

                    ${linksHtml}

                    <div style="margin-top: 30px;">
                        <h3 style="color: #333;">Próximos Passos</h3>
                        <p>Fique tranquilo(a)! Nossa equipe de seleção entrará em contato em breve.</p>
                        <p>Fique atento ao seu <strong>e-mail</strong> e <strong>WhatsApp</strong> (caso tenha informado) para receber as datas das entrevistas e demais instruções.</p>
                        <div style="margin: 20px 0; padding: 15px; background-color: #f0f7ff; border-left: 4px solid #004aad; border-radius: 4px;">
                            <p style="margin: 0; font-size: 0.9em;">
                                <strong>Local de Entrevista:</strong><br><br>
                                <strong>Entrevistas dia 04/04:</strong><br>
                                Edifício Prof. Antonio Candido (Letras) - FFLCH-USP<br>
                                Av. Prof. Luciano Gualberto, 298-460 - Butantã, São Paulo - SP, 05508-010<br><br>
                                <strong>Entrevistas dias 11/04:</strong><br>
                                Faculdade de Economia Administração e Contabilidade<br>
                                Av. Prof. Luciano Gualberto 908 - Butantã, São Paulo - SP, 05508-010
                            </p>
                        </div>
                    </div>

                    <br />
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

                    <p style="font-size: 0.9em; color: #888; text-align: center;">
                        Atenciosamente,<br/>
                        <strong>Equipe Cursinho FEA USP</strong><br/>
                        <a href="https://cursinhofeausp.com.br" style="color: #004aad; text-decoration: none;">cursinhofeausp.com.br</a>
                    </p>
                </div>
            `,
            textContent: `Olá ${studentWithSubscription.name}, sua inscrição foi confirmada! Matrícula: ${novaMatriculaID}. A equipe entrará em contato em breve. Acesse os documentos da turma pelo portal.`,
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