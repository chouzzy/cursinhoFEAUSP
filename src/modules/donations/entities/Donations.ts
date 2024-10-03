import { Donations as DonationsPrisma } from "@prisma/client"

class Donations {

    id!: DonationsPrisma["id"]
    name!: DonationsPrisma["name"]
    email!: DonationsPrisma["email"]
    phoneNumber!: DonationsPrisma["phoneNumber"]
    isPhoneWhatsapp!: DonationsPrisma["isPhoneWhatsapp"]
    gender?: DonationsPrisma["gender"]
    birth!: DonationsPrisma["birth"]
    state!: DonationsPrisma["state"]
    city!: DonationsPrisma["city"]
    street!: DonationsPrisma["street"]
    homeNumber!: DonationsPrisma["homeNumber"]
    complement!: DonationsPrisma["complement"]
    district!: DonationsPrisma["district"]
    zipCode!: DonationsPrisma["zipCode"]

    cpf!: DonationsPrisma["cpf"]
    rg!: DonationsPrisma["rg"]
    cnpj!: DonationsPrisma["cnpj"]
    ufrg!: DonationsPrisma["ufrg"]

    valuePaid!: DonationsPrisma["valuePaid"]
    paymentMethod!: DonationsPrisma["paymentMethod"]
    paymentStatus!: DonationsPrisma["paymentStatus"]
    paymentDate!: DonationsPrisma["paymentDate"]

    stripeCustomerID?: DonationsPrisma["stripeCustomerID"]
    stripeSubscriptionID!: DonationsPrisma["stripeSubscriptionID"]
    donationExpirationDate!: DonationsPrisma["donationExpirationDate"]

    txid?: DonationsPrisma["txid"]
    pixCopiaECola?: DonationsPrisma["pixCopiaECola"]
    pixQrCode?: DonationsPrisma["pixQrCode"]
    pixStatus?: DonationsPrisma["pixStatus"]
    pixValor?: DonationsPrisma["pixValor"]
    pixDate?: DonationsPrisma["pixDate"]
    pixExpiracaoEmSegundos?: DonationsPrisma["pixExpiracaoEmSegundos"]

    createdAt!: DonationsPrisma["createdAt"]

}

export { Donations }


















// cpf!: string
// rg!: string | null
// cnpj!: string | null
// ufrg!: string

// valuePaid!: number
// paymentMethod!: string
// paymentStatus!: string
// paymentDate!: Date | null

// stripeCustomerID?: string
// stripeSubscriptionID!: string | null
// donationExpirationDate!: Date | null

// txid?: string | null
// pixCopiaECola?: string | null
// pixQrCode?: string | null
// pixStatus?: string | null
// pixValor?: string | null
// pixDate?: string | null
// pixExpiracaoEmSegundos?: number | null

// createdAt!: Date