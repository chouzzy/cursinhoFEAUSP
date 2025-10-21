"use strict";
// import { Request, Response } from 'express';
// import Stripe from 'stripe';
// const stripeRawHandler = async (req: Request, res: Response): Promise<void> => {
//     const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
//     console.log('proccessing stripe webhook', process.env.STRIPE_SECRET_KEY)
//     const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
//     if (req.method === 'POST') {
//         const sig = req.headers['stripe-signature'];
//         let event: Stripe.Event;
//         try {
//             const body = await buffer(req);
//             console.log(body)
//             event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
//         } catch (err) {
//             // On error, log and return the error message
//             console.log(`❌ Error message: ${err}`);
//             res.status(400).send(`Webhook Error: ${err}`);
//             return;
//         }
//         // Successfully constructed event
//         console.log('✅ Success:', event.id);
//         // Cast event data to Stripe object
//         if (event.type === 'payment_intent.succeeded') {
//             const stripeObject: Stripe.PaymentIntent = event.data
//                 .object as Stripe.PaymentIntent;
//             console.log(`💰 PaymentIntent status: ${stripeObject.status}`);
//         } else if (event.type === 'charge.succeeded') {
//             const charge = event.data.object as Stripe.Charge;
//             console.log(`💵 Charge id: ${charge.id}`);
//         } else {
//             console.warn(`🤷‍♀️ Unhandled event type: ${event.type}`);
//         }
//         // Return a response to acknowledge receipt of the event
//         res.json({ received: true });
//     } else {
//         res.setHeader('Allow', 'POST');
//         res.status(405).end('Method Not Allowed');
//     }
// };
// export const config = {
//     api: {
//         bodyParser: false,
//     },
// };
// const buffer = (req:Request) => {
//     return new Promise<Buffer>((resolve, reject) => {
//         const chunks: Buffer[] = [];
//         req.on('data', (chunk: Buffer) => {
//             chunks.push(chunk);
//         });
//         req.on('end', () => {
//             resolve(Buffer.concat(chunks));
//         });
//         req.on('error', reject);
//     });
// };
// export default stripeRawHandler;
