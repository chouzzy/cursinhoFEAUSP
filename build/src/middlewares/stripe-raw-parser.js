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
exports.config = void 0;
const stripeRawHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const webhookSecret = process.env.STRIPE_SIGNIN_SECRET_KEY;
    if (req.method === 'POST') {
        const sig = req.headers['stripe-signature'];
        let event;
        try {
            const body = yield buffer(req);
            console.log(body);
            event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
        }
        catch (err) {
            // On error, log and return the error message
            console.log(`❌ Error message: ${err}`);
            res.status(400).send(`Webhook Error: ${err}`);
            return;
        }
        // Successfully constructed event
        console.log('✅ Success:', event.id);
        // Cast event data to Stripe object
        if (event.type === 'payment_intent.succeeded') {
            const stripeObject = event.data
                .object;
            console.log(`💰 PaymentIntent status: ${stripeObject.status}`);
        }
        else if (event.type === 'charge.succeeded') {
            const charge = event.data.object;
            console.log(`💵 Charge id: ${charge.id}`);
        }
        else {
            console.warn(`🤷‍♀️ Unhandled event type: ${event.type}`);
        }
        // Return a response to acknowledge receipt of the event
        res.json({ received: true });
    }
    else {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
    }
});
exports.config = {
    api: {
        bodyParser: false,
    },
};
const buffer = (req) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => {
            chunks.push(chunk);
        });
        req.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        req.on('error', reject);
    });
};
exports.default = stripeRawHandler;
