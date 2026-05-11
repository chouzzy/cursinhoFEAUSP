import { Router, Request, Response } from "express";
import { SantanderPixService } from "../services/SantanderPixService";
import { TrackingService } from "../services/TrackingService";
import { MailService } from "../services/MailService";
import { prisma } from "../prisma";
import { StripeInscriptionController } from "../controllers/StripeInscriptionController";
import { ensureAuthenticated } from "../modules/registrations/middleware/ensureAuthenticate";
import { getLocationHtml } from "../utils/emailUtils";

const inscriptionsRoutes = Router();

const santanderPixService = new SantanderPixService();
const trackingService = new TrackingService();
const mailService = new MailService(); // Instancie o MailService
const stripeInscriptionController = new StripeInscriptionController();

// ... (suas rotas existentes: POST /, GET /status/:txid, GET /track/:identifier) ...

/**
 * Rota POST para criar uma nova inscrição e gerar a cobrança PIX.
 */
inscriptionsRoutes.post('/', async (req: Request, res: Response) => {
    // ... (código existente da rota POST /)
    console.log("Recebida nova requisição de inscrição via PIX Santander.");

    try {
        const inscriptionData = req.body;

        if (!inscriptionData || Object.keys(inscriptionData).length === 0) {
            return res.status(400).json({ error: 'Corpo da requisição vazio. Nenhum dado de inscrição foi enviado.' });
        }

        const pixResponse = await santanderPixService.createInscriptionWithPix(inscriptionData);
        return res.status(201).json(pixResponse);

    } catch (error: any) {
        console.error('Erro ao criar inscrição com PIX:', error.message);

        if (error.message && error.message.includes('Você já está inscrito')) {
            return res.status(409).json({
                error: 'Inscrição Duplicada',
                details: error.message
            });
        }

        // 2. Erros vindos da API do Santander (Axios)
        if (error.response) {
            // Log para debug do erro real do Santander
            console.error('Detalhes do erro Santander:', JSON.stringify(error.response.data));

            // Verifica se é o erro de CPF inválido específico do Santander
            // O Santander costuma retornar: { details: "O CPF informado invalido", ... }
            const santanderDetails = error.response.data?.details || '';

            if (santanderDetails.includes('CPF informado invalido') || santanderDetails.includes('CPF')) {
                return res.status(400).json({
                    error: 'Dados Inválidos',
                    details: 'Esse CPF não é um CPF válido, por favor revise.'
                });
            }
        }

        return res.status(500).json({
            error: 'Falha ao gerar a cobrança PIX.',
            details: 'Ocorreu um erro interno no servidor.'
        });
    }
});

/**
 * Rota GET para o frontend consultar o status de um pagamento específico (Polling).
 */
inscriptionsRoutes.get('/status/:txid', async (req: Request, res: Response) => {
    try {
        const { txid } = req.params;

        const student = await prisma.students.findFirst({
            where: {
                purcharsedSubscriptions: {
                    some: { txid: txid }
                }
            }
        });

        if (!student || !student.purcharsedSubscriptions || student.purcharsedSubscriptions.length === 0) {
            return res.status(404).json({ error: 'Inscrição não encontrada.' });
        }

        const subscription = student.purcharsedSubscriptions.find(s => String(s.txid) === txid);
        if (!subscription) {
            return res.status(404).json({ error: 'Inscrição não encontrada.' });
        }

        return res.status(200).json({ status: subscription.paymentStatus });

    } catch (error: any) {
        console.error(`Erro ao consultar status do txid ${req.params.txid}:`, error);
        return res.status(500).json({ error: 'Erro interno ao consultar status.' });
    }
});

/**
 * Rota GET para buscar todas as inscrições de um aluno por CPF, Email ou TXID.
 */
inscriptionsRoutes.get('/track/:identifier', async (req: Request, res: Response) => {
    try {
        const { identifier } = req.params;
        console.log(`Recebida requisição de rastreio para: ${identifier}`);

        const result = await trackingService.track(identifier);

        if (!result.found) {
            return res.status(404).json({
                error: 'Inscrição não encontrada',
                details: 'Nenhuma inscrição foi localizada com os dados fornecidos.'
            });
        }

        return res.status(200).json(result);

    } catch (error: any) {
        console.error(`Erro ao rastrear inscrições para ${req.params.identifier}:`, error);
        return res.status(500).json({ error: 'Erro interno ao processar o rastreio.' });
    }
});

// **NOVA ROTA DE TESTE DE EMAIL (Temporária)**
inscriptionsRoutes.post('/test-email', async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório para o teste.' });
    }

    console.log(`Tentando enviar e-mail de teste para: ${email}`);

    const success = await mailService.sendEmail({
        toEmail: email,
        toName: 'Tester',
        subject: 'Teste de Integração MailerSend',
        htmlContent: '<h1>Funciona!</h1><p>Se você está vendo isso, o MailerSend está configurado corretamente no servidor.</p>',
        textContent: 'Funciona! O MailerSend está configurado corretamente.'
    });

    if (success) {
        return res.status(200).json({ message: 'E-mail enviado com sucesso!' });
    } else {
        return res.status(500).json({ error: 'Falha ao enviar e-mail.' });
    }
});

inscriptionsRoutes.post('/checkout', stripeInscriptionController.handle);

/**
 * Confirmação manual de pagamento — uso exclusivo do painel admin.
 * Roda o mesmo fluxo do webhook: gera matrícula e envia e-mail de confirmação.
 */
