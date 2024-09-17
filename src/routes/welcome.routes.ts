import { Router } from "express"
const welcomeRoutes = Router()

welcomeRoutes.get('/', async (req, res) => {
    console.log('dentro de welcome routes')
    return res.send('seja bem vindo meu principe 🦥')
})


export {welcomeRoutes}