"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const express_1 = __importStar(require("express"));
const server_1 = require("../server");
const stripeWebhooksUtils_1 = require("../utils/stripeWebhooksUtils");
// import  from "stripeTypes";
// import * as stripeTypes from "stripe-event-types"
///////
const webhooksRoutes = (0, express_1.Router)();
exports.webhooksRoutes = webhooksRoutes;
webhooksRoutes.post('/', express_1.default.raw({ type: 'application/json' }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    const endpointSecret = process.env.STRIPE_SIGNIN_SECRET_KEY;
    if (endpointSecret) {
        // Get the signature sent by Stripe
        try {
            const signature = req.headers['stripe-signature'];
            if (!signature) {
                console.error('stripe-signature não encontrada.');
                return res.status(400).send('Webhook Error: stripe-signature header missing.');
            }
            const stripeEvent = server_1.stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
            switch (stripeEvent.type) {
                case 'invoice.payment_failed':
                    yield (0, stripeWebhooksUtils_1.handleInvoicePaymentFailed)(stripeEvent);
                    break;
                case 'customer.subscription.updated':
                    yield (0, stripeWebhooksUtils_1.handleCustomerSubscriptionUpdated)(stripeEvent);
                    break;
                case 'payment_intent.succeeded':
                    yield (0, stripeWebhooksUtils_1.handlePaymentIntentSucceeded)(stripeEvent);
                    break;
                case 'payment_intent.payment_failed':
                    yield (0, stripeWebhooksUtils_1.handlePaymentIntentFailed)(stripeEvent);
                    break;
                case 'payment_intent.canceled':
                    yield (0, stripeWebhooksUtils_1.handlePaymentIntentCanceled)(stripeEvent);
                    break;
                case 'payment_intent.processing':
                    console.log('payment_intent.processing');
                    break;
                case "payment_intent.created":
                    console.log('payment_intent.created');
                    break;
                case "payment_intent.requires_action":
                    console.log('payment_intent.requires_action');
                    yield (0, stripeWebhooksUtils_1.handlePaymentIntentCanceled)(stripeEvent);
                    break;
            }
            return res.sendStatus(200);
        }
        catch (error) {
            console.error('Erro ao processar webhook:', error);
            return res.status(400).send(`Webhook Error: ${error.message}`);
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