inscriptionsRoutes.post('/:studentId/confirm', ensureAuthenticated, async (req: Request, res: Response) => {
    const { studentId } = req.params;
    const { txid } = req.body;

    if (!txid) {
        return res.status(400).json({ error: 'txid é obrigatório.' });
    }

    try {
        const student = await prisma.students.findUnique({ where: { id: studentId } });
        if (!student) {
            return res.status(404).json({ error: 'Aluno não encontrado.' });
        }

        const subscription = student.purcharsedSubscriptions.find(s => s.txid === txid);
        if (!subscription) {
            return res.status(404).json({ error: 'Inscrição com este txid não encontrada.' });
        }

        const isConcluida = subscription.paymentStatus === 'CONCLUIDA' || subscription.paymentStatus === 'CONCLUÍDA';
        if (isConcluida && subscription.matriculaID) {
            return res.status(400).json({ error: 'Esta inscrição já foi confirmada.', matriculaID: subscription.matriculaID });
        }

        // Gera matrícula (só incrementa o contador se ainda não tiver ID)
        let matriculaID = subscription.matriculaID;
        let documents: { title: string; downloadLink: string }[] = [];
        let turmaInfo: { code?: string; title?: string } | null = null;

        if (!matriculaID) {
            const turma = await prisma.schoolClass.update({
                where: { id: subscription.schoolClassID },
                data: { registrationCounter: { increment: 1 } },
                include: { documents: true },
            });
            const ano = new Date().getFullYear();
            const codigoTurma = turma.code || 'GERAL';
            const sequencial = turma.registrationCounter.toString().padStart(4, '0');
            matriculaID = `${ano}${codigoTurma}${sequencial}`;
            documents = turma.documents as { title: string; downloadLink: string }[];
            turmaInfo = { code: turma.code ?? undefined, title: turma.title ?? undefined };
        } else {
            const turma = await prisma.schoolClass.findUnique({
                where: { id: subscription.schoolClassID },
                include: { documents: true },
            });
            documents = (turma?.documents ?? []) as { title: string; downloadLink: string }[];
            turmaInfo = turma ? { code: turma.code ?? undefined, title: turma.title ?? undefined } : null;
        }

        // Atualiza inscrição no banco
        await prisma.students.update({
            where: { id: student.id },
            data: {
                purcharsedSubscriptions: {
                    updateMany: {
                        where: { txid },
                        data: {
                            paymentStatus: 'CONCLUIDA',
                            pixStatus: 'CONCLUIDA',
                            matriculaID,
                            pixDate: new Date().toISOString(),
                        },
                    },
                },
            },
        });

        // Envia e-mail de confirmação
        let linksHtml = '';
        if (documents.length > 0) {
            linksHtml = `
              <div style="margin: 20px 0; padding: 15px; background-color: #f0f7ff; border-left: 4px solid #004aad; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #004aad;">Documentos Importantes</h3>
                <p style="margin-bottom: 10px;">Por favor, acesse e leia os documentos abaixo:</p>
                <ul style="padding-left: 20px;">
                  ${documents.map(doc =>
                    `<li style="margin-bottom: 8px;">
                       <a href="${doc.downloadLink}" target="_blank" style="color: #004aad; text-decoration: none; font-weight: bold; font-size: 16px;">
                         ${doc.title}
                         <span style="font-size: 12px; color: #666;">(Clique para acessar)</span>
                       </a>
                     </li>`
                  ).join('')}
                </ul>
              </div>`;
        }

        const mailService = new MailService();
        await mailService.sendEmail({
            toEmail: student.email,
            toName: student.name,
            subject: 'Inscrição Confirmada - Cursinho FEA USP',
            htmlContent: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px; background-color: #ffffff;">
                    <div style="text-align: center; border-bottom: 2px solid #f4c430; padding-bottom: 15px; margin-bottom: 20px;">
                        <h1 style="color: #00274c; margin: 0;">Inscrição Confirmada!</h1>
                    </div>
                    <p style="font-size: 16px;">Olá, <strong>${student.name}</strong>!</p>
                    <p>Agradecemos pela sua inscrição no Processo Seletivo da nossa <strong>${turmaInfo?.title || 'Cursinho FEA USP'}</strong>! Para continuar sua inscrição, não se esqueça de ler com atenção o Manual do Candidato, o Formulário de Pré-Entrevista e o Termo de Inscrição que estarão disponíveis nos links abaixo.</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 25px 0; text-align: center; border: 1px solid #eee;">
                        <p style="margin: 0; font-size: 0.9em; color: #666; text-transform: uppercase; letter-spacing: 1px;">Número de Matrícula</p>
                        <p style="margin: 5px 0 0 0; font-size: 2em; font-weight: bold; color: #00274c;">${matriculaID}</p>
                    </div>
                    ${linksHtml}
                    <div style="margin-top: 30px;">
                        <h3 style="color: #333;">Próximos Passos</h3>
                        <p>Fique tranquilo(a)! Nossa equipe de seleção entrará em contato em breve.</p>
                        <p>Fique atento ao seu <strong>e-mail</strong> e <strong>WhatsApp</strong> para receber as datas das entrevistas e demais instruções.</p>
                        <div style="margin: 20px 0; padding: 15px; background-color: #f0f7ff; border-left: 4px solid #004aad; border-radius: 4px;">
                            <p style="margin: 0; font-size: 0.9em;">
                                <strong>Local de Entrevista:</strong><br><br>
                                ${getLocationHtml(turmaInfo)}
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
                </div>`,
            textContent: `Olá ${student.name}, sua inscrição foi confirmada! Matrícula: ${matriculaID}. Fique atento ao e-mail e WhatsApp para próximas etapas.`,
        });

        return res.status(200).json({ success: true, matriculaID });

    } catch (error: any) {
        console.error('Erro ao confirmar inscrição manualmente:', error.message);
        return res.status(500).json({ error: 'Erro interno ao confirmar inscrição.' });
    }
});

export { inscriptionsRoutes };