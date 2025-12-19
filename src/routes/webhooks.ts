import express, { Request, Response, Router } from 'express';
import { stripe } from "../server";
import { handleCheckoutSessionCompleted, handleInvoicePaymentSucceeded, handleSubscriptionUpdated, handleSubscriptionDeleted } from '../utils/stripeDonationWebhookHandler';
import { handleStudentCheckoutCompleted } from '../utils/stripeStudentsWebhookHandler'; // Novo handler

const webhooksRoutes = Router();

webhooksRoutes.post('/', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    console.log("--- INÍCIO DO PROCESSAMENTO DO WEBHOOK ---");

    const endpointSecret = process.env.STRIPE_SIGNIN_SECRET_KEY;
    if (!endpointSecret) {
        console.error("ERRO: STRIPE_SIGNIN_SECRET_KEY não está configurada.");
        return res.sendStatus(500);
    }
    console.log("Chave de assinatura do webhook encontrada.");

    const signature = req.headers['stripe-signature'];
    let event;

    try {
        if (!signature) {
            console.error("ERRO: Assinatura do Stripe ausente no cabeçalho.");
            throw new Error('Assinatura ausente');
        }
        console.log("Assinatura do Stripe recebida:", signature);
        // console.log("Corpo da requisição (raw):", req.body.toString()); // Descomente para debug detalhado

        event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
        console.log("Evento do Stripe construído com sucesso. ID:", event.id, "Tipo:", event.type);

    } catch (err: any) {
        console.error("ERRO na construção do evento do webhook:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        console.log(`Processando evento do tipo: ${event.type}`);
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object as any;
                console.log("Evento 'checkout.session.completed' recebido. Session ID:", session.id);
                console.log("Metadata da sessão:", session.metadata);
                
                // **ROTEAMENTO INTELIGENTE**
                // Se metadata.type for 'inscription', mandamos para o handler de estudantes
                if (session.metadata?.type === 'inscription') {
                    console.log("Roteando para o handler de inscrição de estudante...");
                    await handleStudentCheckoutCompleted(event);
                    console.log("Handler de inscrição de estudante finalizado.");
                } else {
                    // Caso contrário, assumimos que é doação (comportamento padrão)
                    console.log("Roteando para o handler de doação...");
                    await handleCheckoutSessionCompleted(event);
                    console.log("Handler de doação finalizado.");
                }
                break;
            
            // Inscrições não têm recorrência, então esses eventos continuam sendo só para doações
            case 'invoice.payment_succeeded':
                console.log("Roteando para o handler de pagamento de fatura bem-sucedido...");
                await handleInvoicePaymentSucceeded(event);
                console.log("Handler de pagamento de fatura finalizado.");
                break;
            case 'customer.subscription.updated':
                console.log("Roteando para o handler de atualização de assinatura...");
                await handleSubscriptionUpdated(event);
                console.log("Handler de atualização de assinatura finalizado.");
                break;
            case 'customer.subscription.deleted':
                console.log("Roteando para o handler de exclusão de assinatura...");
                await handleSubscriptionDeleted(event);
                console.log("Handler de exclusão de assinatura finalizado.");
                break;
            default:
                console.log(`Tipo de evento não tratado: ${event.type}`);
        }
        
        console.log("Processamento do webhook concluído com sucesso. Enviando resposta 200.");
        res.json({ received: true });
    } catch (error) {
        console.error('Erro fatal durante o processamento do webhook:', error);
        return res.status(500).send('Internal Server Error'); 
    }
});

export { webhooksRoutes };