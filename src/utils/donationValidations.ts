import { CreatePixDonationProps } from "../modules/donations/useCases/createPixDonation/CreatePixDonationController"
import { prisma } from "../prisma"
import { pixCobDataProps } from "../types"

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

export { createDonationPix, updateDonationPix }