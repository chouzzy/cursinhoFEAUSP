import { Router } from "express"
import { stripe } from "../server"
import { StripeCheckoutCustomerPropsDetails, StripeCheckoutCustomerProps, ChargeRefundedProps, InvoiceRetrieveProps } from "../types";
import { StripeCustomer } from "../hooks/StripeCustomer";
///////

const webhooksRoutes = Router()

webhooksRoutes.post('/', async (req, res) => {

    let event = req.body;
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    const endpointSecret = process.env.STRIPE_SIGNIN_SECRET_KEY
    if (endpointSecret) {
        // Get the signature sent by Stripe
        const signature = req.headers['stripe-signature'];

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                signature,
                endpointSecret
            )

        } catch (err: unknown) {
            
            return res.sendStatus(400);
        }
    }

    
    

    if (event.type == 'charge.succeeded') {
        

        
        // const stripeCustomer = new StripeCustomer()

        // const customerCreated: StripeCheckoutCustomerProps = {

        //     metadata: {
        //         schoolClassID:'6df7a3ba-81b5-4ff4-8dcf-35e1cddbe5e9',
        //         productID:'prod_NmpAHf1qPgwXHo',
        //         productName:'Período noturno semanal'
        //     },
        //     customerDetails: event.data.object.billing_details,
        //     paymentMethod: event.data.object.payment_method_details.type,
        //     paymentStatus: event.data.object.status,
        //     amount: event.data.object.amount
        // }

        
        
        // await stripeCustomer.updateStudent(customerCreated)
    }

    if (event.type == 'customer.subscription.created' || event.type == 'customer.subscription.deleted') {

        const stripeCustomer = new StripeCustomer()

        await stripeCustomer.updatePurchasedSubscriptions({ subscriptionCreated: event.data.object })

    }

    if (event.type == 'charge.refunded') {


        const stripeCustomer = new StripeCustomer()

        // Recuperando os dados da cobrança de reembolso
        const clientRefunded: ChargeRefundedProps = {
            refunded: event.data.object.refunded,
            customerID: event.data.object.refunded.customer,
            invoice: event.data.object.invoice

        }

        // Checando se o reembolso foi realizado
        if (clientRefunded.refunded === true) {

            // Buscnado o invoice (fatura) relativo a esse reembolso
            const invoiceFound: InvoiceRetrieveProps = await stripe.invoices.retrieve(
                clientRefunded.invoice
            );

            // Reembolsando o cliente

            if (invoiceFound) {
                await stripeCustomer.refundStudent(invoiceFound)
            }
        }

    }

    if (event.type == 'invoice.updated') {

        
    }

    return res.json({ success: true, message: 'Cliente atualizado com sucesso!' })
})

export { webhooksRoutes }


