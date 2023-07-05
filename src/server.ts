import 'reflect-metadata';
import express, { NextFunction, Request, Response } from 'express'
import { AppError } from './errors/AppError'
import { router } from './routes'
import { webhooksRoutes } from './routes/webhooks';
import bodyParser from 'body-parser';
import cors from 'cors';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const app = express()
app.use(cors());

app.use('/webhooks', bodyParser.raw({ type: "*/*" }), webhooksRoutes)
app.use(express.json())

app.use(bodyParser.json({ type: 'application/json' }))

app.use(router)

// Tratamento de erro
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {

    // Erros instanciados na classe AppError, ex throw new AppError(lalala)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            message: err.message
        })
    }

    // Erro sem instanciar na classe App Error ex Throw new Error(lalala)
    return res.status(500).json({
        status: 'error',
        message: `⛔ Internal Server Error: ${err.message}⛔`
    })
})

app.listen(3333, () => console.log('Sir, we are back online! 🦥'))

export { stripe }