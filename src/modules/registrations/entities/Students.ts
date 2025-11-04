class Students {

    id!: string
    name!: string
    email!: string
    gender!: string
    birth!: string
    phoneNumber!: string
    isPhoneWhatsapp!: boolean

    state!: string
    city!: string
    street!: string
    homeNumber!: string
    complement!: string | null
    district!: string
    zipCode!: string

    cpf!: string
    rg!: string | null
    ufrg!: string

    emailResponsavel!: string | null // Opcional, para o e-mail do responsável
    aceiteTermoCiencia!: boolean // Obrigatório para o aceite
    aceiteTermoInscricao!: boolean // Obrigatório para o aceite

    selfDeclaration!: string
    oldSchool!: string
    oldSchoolAdress!: string
    highSchoolGraduationDate!: string
    highSchoolPeriod!: string
    metUsMethod!: string
    exStudent!: string
    stripeCustomerID!: string

    purcharsedSubscriptions!: purcharsedSubscriptions[]
    createdAt!: Date
}

interface purcharsedSubscriptions {
    schoolClassID: string
    stripeSubscriptionID?: string
    productID?: string
    productName?: string
    paymentMethod: string
    paymentStatus: string
    paymentDate: Date | null
    valuePaid: number

    txid?: string
    pixCopiaECola?: string
    pixQrCode?: string
    pixStatus?: string
    pixValor?: string
    pixDate?: string
    pixExpiracaoEmSegundos?: number
}

export { Students, purcharsedSubscriptions }