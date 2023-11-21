import { Router } from "express"
const welcomeRoutes = Router()

welcomeRoutes.get('/', async (req, res) => {
    return res.sendStatus(200).send('seja bem vindo meu principe 🦥')
})


export {welcomeRoutes}