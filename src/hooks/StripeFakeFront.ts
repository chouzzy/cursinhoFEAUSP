import { stripe } from "../server"


class StripeFakeFront {

    async createSubscription(donationID: string | undefined = undefined, stripeCustomerID: string, cpf: string, rg: string, schoolClassID: string|undefined = undefined): Promise<unknown> {

        console.log('inside createSubscription FAKEFRONT')

        //price_1NAwZsHkzIzO4aMONf1wmRG2 - donation - prod_NwqGmvpORCudCp  
        //price_1N1FWXHkzIzO4aMONF3PGRqR - curso noturno - prod_NmpAHf1qPgwXHo
        //price_1N1ZXFHkzIzO4aMO4ZN4CfCL - curso diurno - prod_Nn9q6265icRu58
        //                               - diurno fim de seman - prod_NpmUBZhmSlJJad

        // Período diurno teste 1105.1400 - "prod_NsNpalHn8d9nB8"

        //usa esse     "id": "prod_O52pzdSA5Db60q",

        try {

            //Criando método de pagamento fake
            const paymentMethod = await stripe.paymentMethods.create({
                type: 'card',
                card: {
                    number: '4242424242424242',
                    exp_month: Math.floor(Math.random() * 12) + 1,
                    exp_year: Math.floor(Math.random() * 20) + 2023,
                    cvc: '314',
                },
            });

            const paymentMethodAttach = await stripe.paymentMethods.attach(
                paymentMethod.id,
                { customer: stripeCustomerID }
            );

            //utilizando na subscription
            const subscription = await stripe.subscriptions.create({
                customer: stripeCustomerID,
                items: [
                    {
                        quantity: 1,
                        price_data: {
                            currency: 'brl',
                            product: 'prod_NwqGmvpORCudCp',
                            recurring: {
                                interval: 'month',
                                interval_count: 1
                            },
                            unit_amount: 1000
                        }
                    }
                ],
                default_payment_method: paymentMethod.id,
                cancel_at_period_end: false,
                currency: 'brl',
                collection_method: 'charge_automatically',
                metadata: {
                    subscriptionType: 'Donation',
                    cpf: cpf,
                    rg: rg,
                    stripeCustomerID: stripeCustomerID,
                    donationID: donationID,
                    schoolClassID: schoolClassID
                }


            })

            return subscription
        }

        catch (error) {
            console.log(error)
        }


    }
}

export { StripeFakeFront }