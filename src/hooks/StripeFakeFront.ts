import { stripe } from "../server"

interface Subscription {
    donationID?: string,
    stripeCustomerID: string,
    cpf: string,
    rg: string | null,
    cnpj?: string | null,
    schoolClassID?: string
}

class StripeFakeFront {

    async createSubscription(
        { donationID = undefined,
            stripeCustomerID,
            cpf,
            rg,
            cnpj = "Não informado",
            schoolClassID = undefined,
        }: Subscription
    ): Promise<unknown> {

        console.log('inside createSubscription FAKEFRONT')
        let product = ''
        let productType = ''

        if (schoolClassID === 'c60a5d95-2b1e-4b45-85cf-7dbebdca792f') { product =  'prod_Ocu3Y6wBcUSpch', productType='Subscription'}
        if (schoolClassID === '1e6141b6-4db3-46bd-b3f3-62cfc9e85e74') { product =  'prod_OiOOF5lKbyLB2o', productType='Subscription'}
        if (schoolClassID === 'da43ee0a-bae3-471b-825f-a5fd58b13a82') { product =  'prod_OI2YFh3KiRL45i', productType='Subscription'}
        if (!schoolClassID) { product =  'prod_NwqGmvpORCudCp', productType='Donation'}

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
                            product: product,
                            recurring: {
                                interval: 'month',
                                interval_count: 1
                            },
                            unit_amount: 21892
                        }
                    }
                ],
                default_payment_method: paymentMethod.id,
                cancel_at_period_end: false,
                currency: 'brl',
                collection_method: 'charge_automatically',
                metadata: {
                    subscriptionType: productType,
                    cpf: cpf,
                    cnpj: cnpj,
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