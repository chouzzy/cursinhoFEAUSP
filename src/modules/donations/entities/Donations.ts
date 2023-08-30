class Donations {

    id!: string
    name!: string
    email!: string
    phoneNumber!: string
    isPhoneWhatsapp!: boolean
    gender?: string
    birth!: string
    state!:string
    city!:string
    street!:string
    homeNumber!:string
    complement!: string| null
    district!:string
    zipCode!:string

    cpf!: string
    rg!: string | null
    ufrg!: string

    valuePaid!: number
    paymentMethod!: string
    paymentStatus!: string
    paymentDate!: Date | null

    stripeCustomerID?: string
    donationExpirationDate!: Date | null

    createdAt!: Date
}

export { Donations }