import { StripeError, StripeErrorType } from "@stripe/stripe-js/types/stripe-js/stripe"
import { stripe } from "../server"
import Stripe from "stripe"
import { validationResponse } from "../types"
import { Students } from "../modules/registrations/entities/Students"
import { prisma } from "../prisma"
import { SchoolClass } from "../modules/registrations/entities/SchoolClass"

interface Subscription {
    donationID: string,
    stripeCustomerID: string,
    cpf: string,
    rg: string | null,
    cnpj?: string | null,
    paymentMethod: string
    product: Stripe.Response<Stripe.Product>
    unit_amount: number
    cycles: number
}

interface StudentSubscriptionProps {

    stripeCustomerID: string,

    cpf: Students["cpf"],
    rg?: Students["rg"],

    searchedSchoolClass: SchoolClass
    paymentMethod: string
    currency: string
}

class StripeSubscriptionsManager {

    async createDonationSubscription(
        {
            donationID,
            stripeCustomerID,
            cpf,
            cnpj = "Não informado",
            rg,
            paymentMethod,
            product,
            unit_amount,
            cycles
        }: Subscription
    ): Promise<Stripe.Response<Stripe.Subscription>> {

        //Criando método de pagamento fake
        try {

            const paymentMethodAttached = await stripe.paymentMethods.attach(
                paymentMethod,
                { customer: stripeCustomerID }
            )


            const hoje = new Date();

            const cancelDate = new Date(
                hoje.getFullYear(),
                hoje.getMonth() + cycles,
                hoje.getDate(),
                hoje.getHours(),
                hoje.getMinutes(),
                hoje.getSeconds()
            )
            const billingAnchorDate = new Date(
                hoje.getFullYear(),
                hoje.getMonth(),
                hoje.getDate() + 2,
                hoje.getHours(),
                hoje.getMinutes(),
                hoje.getSeconds()
            )

            if (cycles === 1) {

                const subscription = await stripe.subscriptions.create({
                    customer: stripeCustomerID,
                    items: [
                        {
                            quantity: 1,
                            price_data: {
                                currency: 'brl',
                                product: product.id,
                                recurring: {
                                    interval: 'month',
                                    interval_count: 1
                                },
                                unit_amount: unit_amount
                            }
                        }
                    ],
                    default_payment_method: paymentMethod,

                    cancel_at_period_end: true, // Cancelar no final do período apenas para cycles = 1

                    currency: 'brl',
                    collection_method: 'charge_automatically',
                    metadata: {
                        cpf: cpf,
                        cnpj: cnpj,
                        rg: rg,
                        stripeCustomerID: stripeCustomerID,
                        donationID: donationID,
                        cycles: cycles
                    },
                })

                if (!subscription) {
                    throw Error("Ocorreu um erro ao criar a inscrição.")
                }

                return subscription
            }

            const subscription = await stripe.subscriptions.create({
                customer: stripeCustomerID,
                items: [
                    {
                        quantity: 1,
                        price_data: {
                            currency: 'brl',
                            product: product.id,
                            recurring: {
                                interval: 'month',
                                interval_count: 1
                            },
                            unit_amount: unit_amount
                        }
                    }
                ],
                default_payment_method: paymentMethod,

                billing_cycle_anchor: Math.floor(billingAnchorDate.getTime() / 1000), // Define o billing_cycle_anchor
                cancel_at: Math.floor(cancelDate.getTime() / 1000), //apenas para doações de mais de um mes

                currency: 'brl',
                collection_method: 'charge_automatically',
                metadata: {
                    cpf: cpf,
                    cnpj: cnpj,
                    rg: rg,
                    stripeCustomerID: stripeCustomerID,
                    donationID: donationID,
                    cycles: cycles
                },
            })

            return subscription
        }
        catch (error: any) {
            throw error
        }

        //utilizando na subscription

        // Cliente doa -> cadastra customer no banco -> cadastra customer no stripe -> ver se a subscription aqui ja retorna pagamento aprovado e testar com cartão que n funciona.


    }

    async createStudentPaymentIntent({ stripeCustomerID, cpf, rg, searchedSchoolClass, paymentMethod, currency }: StudentSubscriptionProps): Promise<validationResponse> {

        try {

            const { id, stripeProductID } = searchedSchoolClass

            const stripeProduct = await stripe.products.retrieve(stripeProductID)
            const { default_price } = stripeProduct

            if (!default_price || typeof (default_price) != 'string') {
                throw Error("deafult_price not found on stripe - error of StripeSubscriptionsManager in CursinhoFEAUSP Backend")
            }

            const stripePrice = await stripe.prices.retrieve(default_price)
            const { unit_amount } = stripePrice

            if (!unit_amount) {
                throw Error("unit_amout não pode ser null. - error of StripeSubscriptionsManager in CursinhoFEAUSP Backend")
            }

            const paymentIntent = await stripe.paymentIntents.create({
                amount: unit_amount,
                currency: 'brl',
                customer: stripeCustomerID,
                metadata: {
                    subscriptionType: 'Subscription',
                    cpf: cpf,
                    rg: rg ?? 'NDA',
                    stripeCustomerID: stripeCustomerID,
                    schoolClassID: id
                },

                automatic_payment_methods: {
                    enabled: true,
                },
            });

            return {
                isValid: true,
                statusCode: 200,
                successMessage: "Intenção de pagamento criada com sucesso",
                paymentIntent: paymentIntent,
                paymentIntentID: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                nextAction: paymentIntent.next_action
            }
        }
        catch (error: any) {
            throw error
        }

        //utilizando na subscription

        // Cliente doa -> cadastra customer no banco -> cadastra customer no stripe -> ver se a subscription aqui ja retorna pagamento aprovado e testar com cartão que n funciona.


    }
}

export { StripeSubscriptionsManager }










// let product = ''
// let productType = ''

// if (schoolClassID === 'c60a5d95-2b1e-4b45-85cf-7dbebdca792f') { product = 'prod_Ocu3Y6wBcUSpch', productType = 'Subscription' }
// if (schoolClassID === '1e6141b6-4db3-46bd-b3f3-62cfc9e85e74') { product = 'prod_OiOOF5lKbyLB2o', productType = 'Subscription' }
// if (schoolClassID === 'da43ee0a-bae3-471b-825f-a5fd58b13a82') { product = 'prod_OI2YFh3KiRL45i', productType = 'Subscription' }
// if (!schoolClassID) { product = 'prod_NwqGmvpORCudCp', productType = 'Donation' }

// //price_1NAwZsHkzIzO4aMONf1wmRG2 - donation - prod_NwqGmvpORCudCp
// //price_1N1FWXHkzIzO4aMONF3PGRqR - curso noturno - prod_NmpAHf1qPgwXHo
// //price_1N1ZXFHkzIzO4aMO4ZN4CfCL - curso diurno - prod_Nn9q6265icRu58
// //                               - diurno fim de seman - prod_NpmUBZhmSlJJad

// // Período diurno teste 1105.1400 - "prod_NsNpalHn8d9nB8"

// //usa esse     "id": "prod_O52pzdSA5Db60q",
