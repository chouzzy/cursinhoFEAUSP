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
    createSubscription({ donationID = undefined, stripeCustomerID, cpf, rg, cnpj = "Não informado", schoolClassID = undefined, paymentMethodID, productSelectedID, cycles = 1 }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let productType = "Produto não reconhecido";
                if (schoolClassID) {
                    productType = 'Subscription';
                }
                if (donationID) {
                    productType = 'Donation';
                }
                yield server_1.stripe.paymentMethods.attach(paymentMethodID, { customer: stripeCustomerID });
                const stripeProduct = yield server_1.stripe.products.retrieve(productSelectedID);
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
                const cancelDate = new Date(hoje.getFullYear(), hoje.getMonth() + cycles, hoje.getDate(), hoje.getHours(), hoje.getMinutes(), hoje.getSeconds());
                const subscription = yield server_1.stripe.subscriptions.create({
                    customer: stripeCustomerID,
                    items: [
                        {
                            quantity: 1,
                            price_data: {
                                currency: 'brl',
                                product: productSelectedID,
                                recurring: {
                                    interval: 'month',
                                    interval_count: 1
                                },
                                unit_amount: unit_amount
                            }
                        }
                    ],
                    default_payment_method: paymentMethodID,
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
