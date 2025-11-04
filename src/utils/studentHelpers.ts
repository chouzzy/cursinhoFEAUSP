import { StripeCustomer } from "../hooks/StripeCustomer"
import { CreateDonationProps } from "../modules/donations/useCases/createDonation/CreateDonationController"
import { SchoolClass } from "../modules/registrations/entities/SchoolClass"
import { Students } from "../modules/registrations/entities/Students"
import { CreatePixStudentRequestProps } from "../modules/registrations/useCases/Students/createPixStudents/CreatePixStudentsController"
import { CreateStudentRequestProps } from "../modules/registrations/useCases/Students/createStudents/CreateStudentsController"
import { prisma } from "../prisma"
import { pixCobDataProps } from "../types"

async function checkIfPixAlreadyConcluded(searchedStudent: any, studentData: CreatePixStudentRequestProps) {

    try {


        // CHECA SE O ESTUDANTE JÁ SE INSCREVEU E CONCLUIU O PAGAMENTO
        const studentAlreadySubscribed = await prisma.students.findFirst({
            where: {
                id: searchedStudent.id,
                purcharsedSubscriptions: {
                    some: {
                        AND: [
                            { schoolClassID: studentData.purcharsedSubscriptions.schoolClassID },
                            { paymentStatus: 'CONCLUIDA' }
                        ]
                    }
                }
            }
        })


        // RETORNA CASO A INSCRIÇÃO JÁ TENHA SIDO COMPRADA, caso contrario, continua
        if (studentAlreadySubscribed) { return true }

        else { return false }


    } catch (error) {
        throw error
    }

}

async function checkIfPixIsExpired(searchedStudent: any, studentData: CreatePixStudentRequestProps) {

    try {


        const studentAlreadySubscribedNotConcluded = await prisma.students.findFirst({
            where: {
                id: searchedStudent.id,
                purcharsedSubscriptions: {
                    some: {
                        AND: [
                            { schoolClassID: studentData.purcharsedSubscriptions.schoolClassID },
                            { paymentStatus: 'ATIVA' }
                        ]
                    }
                }
            }
        })


        if (studentAlreadySubscribedNotConcluded) {

            // CASO O PIX AINDA ESTEJA VÁLIDO
            const isExpired = studentAlreadySubscribedNotConcluded.purcharsedSubscriptions.some((sub) => {

                // Verifica se a assinatura pertence à mesma turma e se a data de expiração já passou
                if (sub.schoolClassID === studentData.purcharsedSubscriptions.schoolClassID) {

                    if (sub.pixDate == null || sub.pixExpiracaoEmSegundos == null) { return false }

                    else {

                        const expirationDate = new Date(sub.pixDate);
                        expirationDate.setSeconds(expirationDate.getSeconds() + sub.pixExpiracaoEmSegundos);

                        return expirationDate < new Date();
                    }
                }
            });

            return isExpired
        }

        return true

    } catch (error) {
        throw error
    }
}

async function getStudentByCPForRG(cpf: string, rg: string | null) {

    try {

        const searchedStudent = await prisma.students.findFirst({
            where: {
                OR: [
                    { cpf: cpf },
                    { rg: rg }
                ]
            }
        })

        return searchedStudent

    } catch (error) {
        throw error
    }

}

async function getEfiCredentials() {
    try {

        const credentials = Buffer.from(
            `${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`
        ).toString('base64');

        return credentials

    } catch (error) {
        throw error
    }
}

async function updateStudentPix(pixData: pixCobDataProps, searchedStudent: any, studentData: CreatePixStudentRequestProps) {

    try {

        const updatedStudent = await prisma.students.update({
            where: {
                id: searchedStudent.id,
            },
            data: {
                purcharsedSubscriptions: {
                    updateMany: {
                        where: { schoolClassID: studentData.purcharsedSubscriptions.schoolClassID },
                        data: {
                            paymentMethod: "PIX",
                            paymentStatus: "ATIVA",
                            paymentDate: new Date(),
                            valuePaid: 0,
                            txid: pixData.txid,
                            pixCopiaECola: pixData.pixCopiaECola,
                            pixQrCode: pixData.location,
                            pixStatus: pixData.status,
                            pixValor: pixData.valor.original,
                            pixDate: pixData.calendario.criacao,
                            pixExpiracaoEmSegundos: 180,
                        }
                    }
                }
            }
        })

        return updatedStudent

    } catch (error) {
        throw error
    }

}

