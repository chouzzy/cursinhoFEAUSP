import { Router, Request, Response } from "express";
import { SantanderPixService } from "../services/SantanderPixService";
import { TrackingService } from "../services/TrackingService"; 
import { MailService } from "../services/MailService"; // Importe o MailService
import { prisma } from "../prisma"; 

const inscriptionsRoutes = Router();

const santanderPixService = new SantanderPixService();
const trackingService = new TrackingService();
const mailService = new MailService(); // Instancie o MailService

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

export { inscriptionsRoutes };