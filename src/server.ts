import 'reflect-metadata';
import express, { NextFunction, Request, Response } from 'express'
import { AppError } from './errors/AppError'
import { router } from './routes'
import bodyParser from 'body-parser';
import cors from 'cors';
import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import https from 'https';





const stripe: Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const cert = fs.readFileSync(
    path.resolve(__dirname, `../certs/${process.env.EFI_CERT}`)
);

const agent = new https.Agent({
    pfx: cert,
    passphrase: ''
});

const app = express()




app.use(cors({
    origin: "*",
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH'],
}));

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

app.listen(3000, () => console.log('Sir, we are back online! 🦥'))





export { stripe, cert, agent }