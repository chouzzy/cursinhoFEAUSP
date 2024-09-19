class Donations {

    id!: string
    name!: string
    email!: string
    phoneNumber!: string
    isPhoneWhatsapp!: boolean
    gender?: string
    birth!: string
    state!: string
    city!: string
    street!: string
    homeNumber!: string
    complement!: string | null
    district!: string
    zipCode!: string

    cpf!: string
    rg!: string | null
    cnpj!: string | null
    ufrg!: string

    valuePaid!: number
    paymentMethod!: string
    paymentStatus!: string
    paymentDate!: Date | null

    stripeCustomerID?: string
    stripeSubscriptionID?: string
    donationExpirationDate!: Date | null

    txid?: string | null
    pixCopiaECola?: string | null
    pixQrCode?: string | null
    pixStatus?: string | null
    pixValor?: string | null
    pixDate?: string | null
    pixExpiracaoEmSegundos?: number | null

    createdAt!: Date
}

export { Donations }