class Students {

    id!:            string
    name!:          string
    email!:         string
    gender!:        string
    birth!:         string
    phoneNumber!:   string
    isPhoneWhatsapp!: boolean
    country!:       string
    state!:         string
    city!:          string

    address!:                  string
    cpf!:                      string
    rg!:                       string
    selfDeclaration!:          string
    oldSchool!:                string
    oldSchoolAdress!:          string
    highSchoolGraduationDate!: string
    highSchoolPeriod!:         string
    metUsMethod!:              string
    exStudent!:                string
    stripeCustomerID!:         string
    
    purcharsedSubscriptions!: purcharsedSubscriptions[]
    createdAt!:     Date
}

interface purcharsedSubscriptions {
    schoolClassID: string
    productID:     string
    productName:   string
    paymentMethod: string
    paymentStatus: string
    paymentDate:   Date | null
    valuePaid:     number
}

export {Students, purcharsedSubscriptions}