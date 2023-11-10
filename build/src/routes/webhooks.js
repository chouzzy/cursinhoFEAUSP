"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhooksRoutes = void 0;
const express_1 = require("express");
const server_1 = require("../server");
const prisma_1 = require("../prisma");
// import  from "stripeTypes";
// import * as stripeTypes from "stripe-event-types"
///////
const webhooksRoutes = (0, express_1.Router)();
exports.webhooksRoutes = webhooksRoutes;
webhooksRoutes.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let event = req.body;
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    const endpointSecret = process.env.STRIPE_SIGNIN_SECRET_KEY;
    if (endpointSecret) {
        // Get the signature sent by Stripe
        try {
            const signature = req.headers['stripe-signature'];
            if (signature) {
                const stripeEvent = server_1.stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
                if (stripeEvent.type === 'invoice.payment_failed') {
                    const { id } = stripeEvent.data.object;
                    const invoice = yield server_1.stripe.invoices.retrieve(id);
                    const { subscription } = invoice;
                    if (!subscription || typeof (subscription) != 'string') {
                        return res.sendStatus(200);
                    }
                    const donation = yield prisma_1.prisma.donations.findFirst({
                        where: { stripeSubscriptionID: subscription },
                    });
                    //Proibe qualquer tipo de erro com student aqui. Se não for donation ou ela não for encontrada, é 200.
                    if (!donation) {
                        return res.sendStatus(200);
                    }
                    yield server_1.stripe.subscriptions.cancel(subscription);
                    yield prisma_1.prisma.donations.update({
                        where: { id: donation.id },
                        data: {
                            paymentStatus: 'canceled'
                        }
                    });
                    return res.sendStatus(200);
                }
                if (stripeEvent.type === "customer.subscription.updated") {
                    // O evento é do tipo "invoice.payment_succeeded"
                    // Obtém o ID da fatura
                    const subscription = stripeEvent.data.object;
                    const { id, items, status } = subscription;
                    // Obtém a doação associada à assinatura
                    const donation = yield prisma_1.prisma.donations.findFirst({
                        where: { stripeSubscriptionID: id },
                    });
                    console.log('donation --------------------- retrieved');
                    console.log(donation === null || donation === void 0 ? void 0 : donation.id);
                    if (!donation) {
                        console.log('donation not found');
                        return res.sendStatus(200);
                    }
                    // Atualiza o status da doação para "paid"
                    console.log('Donation found');
                    yield prisma_1.prisma.donations.update({
                        where: { id: donation.id },
                        data: {
                            paymentStatus: status,
                            ciclePaid: { increment: 1 },
                            valuePaid: { increment: (_a = items.data[0].plan.amount) !== null && _a !== void 0 ? _a : 0 }
                        }
                    });
                    console.log('donation incremented');
                    return res.sendStatus(200);
                }
                return res.sendStatus(202);
            }
            else {
                console.log(('signature not found'));
                return res.sendStatus(200);
            }
        }
        catch (error) {
            console.log(('signature error'));
            console.log((error));
            return res.sendStatus(200);
        }
    }
    res.sendStatus(200);
}));
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
