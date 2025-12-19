import express, { Request, Response, Router } from 'express';
import { stripe } from "../server";
import { handleCheckoutSessionCompleted, handleInvoicePaymentSucceeded, handleSubscriptionUpdated, handleSubscriptionDeleted } from '../utils/stripeDonationWebhookHandler';
import { handleStudentCheckoutCompleted } from '../utils/stripeStudentsWebhookHandler'; // Novo handler

const webhooksRoutes = Router();

webhooksRoutes.post('/', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const endpointSecret = process.env.STRIPE_SIGNIN_SECRET_KEY;
    if (!endpointSecret) return res.sendStatus(500);

    const signature = req.headers['stripe-signature'];
    let event;

    try {
        if (!signature) throw new Error('Assinatura ausente');
        event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
    } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object as any;
                
                // **ROTEAMENTO INTELIGENTE**
                // Se metadata.type for 'inscription', mandamos para o handler de estudantes
                if (session.metadata?.type === 'inscription') {
                    await handleStudentCheckoutCompleted(event);
                } else {
                    // Caso contrário, assumimos que é doação (comportamento padrão)
                    await handleCheckoutSessionCompleted(event);
                }
                break;
            
            // Inscrições não têm recorrência, então esses eventos continuam sendo só para doações
            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event);
                break;
        }
        
        res.json({ received: true });
    } catch (error) {
        console.error('Erro webhook:', error);
        return res.status(500).send('Internal Server Error'); 
    }
});

export { webhooksRoutes };