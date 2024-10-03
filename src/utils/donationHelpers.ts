import Stripe from "stripe"
import { CreateDonationProps } from "../modules/donations/useCases/createDonation/CreateDonationController"
import { CreatePixDonationProps } from "../modules/donations/useCases/createPixDonation/CreatePixDonationController"
import { prisma } from "../prisma"
import { stripe } from "../server"
import { pixCobDataProps } from "../types"
import { Donations } from "../modules/donations/entities/Donations"

async function createDonationPix(pixDonationData: CreatePixDonationProps) {

    try {


        const {
            name, email, phoneNumber, isPhoneWhatsapp, gender,
            birth, state, city, street, homeNumber, complement,
            district, zipCode, cpf, rg, cnpj, ufrg, valuePaid,
        } = pixDonationData

        const createdDonation = await prisma.donations.create({
            data: {
                name: name,
                email: email,

                phoneNumber: phoneNumber,
                isPhoneWhatsapp: isPhoneWhatsapp,
                gender: gender ?? 'Não informado',

                birth: birth,
                state: state,
                city: city,
                street: street,
                homeNumber: homeNumber,
                complement: complement ?? 'Não informado',
                district: district,
                zipCode: zipCode,

                cpf: cpf,
                rg: rg ?? 'Não informado',
                cnpj: cnpj ?? 'Não informado',
                ufrg: ufrg,

                valuePaid: 0,
                paymentMethod: 'PIX',
                paymentStatus: 'Sem informação ainda',
                paymentDate: new Date(),
                stripeCustomerID: 'Sem informação ainda',
                stripeSubscriptionID: 'Pagamento via Efí',
                ciclePaid: 1,
                ciclesBought: 1,
                valueBought: pixDonationData.valuePaid,

                txid: null,
                pixCopiaECola: null,
                pixQrCode: null,
                pixStatus: null,
                pixValor: null,
                pixDate: null,
                pixExpiracaoEmSegundos: null,

                donationExpirationDate: null
            }
        })

        return createdDonation

    } catch (error) {
        throw error
    }
}

async function updateDonationPix(pixData: pixCobDataProps, createdDonation: any) {

    try {

        const { txid, pixCopiaECola, location, status, valor, calendario } = pixData

        console.log('valor')
        console.log(valor)
        console.log('valor.original')
        console.log(valor.original)

        const updatedDonation = await prisma.donations.update({
            where: {
                id: createdDonation.id
            },
            data: {
                txid: txid,
                pixCopiaECola: pixCopiaECola,
                pixQrCode: location,
                pixStatus: status,
                pixValor: valor.original,
                pixDate: calendario.criacao,
                pixExpiracaoEmSegundos: calendario.expiracao
            }
        })

        return updatedDonation

    } catch (error) {
        throw error
    }

}

async function getStripeProduct(stripeProductID: string) {

    try {
        const product = await stripe.products.retrieve(stripeProductID)

        if (!product) {
            throw Error("Produto não encontrado no Stripe")
        }

        const { default_price } = product

        if (default_price && typeof (default_price) === 'string') {

            const price = await stripe.prices.retrieve(default_price)

            if (!price.unit_amount) {
                throw Error("Produto sem preço cadastrado")
            }

            const response = {
                price,
                product,
                unit_amount: price.unit_amount
            }


            return response
        }

        throw Error("Produto ou preço não encontrado")


    } catch (error) {
        throw error
    }
}

async function createPrismaDonation(donationData: CreateDonationProps, unit_amount: number) {

    try {


        //Criando a donation no banco de dados
        const createdDonation = await prisma.donations.create({
            data: {
                name: donationData.name,
                email: donationData.email,
                phoneNumber: donationData.phoneNumber,
                isPhoneWhatsapp: donationData.isPhoneWhatsapp,
                gender: donationData.gender ?? 'NDA',
                birth: donationData.birth,
                state: donationData.state,
                city: donationData.city,
                street: donationData.street,

                homeNumber: donationData.homeNumber,
                complement: donationData.complement ?? 'NDA',
                district: donationData.district,
                zipCode: donationData.zipCode,
                cpf: donationData.cpf ?? 'NDA',
                rg: donationData.rg ?? 'NDA',
                cnpj: donationData.cnpj ?? 'NDA',
                ufrg: donationData.ufrg ?? 'NDA',
                valuePaid: 0,
                paymentDate: new Date(),
                paymentMethod: 'card',
                paymentStatus: 'Em processamento',
                stripeCustomerID: 'NDA',
                stripeSubscriptionID: 'NDA',
                ciclePaid: 0,
                ciclesBought: donationData.cycles,
                valueBought: unit_amount,

                donationExpirationDate: null
            }
        })

        return createdDonation
    } catch (error) {
        throw error
    }

}

async function updateDonationBought(createdDonation:any, stripeSubscription: Stripe.Response<Stripe.Subscription>, stripeCustomerID:string, unit_amount:number) {


    try {
        const { current_period_end, status, start_date, id } = stripeSubscription
        let { cancel_at } = stripeSubscription
        // const { unit_amount } = stripeResponse.stripeSubscription.items.data[0].price

        if (!cancel_at) {
            cancel_at = current_period_end
        }

        // // Atribuindo o stripeCustomerID a donation recém criada e atualizando os status de pagamento

        const cancelAtDate = new Date(cancel_at * 1000).getTime()
        const startAtDate = new Date(start_date * 1000).getTime()
        const totalPaymentsBought = Math.floor(((cancelAtDate - startAtDate) / (1000 * 60 * 60 * 24 * 30))) - 1;

        const donationUpdated = await prisma.donations.update({
            where: { id: createdDonation.id },
            data: {
                stripeCustomerID: stripeCustomerID,
                stripeSubscriptionID: id,
                paymentMethod: 'card',
                paymentStatus: status,
                paymentDate: new Date(start_date * 1000),
                donationExpirationDate: cancel_at ? new Date(cancel_at * 1000) : '',
                ciclePaid: 1,
                ciclesBought: totalPaymentsBought == 0? 1 : totalPaymentsBought,
                valueBought: unit_amount * (totalPaymentsBought),
                valuePaid: unit_amount

            }
        })

        return donationUpdated

    } catch (error) {
        throw error
    }
}

export {
    createDonationPix,
    updateDonationPix,
    getStripeProduct,
    createPrismaDonation,
    updateDonationBought
}