async function createStudentPix(studentData: CreatePixStudentRequestProps, pixData: pixCobDataProps) {

    try {

        const createdStudent = await prisma.students.create({
            data: {
                name: studentData.name,
                email: studentData.email,
                gender: studentData.gender ?? 'Não informado',
                birth: studentData.birth,
                phoneNumber: studentData.phoneNumber,
                isPhoneWhatsapp: studentData.isPhoneWhatsapp,
                state: studentData.state,
                emailResponsavel: studentData.emailResponsavel ?? 'Não informado',
                aceiteTermoCiencia: studentData.aceiteTermoCiencia,
                aceiteTermoInscricao: studentData.aceiteTermoInscricao,

                city: studentData.city,
                street: studentData.street,
                homeNumber: studentData.homeNumber,
                complement: studentData.complement ?? 'Não informado',
                district: studentData.district,
                zipCode: studentData.zipCode,

                cpf: studentData.cpf,
                rg: studentData.rg,
                ufrg: studentData.ufrg,
                selfDeclaration: studentData.selfDeclaration,
                oldSchool: studentData.oldSchool,
                oldSchoolAdress: studentData.oldSchoolAdress,
                highSchoolGraduationDate: studentData.highSchoolGraduationDate,
                highSchoolPeriod: studentData.highSchoolPeriod,
                metUsMethod: studentData.metUsMethod,
                exStudent: studentData.exStudent,
                stripeCustomerID: "",

                purcharsedSubscriptions: {
                    schoolClassID: studentData.purcharsedSubscriptions.schoolClassID,
                    paymentMethod: "PIX",
                    paymentStatus: "ATIVA",
                    paymentDate: new Date(),
                    valuePaid: 0,
                    txid: pixData.txid,
                    pixCopiaECola: pixData.pixCopiaECola,
                    pixQrCode: pixData.location,
                    pixStatus: pixData.status,
                    pixValor: pixData.valor.original,
                    pixDate: pixData.calendario.criacao,
                    pixExpiracaoEmSegundos: 180,

                }
            }
        })

        return createdStudent
    } catch (error) {
        throw error
    }

}

async function getSchoolClassPrice(schoolClassID: CreatePixStudentRequestProps["purcharsedSubscriptions"]["schoolClassID"]):
    Promise<
        'NOT FOUND' | 'CLOSED' | 'INACTIVE' |
        SchoolClass["subscriptions"]["price"] |
        undefined
    > {

    try {
        const schoolClass = await prisma.schoolClass.findFirst({
            where: {
                id: schoolClassID
            }
        })


        if (!schoolClass) {

            return 'NOT FOUND'
        }

        if (schoolClass.subscriptions.status === process.env.SCHOOLCLASS_STATUS_FECHADO) {
            return 'CLOSED'
        }
        if (schoolClass.status === process.env.SCHOOLCLASS_STATUS_TURMA_INATIVA) {
            return 'INACTIVE'
        }

        if (schoolClass.subscriptions.status === process.env.SCHOOLCLASS_STATUS_ABERTO &&
            schoolClass.status === process.env.SCHOOLCLASS_STATUS_TURMA_ATIVA) {

            return schoolClass.subscriptions.price
        }

        return undefined

    } catch (error) {
        throw error
    }

}

async function checkSchoolClassExists(schoolClassID: SchoolClass["id"]) {


    try {

        const searchedSchoolClass = await prisma.schoolClass.findFirst({
            where: { id: schoolClassID }
        })

        if (!searchedSchoolClass) {
            throw Error("A turma selecionada não existe")
        }

        if (searchedSchoolClass.subscriptions.status != "Aberto") {
            throw Error("A turma selecionada não está com as inscrições abertas")
        }

        return searchedSchoolClass

    } catch (error) {
        throw error
    }

}

async function getStudent(cpf: Students["cpf"], rg?: Students["rg"]) {


    try {

        const searchedStudent = await prisma.students.findFirst({
            where: {
                OR: [
                    { cpf: cpf },
                    { rg: rg }
                ]
            }
        })

        return searchedStudent

    } catch (error) {
        throw error
    }

}

async function getStudentAlreadyActive(studentID: Students["id"], schoolClassID: SchoolClass["id"]) {

    try {

        const studentAlreadyActive = await prisma.students.findFirst({
            where: {
                id: studentID,
                purcharsedSubscriptions: {
                    some: {
                        AND: [
                            { schoolClassID: schoolClassID },
                            { paymentStatus: 'CONCLUIDA' },
                        ]
                    }
                }
            }
        })

        return studentAlreadyActive
    } catch (error) {
        throw error
    }
}

