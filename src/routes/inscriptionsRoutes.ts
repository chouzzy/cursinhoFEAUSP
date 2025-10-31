import { Router, Request, Response } from "express";
import { SantanderPixService } from "../services/SantanderPixService";
import { prisma } from "../prisma"; // Precisamos do Prisma para consultar o status

const inscriptionsRoutes = Router();

// Instanciamos o Serviço (nosso "Use Case")
const santanderPixService = new SantanderPixService();

/**
 * Rota POST para criar uma nova inscrição e gerar a cobrança PIX.
 * (Controller)
 */
inscriptionsRoutes.post('/', async (req: Request, res: Response) => {
  console.log("Recebida nova requisição de inscrição via PIX Santander.");
  
  try {
    const inscriptionData = req.body;

    if (!inscriptionData || Object.keys(inscriptionData).length === 0) {
        return res.status(400).json({ error: 'Corpo da requisição vazio. Nenhum dado de inscrição foi enviado.' });
    }

    // Chama o Serviço para fazer o trabalho pesado
    const pixResponse = await santanderPixService.createInscriptionWithPix(inscriptionData);
    return res.status(201).json(pixResponse);

  } catch (error: any) {
    console.error('Erro ao criar inscrição com PIX:', error.message);

    // **LÓGICA DE ERRO ATUALIZADA**
    // Verifica se é o nosso erro customizado de duplicidade
    if (error.message && error.message.includes('Você já está inscrito')) {
        // Retorna um erro 409 (Conflict) com a mensagem exata
        return res.status(409).json({
            error: 'Inscrição Duplicada',
            details: error.message // Repassa a mensagem do serviço para o frontend
        });
    }

    // Se for qualquer outro erro, retorna 500
    return res.status(500).json({ 
        error: 'Falha ao gerar a cobrança PIX.',
        details: 'Ocorreu um erro interno no servidor.'
    });
  }
});

/**
 * **ROTA DE POLLING**
 * Rota GET para o frontend consultar o status de um pagamento.
 * (Controller)
 */
inscriptionsRoutes.get('/status/:txid', async (req: Request, res: Response) => {
    try {
        const { txid } = req.params;

        console.log(`Recebida consulta de status para o txid: ${txid}`);

        // Procura pelo estudante que tenha esta transação
        const student = await prisma.students.findFirst({
            where: {
                purcharsedSubscriptions: {
                    some: { txid: txid }
                }
            }
        });

        if (!student || !student.purcharsedSubscriptions || student.purcharsedSubscriptions.length === 0) {
            console.log(`Consulta de status: Inscrição não encontrada para o txid: ${txid}`);
            return res.status(404).json({ error: 'Inscrição não encontrada.' });
        }

        // Pega a inscrição específica
        const subscription = student.purcharsedSubscriptions.find(s => String(s.txid) === txid);
        if (!subscription) {
            console.log(`Consulta de status: nenhuma inscrição encontrada com txid: ${txid}`);
            return res.status(404).json({ error: 'Inscrição não encontrada.' });
        }
        
        console.log(`Consulta de status: Retornando status '${subscription.paymentStatus}' para o txid: ${txid}`);
        // Retorna apenas o status para o frontend
        return res.status(200).json({ status: subscription.paymentStatus });

    } catch (error: any) {
        console.error(`Erro ao consultar status do txid ${req.params.txid}:`, error);
        return res.status(500).json({ error: 'Erro interno ao consultar status.' });
    }
});


export { inscriptionsRoutes };

