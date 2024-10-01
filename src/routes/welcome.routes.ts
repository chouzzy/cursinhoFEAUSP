import express, { Router } from "express"
const welcomeRoutes = Router()

welcomeRoutes.get('/', express.json(), async (req, res) => {
    console.log('dentro de welcome routes')
    return res.send('seja bem vindo meu principe 🦥')
})


export {welcomeRoutes}