async function getStripeStudentCustomerID(studentData: CreateStudentRequestProps) {

    try {
        const stripeCustomer = new StripeCustomer()
        let stripeSearchedCustomerID = await stripeCustomer.searchCustomer(studentData.cpf, null)

        //  CRIA CLIENTE NO STRIPE CASO NÃO EXISTA
        if (!stripeSearchedCustomerID) {

            let stripeCreatedCustomerID = await stripeCustomer.createCustomerStudent(studentData)
            stripeSearchedCustomerID = stripeCreatedCustomerID
        }

        return stripeSearchedCustomerID

    } catch (error) {
        throw error
    }
}
async function getStripeDonationCustomerID(donationData: CreateDonationProps) {

    try {
        const stripeCustomer = new StripeCustomer()

        const { cpf, cnpj } = donationData

        let stripeSearchedCustomerID

        if (cpf) {
            stripeSearchedCustomerID = await stripeCustomer.searchCustomer(cpf, null)
        }
        if (cnpj) {
            stripeSearchedCustomerID = await stripeCustomer.searchCustomer("NDA", cnpj)
        }

        //  CRIA CLIENTE NO STRIPE CASO NÃO EXISTA
        if (!stripeSearchedCustomerID) {

            let stripeCreatedCustomerID = await stripeCustomer.createCustomerDonations(donationData)
            stripeSearchedCustomerID = stripeCreatedCustomerID
        }

        return stripeSearchedCustomerID

    } catch (error) {
        throw error
    }
}

async function updateStudentPaymentInProgress(searchedStudent: any, schoolClassID: SchoolClass["id"]) {
    try {

        const findStudentBySchoolClassID = await prisma.students.findFirst({
            where: {
                cpf: searchedStudent.cpf,
                purcharsedSubscriptions: {
                    some: {
                        AND: [
                            { schoolClassID: schoolClassID }
                        ]
                    }
                }
            }
        })

        console.log('findStudentBySchoolClassID')
        console.log(findStudentBySchoolClassID)

        if (findStudentBySchoolClassID) {

            const studentUpdated = await prisma.students.update({
                where: { id: searchedStudent.id },
                data: {
                    purcharsedSubscriptions: {
                        updateMany: {
                            where: {
                                schoolClassID
                            },
                            data: {
                                paymentStatus: 'Em processamento',
                            }
                        }
                    }
                }
            })

            return studentUpdated

        } else {

            const studentUpdated = await prisma.students.update({
                where: { id: searchedStudent.id },
                data: {
                    purcharsedSubscriptions: {
                        push: {
                            schoolClassID,
                            paymentDate: new Date(),
                            paymentMethod: 'card',
                            paymentStatus: 'Em andamento',
                            valuePaid: 0
                        }
                    }
                }
            })

            return studentUpdated
        }



    } catch (error) {
        throw error
    }
}

async function createStudent(studentData: CreateStudentRequestProps, stripeCustomerID: string, schoolClassID: SchoolClass["id"]) {
    try {

        const createdStudent = await prisma.students.create({
            data: {
                name: studentData.name,
                email: studentData.email,
                gender: studentData.gender ?? 'Não informado',
                birth: studentData.birth,
                phoneNumber: studentData.phoneNumber,
                isPhoneWhatsapp: studentData.isPhoneWhatsapp,
                state: studentData.state,
                emailResponsavel: studentData.emailResponsavel ?? 'Não informado',
                aceiteTermoCiencia: studentData.aceiteTermoCiencia,
                aceiteTermoInscricao: studentData.aceiteTermoInscricao,

                city: studentData.city,
                street: studentData.street,
                homeNumber: studentData.homeNumber,
                complement: studentData.complement ?? 'Não informado',
                district: studentData.district,
                zipCode: studentData.zipCode,

                cpf: studentData.cpf,
                rg: studentData.rg,
                ufrg: studentData.ufrg,
                selfDeclaration: studentData.selfDeclaration,
                oldSchool: studentData.oldSchool,
                oldSchoolAdress: studentData.oldSchoolAdress,
                highSchoolGraduationDate: studentData.highSchoolGraduationDate,
                highSchoolPeriod: studentData.highSchoolPeriod,
                metUsMethod: studentData.metUsMethod,
                exStudent: studentData.exStudent,
                stripeCustomerID: stripeCustomerID,

                purcharsedSubscriptions: [
                    {
                        paymentDate: new Date(),
                        paymentMethod: 'card',
                        paymentStatus: 'Em processamento',
                        schoolClassID: schoolClassID,
                        valuePaid: 0,

                    }
                ]
            }
        })
    } catch (error) {
        throw error
    }
}

export {
    checkIfPixAlreadyConcluded,
    checkIfPixIsExpired,
    getStudentByCPForRG,
    getEfiCredentials,
    updateStudentPix,
    createStudentPix,
    getSchoolClassPrice,
    checkSchoolClassExists,
    getStudent,
    getStudentAlreadyActive,
    getStripeStudentCustomerID,
    getStripeDonationCustomerID,
    updateStudentPaymentInProgress,
    createStudent
}