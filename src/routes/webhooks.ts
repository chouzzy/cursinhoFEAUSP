import { Router } from "express"
import { stripe } from "../server"
import { StripeCheckoutCustomerPropsDetails, StripeCheckoutCustomerProps, ChargeRefundedProps, InvoiceRetrieveProps } from "../types";
import { StripeCustomer } from "../hooks/StripeCustomer";
import { DiscriminatedEvent } from "../types/stripeEventTypes"
import { prisma } from "../prisma";
// import  from "stripeTypes";
// import * as stripeTypes from "stripe-event-types"
///////



const webhooksRoutes = Router()

webhooksRoutes.post('/', async (req, res) => {

    let event = req.body;
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    const endpointSecret = process.env.STRIPE_SIGNIN_SECRET_KEY
    if (endpointSecret) {
        // Get the signature sent by Stripe
        try {


            const signature = req.headers['stripe-signature'];

            if (signature) {

                const stripeEvent = stripe.webhooks.constructEvent(
                    req.body,
                    signature,
                    endpointSecret
                ) as DiscriminatedEvent;

                if (stripeEvent.type === 'invoice.payment_failed') {

                    const { id } = stripeEvent.data.object
                    const invoice = await stripe.invoices.retrieve(id)

                    const { subscription } = invoice
                    if (!subscription || typeof (subscription) != 'string') {
                        return res.sendStatus(200)
                    }
                    const donation = await prisma.donations.findFirst({
                        where: { stripeSubscriptionID: subscription },
                    })

                    //Proibe qualquer tipo de erro com student aqui. Se não for donation ou ela não for encontrada, é 200.
                    if (!donation) {
                        return res.sendStatus(200)
                    }

                    await stripe.subscriptions.cancel(subscription)
                    await prisma.donations.update({
                        where: { id: donation.id },
                        data: {
                            paymentStatus: 'canceled'
                        }
                    })

                    return res.sendStatus(200)
                }

                if (stripeEvent.type === "customer.subscription.updated") {

                    // O evento é do tipo "invoice.payment_succeeded"

                    // Obtém o ID da fatura
                    const subscription = stripeEvent.data.object;
                    const { id, items, status } = subscription

                    // Obtém a doação associada à assinatura
                    const donation = await prisma.donations.findFirst({
                        where: { stripeSubscriptionID: id },
                    });

                    console.log('donation --------------------- retrieved')
                    console.log(donation?.id)

                    if (!donation) {
                        console.log('donation not found')
                        return res.sendStatus(200)
                    }

                    // Atualiza o status da doação para "paid"
                    console.log('Donation found')

                    await prisma.donations.update({
                        where: { id: donation.id },
                        data: {
                            paymentStatus: status,
                            ciclePaid: { increment: 1 },
                            valuePaid: { increment: items.data[0].plan.amount ?? 0 }
                        }
                    })

                    console.log('donation incremented')

                    return res.sendStatus(200)
                }

                return res.sendStatus(202)
                
            } else {
                console.log(('signature not found'))
                return res.sendStatus(200)
            }
        } catch (error) {
            console.log(('signature error'))
            console.log((error))
            return res.sendStatus(200)
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