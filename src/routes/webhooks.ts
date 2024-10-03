import express, { Request, Response, NextFunction, Router, raw } from 'express';
import { stripe } from "../server"
import { DiscriminatedEvent } from "../types/stripeEventTypes"
import { prisma } from "../prisma";
import { handleCustomerSubscriptionUpdated, handleInvoicePaymentFailed, handlePaymentIntentCanceled, handlePaymentIntentFailed, handlePaymentIntentSucceeded } from '../utils/stripeWebhooksUtils';
// import  from "stripeTypes";
// import * as stripeTypes from "stripe-event-types"
///////

const webhooksRoutes = Router()

webhooksRoutes.post('/', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {

    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    const endpointSecret = process.env.STRIPE_SIGNIN_SECRET_KEY

    if (endpointSecret) {
        // Get the signature sent by Stripe
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

            switch (stripeEvent.type) {
                case 'invoice.payment_failed':
                    await handleInvoicePaymentFailed(stripeEvent);
                    break;

                case 'customer.subscription.updated':
                    await handleCustomerSubscriptionUpdated(stripeEvent);
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

// if (event.type == 'charge.succeeded') {



//     // const stripeCustomer = new StripeCustomer()

//     // const customerCreated: StripeCheckoutCustomerProps = {

//     //     metadata: {
//     //         schoolClassID:'6df7a3ba-81b5-4ff4-8dcf-35e1cddbe5e9',
//     //         productID:'prod_NmpAHf1qPgwXHo',
//     //         productName:'Período noturno semanal'
//     //     },
//     //     customerDetails: event.data.object.billing_details,
//     //     paymentMethod: event.data.object.payment_method_details.type,
//     //     paymentStatus: event.data.object.status,
//     //     amount: event.data.object.amount
//     // }



//     // await stripeCustomer.updateStudent(customerCreated)
// }

// if (event.type == 'customer.subscription.created' || event.type == 'customer.subscription.deleted') {

//     const stripeCustomer = new StripeCustomer()

//     await stripeCustomer.updatePurchasedSubscriptions({ subscriptionCreated: event.data.object })

// }

// if (event.type == 'charge.refunded') {


//     const stripeCustomer = new StripeCustomer()

//     // Recuperando os dados da cobrança de reembolso
//     const clientRefunded: ChargeRefundedProps = {
//         refunded: event.data.object.refunded,
//         customerID: event.data.object.refunded.customer,
//         invoice: event.data.object.invoice

//     }

//     // Checando se o reembolso foi realizado
//     if (clientRefunded.refunded === true) {

//         // Buscnado o invoice (fatura) relativo a esse reembolso
//         const invoiceFound: InvoiceRetrieveProps = await stripe.invoices.retrieve(
//             clientRefunded.invoice
//         );

//         // Reembolsando o cliente

//         if (invoiceFound) {
//             await stripeCustomer.refundStudent(invoiceFound)
//         }
//     }

// }

// if (event.type == 'invoice.updated') {


// }