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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeFakeFront = void 0;
const server_1 = require("../server");
const stripe_1 = __importDefault(require("stripe"));
class StripeFakeFront {
    createSubscription({ donationID = undefined, stripeCustomerID, cpf, rg, cnpj = "Não informado", schoolClassID = undefined, }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let product = '';
            let productType = '';
            if (schoolClassID === 'c60a5d95-2b1e-4b45-85cf-7dbebdca792f') {
                product = 'prod_Ocu3Y6wBcUSpch', productType = 'Subscription';
            }
            if (schoolClassID === '1e6141b6-4db3-46bd-b3f3-62cfc9e85e74') {
                product = 'prod_OiOOF5lKbyLB2o', productType = 'Subscription';
            }
            if (schoolClassID === 'da43ee0a-bae3-471b-825f-a5fd58b13a82') {
                product = 'prod_OI2YFh3KiRL45i', productType = 'Subscription';
            }
            if (!schoolClassID) {
                product = 'prod_NwqGmvpORCudCp', productType = 'Donation';
            }
            //price_1NAwZsHkzIzO4aMONf1wmRG2 - donation - prod_NwqGmvpORCudCp  
            //price_1N1FWXHkzIzO4aMONF3PGRqR - curso noturno - prod_NmpAHf1qPgwXHo
            //price_1N1ZXFHkzIzO4aMO4ZN4CfCL - curso diurno - prod_Nn9q6265icRu58
            //                               - diurno fim de seman - prod_NpmUBZhmSlJJad
            // Período diurno teste 1105.1400 - "prod_NsNpalHn8d9nB8"
            //usa esse     "id": "prod_O52pzdSA5Db60q",
            //Criando método de pagamento fake
            try {
                const paymentMethod = yield server_1.stripe.paymentMethods.create({
                    type: 'card',
                    card: {
                        number: '4242424242424242',
                        exp_month: Math.floor(Math.random() * 12) + 1,
                        exp_year: Math.floor(Math.random() * 20) + 2023,
                        cvc: '314',
                    },
                });
                const paymentMethodAttach = yield server_1.stripe.paymentMethods.attach(paymentMethod.id, { customer: stripeCustomerID });
                const stripeProduct = yield server_1.stripe.products.retrieve(product);
                const { default_price } = stripeProduct;
                if (!default_price || typeof (default_price) != 'string') {
                    return {
                        statusCode: 404,
                        isValid: false,
                        errorMessage: 'Price not found'
                    };
                }
                const stripePrice = yield server_1.stripe.prices.retrieve(default_price);
                const { unit_amount } = stripePrice;
                if (!unit_amount || typeof (unit_amount) != 'number') {
                    return {
                        statusCode: 404,
                        isValid: false,
                        errorMessage: 'Price not found'
                    };
                }
                const hoje = new Date();
                const cancelDate = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 5, hoje.getHours(), hoje.getMinutes(), hoje.getSeconds());
                const subscription = yield server_1.stripe.subscriptions.create({
                    customer: stripeCustomerID,
                    items: [
                        {
                            quantity: 1,
                            price_data: {
                                currency: 'brl',
                                product: product,
                                recurring: {
                                    interval: 'day',
                                    interval_count: 1
                                },
                                unit_amount: unit_amount
                            }
                        }
                    ],
                    default_payment_method: paymentMethod.id,
                    // cancel_at_period_end: false, // true para students e donations de 1 mes
                    cancel_at: cancelDate.getTime() / 1000,
                    currency: 'brl',
                    collection_method: 'charge_automatically',
                    metadata: {
                        subscriptionType: productType,
                        cpf: cpf,
                        cnpj: cnpj,
                        rg: rg,
                        stripeCustomerID: stripeCustomerID,
                        donationID: donationID !== null && donationID !== void 0 ? donationID : "",
                        schoolClassID: schoolClassID !== null && schoolClassID !== void 0 ? schoolClassID : ""
                    },
                });
                return {
                    isValid: true,
                    statusCode: 200,
                    successMessage: "Inscrição criada com sucesso",
                    stripeSubscription: subscription
                };
            }
            catch (error) {
                if (error instanceof stripe_1.default.errors.StripeError)
                    return {
                        statusCode: (_a = error.statusCode) !== null && _a !== void 0 ? _a : 403,
                        isValid: false,
                        errorMessage: error.message
                    };
                return {
                    statusCode: 402,
                    isValid: false,
                    errorMessage: String(error)
                };
            }
        });
    }
}
exports.StripeFakeFront = StripeFakeFront;
