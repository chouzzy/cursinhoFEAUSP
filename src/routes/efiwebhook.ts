import { Router } from "express"

const webhookEfiRoutes = Router()

webhookEfiRoutes.post('/pix', async (req, res) => {

    console.log('Rota webhook pix acionada');

    console.log('req');
    console.log(req.body);
    console.log('req.body');
    console.log(req.body);

    try {
        // Validação básica (ajuste conforme a documentação da Efi)
        // Processar os dados da requisição
        // Salvar as informações do pagamento no banco de dados ou realizar outras ações
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


export {webhookEfiRoutes}