import { Router } from "express"





const webhookEfiRoutes = Router()

webhookEfiRoutes.post('/', async (req, res) => {

    console.log('rota webhook acionada')
    // Aqui voc� pode acessar os dados da requisi��o
    console.log(req.body);
  
    // Responda ao webhook (opcional)
    res.sendStatus(200);
})

export {webhookEfiRoutes}