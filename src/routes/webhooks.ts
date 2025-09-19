import express, { Request, Response, NextFunction, Router, raw } from 'express';
import { stripe } from "../server"
import { DiscriminatedEvent } from "../types/stripeEventTypes"
import { prisma } from "../prisma";
// Adicione a nova função aqui
import { handleCustomerSubscriptionUpdated, handleCustomerSubscriptionDeleted, handleInvoicePaymentFailed, handlePaymentIntentCanceled, handlePaymentIntentFailed, handlePaymentIntentSucceeded } from '../utils/stripeWebhooksUtils';

const webhooksRoutes = Router()

webhooksRoutes.post('/', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const endpointSecret = process.env.STRIPE_SIGNIN_SECRET_KEY
    console.log('Dentro do Webhook')

    if (endpointSecret) {
        try {
            const signature = req.headers['stripe-signature'];
            if (!signature) {
                console.error('stripe-signature não encontrada.');
                return res.status(400).send('Webhook Error: stripe-signature header missing.');
            }

            const stripeEvent = stripe.webhooks.constructEvent(
                req.body,
                signature,
                endpointSecret,
            ) as DiscriminatedEvent;

            console.log('Evento recebido:', stripeEvent.type);

            // Lógica do Webhook
            switch (stripeEvent.type) {
                case 'invoice.payment_failed':
                    await handleInvoicePaymentFailed(stripeEvent);
                    break;

                case 'customer.subscription.updated':
                    await handleCustomerSubscriptionUpdated(stripeEvent);
                    break;

                // NOVO CASE ADICIONADO AQUI
                case 'customer.subscription.deleted':
                    await handleCustomerSubscriptionDeleted(stripeEvent);
                    break;

                case 'payment_intent.succeeded':
                    await handlePaymentIntentSucceeded(stripeEvent);
                    break;
                case 'payment_intent.payment_failed':
                    await handlePaymentIntentFailed(stripeEvent);
                    break;
                case 'payment_intent.canceled':
                    await handlePaymentIntentCanceled(stripeEvent);
                    break;
                case 'payment_intent.processing':
                    console.log('payment_intent.processing')
                    break;
                case "payment_intent.created":
                    console.log('payment_intent.created')
                    break
                case "payment_intent.requires_action":
                    console.log('payment_intent.requires_action')
                    await handlePaymentIntentCanceled(stripeEvent)
                    break
                default:
                    console.log(`Unhandled event type ${stripeEvent.type}`);
            }

            return res.sendStatus(200)

        } catch (error: any) {
            console.error('Erro ao processar webhook:', error);
            return res.status(400).send(`Webhook Error: ${error.message}`);
        }
    }

    res.sendStatus(200)
})

export { webhooksRoutes }
