import { StripeError, StripeErrorType } from "@stripe/stripe-js/types/stripe-js/stripe"
import { stripe } from "../server"
import Stripe from "stripe"
import { validationResponse } from "../types"

interface Subscription {
    donationID?: string,
    stripeCustomerID: string,
    cpf: string,
    rg: string | null,
    cnpj?: string | null,
    schoolClassID?: string,
    paymentMethodID: string,
    productSelectedID: string,
    cycles: number
}

class StripeFakeFront {

    async createSubscription(
        {
            donationID = undefined,
            stripeCustomerID,
            cpf,
            rg,
            cnpj = "Não informado",
            schoolClassID = undefined,
            paymentMethodID,
            productSelectedID,
            cycles = 1
        }: Subscription
    ): Promise<validationResponse> {



        try {

            let productType = "Produto não reconhecido"
            if (schoolClassID) { productType = 'Subscription' }
            if (donationID) { productType = 'Donation' }

            await stripe.paymentMethods.attach(
                paymentMethodID,
                { customer: stripeCustomerID }
            );

            console.log('após o paymentAttach')

            const stripeProduct = await stripe.products.retrieve(productSelectedID)
            const { default_price } = stripeProduct

            if (!default_price || typeof (default_price) != 'string') {
                return {
                    statusCode: 404,
                    isValid: false,
                    errorMessage: 'Price not found'
                }
            }

            const stripePrice = await stripe.prices.retrieve(default_price)
            const { unit_amount } = stripePrice

            if (!unit_amount || typeof (unit_amount) != 'number') {
                return {
                    statusCode: 404,
                    isValid: false,
                    errorMessage: 'Price not found'
                }
            }

            const hoje = new Date();

            const cancelDate = new Date(
                hoje.getFullYear(),
                hoje.getMonth() + cycles+1,
                hoje.getDate(),
                hoje.getHours(),
                hoje.getMinutes(),
                hoje.getSeconds()
            )

            const subscription = await stripe.subscriptions.create({
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
                    donationID: donationID ?? "",
                    schoolClassID: schoolClassID ?? ""
                },
            })

            return {
                isValid: true,
                statusCode: 200,
                successMessage: "Inscrição criada com sucesso",
                stripeSubscription: subscription
            }
        }
        catch (error: any) {

            if (error instanceof Stripe.errors.StripeError)
                return {
                    statusCode: error.statusCode ?? 403,
                    isValid: false,
                    errorMessage: error.message
                }


            return {
                statusCode: 402,
                isValid: false,
                errorMessage: String(error)
            }

        }

        //utilizando na subscription

        // Cliente doa -> cadastra customer no banco -> cadastra customer no stripe -> ver se a subscription aqui ja retorna pagamento aprovado e testar com cartão que n funciona.


    }
}

export { StripeFakeFront }