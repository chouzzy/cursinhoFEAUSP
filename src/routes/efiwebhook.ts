import { Router } from "express"
// import { io } from "../server";

interface EfiWebhookResponse {
    pix: PixTransaction[];
  }
  
  interface PixTransaction {
    endToEndId: string;
    txid: string;
    chave: string;
    valor: number; // Ou string se precisar manter o formato original
    horario: string; // Considerar usar uma biblioteca de data para melhor manipulação
  }

const webhookEfiRoutes = Router()


webhookEfiRoutes.post('/pix', async (req, res) => {

    console.log('Rota webhook pix acionada');

    console.log('req');
    console.log(req.body);

    try {

        // const webhookData: EfiWebhookResponse = req.body;

        // const firstTransaction = webhookData.pix[0];

        // const {chave, endToEndId, horario, txid, valor} = firstTransaction

        // io.emit('pagamentoConfirmado', {
        //     idTransacao: txid, // Usar endToEndId como identificador principal
        //     valor,
        //     chave,
        //     horario,
        //     // ... outros dados relevantes
        // });

        console.log('tudo certo')
        res.sendStatus(200);
    } catch (error) {
        console.error('Erro ao processar o webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// webhookEfiRoutes.post('/', async (req, res) => {

//     console.log('Rota webhook acionada');

//     try {
//         // Validação básica (ajuste conforme a documentação da Efi)
//         if (!req.body.transactionId) {
//             return res.status(400).json({ error: 'Transaction ID is missing' });
//         }

//         // Processar os dados da requisição
//         console.log(req.body);

//         // Salvar as informações do pagamento no banco de dados ou realizar outras ações

//         res.sendStatus(200);
//     } catch (error) {
//         console.error('Erro ao processar o webhook:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// })

// webhookEfiRoutes.post('(/pix)?', async (req, res) => {

//     console.log('Rota webhook pix?? acionada');

//     try {
//         // Validação básica (ajuste conforme a documentação da Efi)
//         if (!req.body.transactionId) {
//             return res.status(400).json({ error: 'Transaction ID is missing' });
//         }

//         // Processar os dados da requisição
//         console.log(req.body);

//         // Salvar as informações do pagamento no banco de dados ou realizar outras ações

//         res.sendStatus(200);
//     } catch (error) {
//         console.error('Erro ao processar o webhook:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// })




export { webhookEfiRoutes }