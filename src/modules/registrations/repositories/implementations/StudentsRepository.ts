import { Prisma } from "@prisma/client";
import { prisma } from "../../../../prisma";
import { pixCobDataProps, validationResponse } from "../../../../types";
import { Students, purcharsedSubscriptions } from "../../entities/Students";
import { CreateStudentRequestProps } from "../../useCases/Students/createStudents/CreateStudentsController";
import { UpdateStudentRequestProps } from "../../useCases/Students/updateStudents/UpdateStudentController";
import { IStudentsRepository } from "../IStudentsRepository";
import { StripeCustomer } from "../../../../hooks/StripeCustomer";
import { StripeFakeFront } from "../../../../hooks/StripeFakeFront";
import { ListStudentsQuery } from "../../useCases/Students/listStudents/ListStudentsController";
import { agent, stripe } from "../../../../server";
import Stripe from "stripe";
import { checkDuplicateSchoolClassIDs } from "../../../../hooks/checkDuplicatedSchoolClassID";
import { CreatePixStudentRequestProps } from "../../useCases/Students/createPixStudents/CreatePixStudentsController";
import { criarCobrancaPix, getEfíAccessToken } from "../../../../hooks/efíHooks";


class StudentsRepository implements IStudentsRepository {

    private students: Students[]
    constructor() {
        this.students = [];
    }

    async filterStudent(
        { id, name, email, cpf, paymentStatus, schoolClassID, initDate, endDate }: ListStudentsQuery,
        page: number,
        pageRange: number
    ): Promise<validationResponse> {

        try {
            if (page == 0) {
                page = 1
            }


            let filteredStudents = await prisma.students.findMany({
                where: {
                    AND: [
                        { id: id },
                        { name: { contains: name } },
                        { email: email },
                        { cpf: cpf },
                        {
                            purcharsedSubscriptions: {
                                some: {
                                    schoolClassID: schoolClassID,
                                    paymentStatus: paymentStatus,
                                    paymentDate: {
                                        gte: new Date(initDate),
                                        lte: new Date(endDate)
                                    }
                                }
                            },
                        },
                    ]
                },
                skip: (page - 1) * pageRange,
                take: pageRange
            })


            // const studentsPerSchoolClass: Students[] = []
            // filteredStudents.map(student => {

            //     const check = student.purcharsedSubscriptions.map(sub => {


            //         if (sub.paymentDate) {


            //             if ((new Date(endDate) > sub.paymentDate) && (sub.paymentDate > new Date(initDate))) {

            //                 return true
            //             }

            //             else {
            //                 return false
            //             }
            //         }
            //     })

            //     if (check.includes(true)) {
            //         studentsPerSchoolClass.push(student)
            //     }
            // })

            // filteredStudents = studentsPerSchoolClass

            // Filtro por turma

            // if (schoolClassID) {
            //     const studentsPerSchoolClass: Students[] = []


            //     filteredStudents.map(student => {

            //         const check = student.purcharsedSubscriptions.map(sub => {

            //             if (sub.schoolClassID == schoolClassID) {
            //                 if (!paymentStatus) {
            //                     return true

            //                 } else if (sub.paymentStatus == paymentStatus) {
            //                     return true
            //                 }
            //             }
            //             return false


            //         })

            //         if (check.includes(true)) {
            //             studentsPerSchoolClass.push(student)
            //         }

            //     })


            //     return {
            //         isValid: true,
            //         statusCode: 202,
            //         studentsList: studentsPerSchoolClass,
            //         totalDocuments: studentsPerSchoolClass.length
            //     }
            // }

            //Filtro apenas por status de pagamento
            // if (paymentStatus && !schoolClassID) {
            //     const studentsPerPaymentStatus: Students[] = []

            //     filteredStudents.map(student => {

            //         student.purcharsedSubscriptions.map(sub => {

            //             if (sub.paymentStatus == paymentStatus) {
            //                 studentsPerPaymentStatus.push(student)
            //             }
            //         })
            //     })

            //     return {
            //         isValid: true,
            //         statusCode: 202,
            //         studentsList: studentsPerPaymentStatus,
            //         totalDocuments: studentsPerPaymentStatus.length
            //     }
            // }

            return {
                isValid: true,
                statusCode: 202,
                studentsList: filteredStudents,
                totalDocuments: filteredStudents.length
            }

        } catch (error: unknown) {
            if (error instanceof Prisma.PrismaClientValidationError) {

                const argumentPosition = error.message.search('Argument')
                const mongoDBError = error.message.slice(argumentPosition)
                return { isValid: false, errorMessage: mongoDBError, statusCode: 403 }

            } else {
                return { isValid: false, errorMessage: String(error), statusCode: 403 }
            }
        }
    }

    async createPixStudent(studentData: CreatePixStudentRequestProps): Promise<validationResponse> {

        try {

            // CHECA SE A TURMA EXISTE
            const studentDataSchoolClassID = studentData.purcharsedSubscriptions.schoolClassID
            const searchedSchoolClass = await prisma.schoolClass.findFirst({
                where: { id: studentDataSchoolClassID }
            })

            if (!searchedSchoolClass) {
                return {
                    isValid: false,
                    errorMessage: `Turma não encontrada.`,
                    statusCode: 403
                }
            }

            // CHECA SE O ESTUDANTE EXISTE NO BANCO DE DADOS
            const searchedStudent = await prisma.students.findFirst({
                where: {
                    OR: [
                        { cpf: studentData.cpf },
                        { rg: studentData.rg }
                    ]
                }
            })




            // CHECA SE JA EXISTE O ESTUDANTE NO STRIPE E NO BANCO
            if (searchedStudent) {

                //CHECA SE A INSCRIÇÃO JÁ FOI COMPRADA ANTERIORMENTE  E O PAGAMENTO ESTÁ ACTIVE
                let subscriptionsDuplicated: Array<purcharsedSubscriptions["schoolClassID"]> = []

                // CHECA SE O ESTUDANTE JÁ SE INSCREVEU E A MESMA ESTÁ ATIVA
                const studentAlreadySubscribed = await prisma.students.findFirst({
                    where: {
                        id: searchedStudent.id,
                        purcharsedSubscriptions: {
                            some: {
                                AND: [
                                    { schoolClassID: studentData.purcharsedSubscriptions.schoolClassID },
                                    { paymentStatus: 'active' }
                                ]
                            }
                        }
                    }
                })


                // RETORNA CASO A INSCRIÇÃO JÁ TENHA SIDO COMPRADA, caso contrario, continua
                if (studentAlreadySubscribed) {

                    return {
                        isValid: false,
                        errorMessage: `A inscrição já foi comprada anteriormente e está ativa.`,
                        subscriptionsDuplicated: subscriptionsDuplicated,
                        statusCode: 403
                    }
                }


                // CHECA SE A INSCRIÇÃO JÁ FOI COMPRADA ANTERIORMENTE, MAS O PAGAMENTO NÃO FOI APROVADO
                const studentAlreadySubscribedInactive = await prisma.students.findFirst({
                    where: {
                        id: searchedStudent.id,
                        purcharsedSubscriptions: {
                            some: {
                                AND: [
                                    { schoolClassID: studentData.purcharsedSubscriptions.schoolClassID },
                                ]
                            }
                        }
                    }
                })




                // CRIANDO PIX
                const credentials = Buffer.from(
                    `${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`
                ).toString('base64');

                // PIX ACCESS TOKEN
                const efiAccessToken = await getEfíAccessToken(agent, credentials)

                // PIX COB
                const pixData: pixCobDataProps = await criarCobrancaPix(agent, efiAccessToken, JSON.stringify({

                    calendario: {
                        expiracao: 60 * 3
                    },
                    devedor: {
                        cpf: `${studentData.cpf}`,
                        nome: `${studentData.name}`
                    },
                    valor: {
                        original: `0.04`
                    },
                    chave: `${process.env.EFI_CHAVE_PIX}`,
                    solicitacaoPagador: `Muito obrigado pela sua contribuição, ${studentData.name}! :)`

                }))




                //TENTANDO EFETUAR O PAGAMENTO NOVAMENTE DA INSCRIÇÃO NÃO APROVADA
                if (studentAlreadySubscribedInactive) {

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
                                        paymentStatus: "active",
                                        paymentDate: new Date(),
                                        valuePaid: 0,
                                        txid: pixData.txid,
                                        pixCopiaECola: pixData.pixCopiaECola,
                                        pixQrCode: pixData.location,
                                        pixStatus: pixData.status,
                                        pixValor: `${pixData.valor}`,
                                        pixDate: pixData.calendario.criacao,
                                        pixExpiracaoEmSegundos: 180,
                                    }
                                }
                            }
                        }
                    })

                    return {
                        isValid: true,
                        errorMessage: `Estudante atualizado com sucesso!`,
                        students: updatedStudent,
                        statusCode: 202
                    }

                }

            }



            // CRIANDO PIX
            const credentials = Buffer.from(
                `${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`
            ).toString('base64');

            // PIX ACCESS TOKEN
            const efiAccessToken = await getEfíAccessToken(agent, credentials)

            // PIX COB
            const pixData: pixCobDataProps = await criarCobrancaPix(agent, efiAccessToken, JSON.stringify({

                calendario: {
                    expiracao: 60 * 3
                },
                devedor: {
                    cpf: `${studentData.cpf}`,
                    nome: `${studentData.name}`
                },
                valor: {
                    original: `0.04`
                },
                chave: `${process.env.EFI_CHAVE_PIX}`,
                solicitacaoPagador: `Muito obrigado pela sua contribuição, ${studentData.name}! :)`

            }))



            const createdStudent = await prisma.students.create({
                data: {
                    name: studentData.name,
                    email: studentData.email,
                    gender: studentData.gender ?? 'Não informado',
                    birth: studentData.birth,
                    phoneNumber: studentData.phoneNumber,
                    isPhoneWhatsapp: studentData.isPhoneWhatsapp,
                    state: studentData.state,

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
                        paymentStatus: "aguardando",
                        paymentDate: new Date(),
                        valuePaid: 0,
                        txid: pixData.txid,
                        pixCopiaECola: pixData.pixCopiaECola,
                        pixQrCode: pixData.location,
                        pixStatus: pixData.status,
                        pixValor: `${pixData.valor}`,
                        pixDate: pixData.calendario.criacao,
                        pixExpiracaoEmSegundos: 180,

                    }
                }
            })

            return {
                isValid: true,
                successMessage: 'Estudante criado no banco de dados',
                students: createdStudent,
                statusCode: 202
            }


        } catch (error: unknown) {
            if (error instanceof Prisma.PrismaClientValidationError) {

                const argumentPosition = error.message.search('Argument')
                const mongoDBError = error.message.slice(argumentPosition)
                return { isValid: false, errorMessage: mongoDBError, statusCode: 403 }


            }
            if (error instanceof Stripe.errors.StripeError) {
                // Retorna uma resposta de erro com o código de status do erro do Stripe.
                return {
                    statusCode: error.statusCode ?? 403,
                    isValid: false,
                    errorMessage: error.message,
                };
            }
            return { isValid: false, errorMessage: String(error), statusCode: 403 }
        }
    }

    async createStudent(studentData: CreateStudentRequestProps): Promise<validationResponse> {

        // try {

        //     // CHECA SE A SCHOOLCLASS JÁ FOI COMPRADA
        //     function checkDuplicateSchoolClassIDs(purcharsedSubscriptions: Students["purcharsedSubscriptions"]) {
        //         const uniqueIDs = new Set();

        //         for (const subscription of purcharsedSubscriptions) {
        //             if (uniqueIDs.has(subscription.schoolClassID)) {
        //                 return true; // Duplicate found
        //             }
        //             uniqueIDs.add(subscription.schoolClassID);
        //         }

        //         return false; // No duplicates found
        //     }

        //     const { purcharsedSubscriptions } = studentData

        //     const hasDuplicateSchoolClassIDs = checkDuplicateSchoolClassIDs(purcharsedSubscriptions);

        //     if (hasDuplicateSchoolClassIDs) {
        //         return {
        //             isValid: false,
        //             errorMessage: `A inscrição já foi comprada anteriormente.`,
        //             statusCode: 403
        //         }
        //     }


        //     // CHECA SE A TURMA EXISTE
        //     const studentDataSchoolClassID = studentData.purcharsedSubscriptions[0].schoolClassID
        //     const searchedSchoolClass = await prisma.schoolClass.findFirst({
        //         where: { id: studentDataSchoolClassID }
        //     })

        //     if (!searchedSchoolClass) {
        //         return {
        //             isValid: false,
        //             errorMessage: `Turma não encontrada.`,
        //             statusCode: 403
        //         }
        //     }

        //     // CHECA SE O ESTUDANTE JÁ TEM ALGUMA INSCRIÇÃO ANTERIOR
        //     const searchedStudent = await prisma.students.findFirst({
        //         where: {
        //             OR: [
        //                 { cpf: studentData.cpf },
        //                 { rg: studentData.rg }
        //             ]
        //         }
        //     })

        //     const stripeCustomer = new StripeCustomer()
        //     const { cpf, rg } = studentData
        //     const stripeSearchedCustomerID = await stripeCustomer.searchCustomer(cpf, null)



        //     // CHECA SE JA EXISTE O ESTUDANTE NO STRIPE E NO BANCO
        //     if (searchedStudent && stripeSearchedCustomerID) {

        //         //CHECA SE A INSCRIÇÃO JÁ FOI COMPRADA ANTERIORMENTE  E O PAGAMENTO ESTÁ ACTIVE
        //         let subscriptionsDuplicated: Array<purcharsedSubscriptions["schoolClassID"]> = []

        //         //Filtro para possível cadastro em turma que já foi paga.
        //         studentData.purcharsedSubscriptions.map((subscription) => {

        //             searchedStudent.purcharsedSubscriptions.map(
        //                 (subscriptionAlreadyRegistered) => {

        //                     if (subscriptionAlreadyRegistered.schoolClassID == subscription.schoolClassID
        //                         &&
        //                         subscriptionAlreadyRegistered.paymentStatus == "active"
        //                     ) {

        //                         subscriptionsDuplicated.push(subscription.schoolClassID)
        //                     }
        //                 })
        //         })

        //         // RETORNA CASO A INSCRIÇÃO JÁ TENHA SIDO COMPRADA, caso contrario, continua
        //         if (subscriptionsDuplicated.length > 0) {

        //             return {
        //                 isValid: false,
        //                 errorMessage: `Uma ou mais inscrições já foram compradas pelo estudante.`,
        //                 subscriptionsDuplicated: subscriptionsDuplicated,
        //                 statusCode: 403
        //             }
        //         }

        //         // CHECA SE A INSCRIÇÃO JÁ FOI COMPRADA ANTERIORMENTE, MAS O PAGAMENTO NÃO FOI APROVADO
        //         const isDuplicatedInactiveSubscription = checkDuplicateSchoolClassIDs(
        //             [
        //                 ...searchedStudent.purcharsedSubscriptions,
        //                 ...studentData.purcharsedSubscriptions
        //             ]
        //         )

        //         //TENTANDO EFETUAR O PAGAMENTO NOVAMENTE DA INSCRIÇÃO NÃO APROVADA
        //         if (isDuplicatedInactiveSubscription) {

        //             const stripeFrontEnd = new StripeFakeFront()
        //             const stripeResponse = await stripeFrontEnd.createSubscription({
        //                 stripeCustomerID: stripeSearchedCustomerID,
        //                 cpf: cpf,
        //                 rg: rg,
        //                 schoolClassID: studentDataSchoolClassID,
        //                 cycles: 1,
        //                 paymentMethodID: studentData.paymentMethodID,
        //                 productSelectedID: studentData.productSelectedID
        //             })

        //             if (!stripeResponse.stripeSubscription) {

        //                 return stripeResponse
        //             }

        //             const { status, start_date, id } = stripeResponse.stripeSubscription
        //             const { unit_amount } = stripeResponse.stripeSubscription.items.data[0].price

        //             const { title, stripeProductID } = searchedSchoolClass

        //             searchedStudent.purcharsedSubscriptions.map(subscription => {

        //                 if (subscription.schoolClassID == studentDataSchoolClassID) {
        //                     subscription.productID = stripeProductID,
        //                         subscription.stripeSubscriptionID = id,
        //                         subscription.productName = title,
        //                         subscription.paymentMethod = 'creditcard',
        //                         subscription.paymentStatus = status,
        //                         subscription.paymentDate = new Date(start_date * 1000),
        //                         subscription.valuePaid = unit_amount ?? studentData.purcharsedSubscriptions[0].valuePaid
        //                 }
        //             })

        //             await prisma.students.update({
        //                 where: { id: searchedStudent.id },
        //                 data: {
        //                     purcharsedSubscriptions: searchedStudent.purcharsedSubscriptions
        //                 }
        //             })

        //             return {
        //                 isValid: true,
        //                 errorMessage: `Estudante atualizado com sucesso!`,
        //                 students: searchedStudent,
        //                 statusCode: 202
        //             }

        //         }

        //         // Só vai chegar aqui a inscrição
        //         const stripeFrontEnd2 = new StripeFakeFront()
        //         const stripeResponse = await stripeFrontEnd2.createSubscription({
        //             stripeCustomerID: stripeSearchedCustomerID,
        //             cpf: cpf,
        //             rg: rg,
        //             schoolClassID: studentDataSchoolClassID,
        //             cycles: 1,
        //             paymentMethodID: studentData.paymentMethodID,
        //             productSelectedID: studentData.productSelectedID
        //         })

        //         if (!stripeResponse.stripeSubscription) {

        //             return stripeResponse
        //         }

        //         const { status, start_date, id } = stripeResponse.stripeSubscription
        //         const { unit_amount } = stripeResponse.stripeSubscription.items.data[0].price

        //         const { title, stripeProductID } = searchedSchoolClass

        //         studentData.purcharsedSubscriptions.map(async subscription => {

        //             if (subscription.schoolClassID == studentDataSchoolClassID) {
        //                 subscription.productID = stripeProductID,
        //                     subscription.stripeSubscriptionID = id,
        //                     subscription.productName = title,
        //                     subscription.paymentMethod = 'creditcard',
        //                     subscription.paymentStatus = status,
        //                     subscription.paymentDate = new Date(start_date * 1000),
        //                     subscription.valuePaid = unit_amount ?? studentData.purcharsedSubscriptions[0].valuePaid,
        //                     subscription.txid = "",
        //                     subscription.pixCopiaECola = "",
        //                     subscription.pixQrCode = "",
        //                     subscription.pixStatus = "",
        //                     subscription.pixValor = "",
        //                     subscription.pixDate = "",
        //                     subscription.pixExpiracaoEmSegundos = "",

        //             }
        //         })

        //         const updatedStudent = await prisma.students.update({
        //             where: { id: searchedStudent.id },
        //             data: {
        //                 purcharsedSubscriptions: searchedStudent.purcharsedSubscriptions.concat(studentData.purcharsedSubscriptions)
        //             }
        //         })

        //         const { statusCode, successMessage, isValid } = stripeResponse
        //         return {
        //             isValid,
        //             successMessage,
        //             students: updatedStudent,
        //             statusCode
        //         }

        //     }

        //     // Student não encontrado no banco e no stripe:
        //     const stripeCustomerCreatedID = await stripeCustomer.createCustomer(studentData)

        //     const stripeFrontEnd = new StripeFakeFront()

        //     const stripeResponse = await stripeFrontEnd.createSubscription({
        //         stripeCustomerID: stripeCustomerCreatedID,
        //         cpf: cpf,
        //         rg: rg,
        //         schoolClassID: studentDataSchoolClassID,
        //         cycles: 1,
        //         paymentMethodID: studentData.paymentMethodID,
        //         productSelectedID: studentData.productSelectedID
        //     })


        //     if (!stripeResponse.isValid) {
        //         return {
        //             isValid: stripeResponse.isValid,
        //             errorMessage: stripeResponse.errorMessage,
        //             statusCode: stripeResponse.statusCode
        //         }
        //     }

        //     if (stripeResponse.stripeSubscription) {

        //         const { status, start_date, id } = stripeResponse.stripeSubscription
        //         const { unit_amount } = stripeResponse.stripeSubscription.items.data[0].price
        //         const { title, stripeProductID } = searchedSchoolClass

        //         studentData.purcharsedSubscriptions.map(async subscription => {

        //             if (subscription.schoolClassID == studentDataSchoolClassID) {

        //                 subscription.paymentDate = new Date(start_date * 1000),
        //                     subscription.stripeSubscriptionID = id,
        //                     subscription.paymentMethod = 'creditcard',
        //                     subscription.paymentStatus = status,
        //                     subscription.productID = stripeProductID,
        //                     subscription.productName = title,
        //                     subscription.valuePaid = unit_amount ?? studentData.purcharsedSubscriptions[0].valuePaid
        //             }
        //         })

        //         const createdStudent = await prisma.students.create({
        //             data: {
        //                 name: studentData.name,
        //                 email: studentData.email,
        //                 gender: studentData.gender ?? 'Não informado',
        //                 birth: studentData.birth,
        //                 phoneNumber: studentData.phoneNumber,
        //                 isPhoneWhatsapp: studentData.isPhoneWhatsapp,
        //                 state: studentData.state,

        //                 city: studentData.city,
        //                 street: studentData.street,
        //                 homeNumber: studentData.homeNumber,
        //                 complement: studentData.complement ?? 'Não informado',
        //                 district: studentData.district,
        //                 zipCode: studentData.zipCode,

        //                 cpf: studentData.cpf,
        //                 rg: studentData.rg,
        //                 ufrg: studentData.ufrg,
        //                 selfDeclaration: studentData.selfDeclaration,
        //                 oldSchool: studentData.oldSchool,
        //                 oldSchoolAdress: studentData.oldSchoolAdress,
        //                 highSchoolGraduationDate: studentData.highSchoolGraduationDate,
        //                 highSchoolPeriod: studentData.highSchoolPeriod,
        //                 metUsMethod: studentData.metUsMethod,
        //                 exStudent: studentData.exStudent,
        //                 stripeCustomerID: stripeCustomerCreatedID,

        //                 purcharsedSubscriptions: studentData.purcharsedSubscriptions
        //             }
        //         })

        //         const { statusCode, successMessage, isValid } = stripeResponse
        //         return {
        //             isValid,
        //             successMessage,
        //             students: createdStudent,
        //             statusCode
        //         }
        //     }

        //     //STRIPE RESPONSE DEU ERRO
        //     let studentSchoolClasses: purcharsedSubscriptions[] = []

        //     studentData.purcharsedSubscriptions.map((subscription) => {
        //         studentSchoolClasses.push({
        //             schoolClassID: subscription.schoolClassID,
        //             stripeSubscriptionID: subscription.stripeSubscriptionID,
        //             paymentDate: subscription.paymentDate ?? null,
        //             paymentMethod: subscription.paymentMethod ?? 'Pagamento não confirmado',
        //             paymentStatus: subscription.paymentStatus ?? 'Pagamento não confirmado',
        //             productID: subscription.productID ?? 'Pagamento não confirmado',
        //             productName: subscription.productName ?? 'Pagamento não confirmado',
        //             valuePaid: subscription.valuePaid ?? 0
        //         })
        //     })

        //     const createdStudent = await prisma.students.create({
        //         data: {
        //             name: studentData.name,
        //             email: studentData.email,
        //             gender: studentData.gender ?? 'Não informado',
        //             birth: studentData.birth,
        //             phoneNumber: studentData.phoneNumber,
        //             isPhoneWhatsapp: studentData.isPhoneWhatsapp,
        //             state: studentData.state,

        //             city: studentData.city,
        //             street: studentData.street,
        //             homeNumber: studentData.homeNumber,
        //             complement: studentData.complement ?? 'Não informado',
        //             district: studentData.district,
        //             zipCode: studentData.zipCode,

        //             cpf: studentData.cpf,
        //             rg: studentData.rg,
        //             ufrg: studentData.ufrg,
        //             selfDeclaration: studentData.selfDeclaration,
        //             oldSchool: studentData.oldSchool,
        //             oldSchoolAdress: studentData.oldSchoolAdress,
        //             highSchoolGraduationDate: studentData.highSchoolGraduationDate,
        //             highSchoolPeriod: studentData.highSchoolPeriod,
        //             metUsMethod: studentData.metUsMethod,
        //             exStudent: studentData.exStudent,
        //             stripeCustomerID: stripeCustomerCreatedID,

        //             purcharsedSubscriptions: studentSchoolClasses
        //         }
        //     })


        //     const { statusCode, isValid, errorMessage } = stripeResponse
        //     return {
        //         isValid,
        //         successMessage: 'Estudante criado no banco de dados',
        //         errorMessage,
        //         students: createdStudent,
        //         statusCode
        //     }


        // } catch (error: unknown) {
        //     if (error instanceof Prisma.PrismaClientValidationError) {

        //         const argumentPosition = error.message.search('Argument')
        //         const mongoDBError = error.message.slice(argumentPosition)
        //         return { isValid: false, errorMessage: mongoDBError, statusCode: 403 }


        //     }
        //     if (error instanceof Stripe.errors.StripeError) {
        //         // Retorna uma resposta de erro com o código de status do erro do Stripe.
        //         return {
        //             statusCode: error.statusCode ?? 403,
        //             isValid: false,
        //             errorMessage: error.message,
        //         };
        //     }
        //     return { isValid: false, errorMessage: String(error), statusCode: 403 }
        // }

        return {
            isValid: true,
            statusCode: 202,
            successMessage: 'Rota em manutenção'
        }
    }

    async updateStudent(studentData: UpdateStudentRequestProps, studentID: Students["id"]): Promise<validationResponse> {
        try {

            const student = await prisma.students.findUnique({
                where: {
                    id: studentID
                }
            })

            if (!student) {
                return {
                    isValid: false,
                    errorMessage: 'Estudante não encontrado.',
                    statusCode: 404
                }
            }

            const updatedStudent = await prisma.students.update({
                where: {
                    id: studentID
                },
                data: {
                    ...studentData,
                }
            })
            return {
                isValid: true,
                statusCode: 202,
                students: updatedStudent
            }

        } catch (error: unknown) {

            if (error instanceof Prisma.PrismaClientValidationError) {
                const argumentPosition = error.message.search('Argument')
                const mongoDBError = error.message.slice(argumentPosition)
                return { isValid: false, errorMessage: mongoDBError, statusCode: 403 }
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                return { isValid: false, errorMessage: error, statusCode: 403 }
            }

            else {
                return { isValid: false, errorMessage: String(error), statusCode: 403 }
            }
        }
    }

    async cancelSubscription(studentID: Students["id"], stripeSubscriptionID: Students["purcharsedSubscriptions"][0]["stripeSubscriptionID"]): Promise<validationResponse> {
        try {

            const student = await prisma.students.findFirst({
                where: {
                    id: studentID
                }
            })

            if (!student) {
                return {
                    isValid: false,
                    statusCode: 403,
                    errorMessage: "Estudante não encontrado."
                }
            }

            if (!stripeSubscriptionID) {
                return {
                    isValid: false,
                    statusCode: 403,
                    errorMessage: "Estudante não encontrado."
                }
            }

            const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionID)

            if (!subscription) {
                return {
                    isValid: false,
                    statusCode: 403,
                    errorMessage: "Inscrição não encontrada no stripe."
                }
            }

            await stripe.subscriptions.cancel(subscription.id)

            await prisma.students.update({
                where: {
                    id: studentID
                }, data: {
                    purcharsedSubscriptions: {
                        updateMany: {
                            where: {
                                stripeSubscriptionID: subscription.id
                            },
                            data: {
                                paymentStatus: "canceled"
                            }
                        }
                    }
                }
            })

            return {
                isValid: true,
                statusCode: 202,
                successMessage: 'Inscrição cancelada com sucesso.'
            }


        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                return { isValid: false, errorMessage: error, statusCode: 403 }

            }
            if (error instanceof Stripe.errors.StripeError) {
                // Retorna uma resposta de erro com o código de status do erro do Stripe.
                return {
                    statusCode: error.statusCode ?? 403,
                    isValid: false,
                    errorMessage: error.message,
                };
            }

            return { isValid: false, errorMessage: String(error), statusCode: 403 }

        }
    }

    async refundStudent(studentID: Students["id"], chargeID: string): Promise<validationResponse> {
        // Este comentário explica o que a função faz.
        // Esta função reembolsa uma cobrança.

        try {

            const student = await prisma.students.findFirst({
                where: { id: studentID }
            })


            if (!student) {
                return {
                    statusCode: 403,
                    isValid: false,
                    errorMessage: 'Inscrição não encontrada',
                };
            }

            // Cria um reembolso para a cobrança no Stripe.
            const refund = await stripe.refunds.create({
                charge: chargeID,
            });

            const charge = await stripe.charges.retrieve(chargeID)

            const { invoice, amount } = charge

            if (!invoice || typeof (invoice) != 'string') {
                return {
                    statusCode: 403,
                    isValid: false,
                    errorMessage: 'Cobrança não encontrada.',
                };
            }

            const studentInvoice = await stripe.invoices.retrieve(invoice)

            const invoiceProductID = studentInvoice.lines.data[0].price?.product

            if (!invoiceProductID || typeof (invoiceProductID) !== 'string') {
                return {
                    statusCode: 403,
                    isValid: false,
                    errorMessage: 'Inscrição não encontrada pelo sistema',
                };
            }

            const refundedStudent = await prisma.students.update({
                where: { id: studentID },
                data: {
                    purcharsedSubscriptions: {
                        updateMany: {
                            where: {
                                productID: invoiceProductID
                            },
                            data: {
                                paymentStatus: "refunded",
                                valuePaid: {
                                    decrement: amount
                                }
                            }
                        }
                    }
                }
            })



            // Retorna uma resposta de sucesso com o reembolso.
            return {
                isValid: true,
                successMessage: 'Reembolso realizado com sucesso!',
                students: refundedStudent,
                statusCode: 202
            };
        } catch (error) {
            // Trata os erros do Stripe.
            if (error instanceof Stripe.errors.StripeError) {
                // Retorna uma resposta de erro com o código de status do erro do Stripe.
                return {
                    statusCode: error.statusCode ?? 403,
                    isValid: false,
                    errorMessage: error.message,
                };
            }

            // Trata os erros do Prisma.
            if (error instanceof Prisma.PrismaClientValidationError) {
                // Obtém o erro do MongoDB da mensagem de erro do Prisma.
                const mongoDBError = error.message.slice(error.message.search('Argument'));

                // Retorna uma resposta de erro com o erro do MongoDB.
                return {
                    isValid: false,
                    errorMessage: mongoDBError,
                    statusCode: 403,
                };
            }

            // Trata os erros gerais.
            return {
                statusCode: 402,
                isValid: false,
                errorMessage: String(error),
            };
        }
    }

    async listChargesStudent(studentID: Students["id"]): Promise<validationResponse> {
        // Este comentário explica o que a função faz.
        // Esta função lista as cobranças de uma doação.

        try {
            // Busca a doação no banco de dados.
            const student = await prisma.students.findFirst({
                where: { id: studentID },
            });

            // Verifica se a doação existe.
            if (!student) {
                // Retorna uma resposta de erro se a doação não existir.
                return {
                    isValid: false,
                    errorMessage: 'Estudante não encontrado.',
                    statusCode: 403,
                };
            }

            // Obtém o ID do cliente do Stripe da doação.
            const stripeCustomerID = student.stripeCustomerID;

            // Busca as cobranças do cliente do Stripe no Stripe.
            const charges = await stripe.charges.search({
                query: `customer:"${stripeCustomerID}"`,
            });

            // Retorna uma resposta de sucesso com as cobranças.
            return {
                isValid: true,
                successMessage: `As cobranças do ${student.name} foram listadas com sucesso!`,
                charges,
                statusCode: 202,
            };
        } catch (error: any) {
            // Trata os erros do Stripe.
            if (error instanceof Stripe.errors.StripeError) {
                // Retorna uma resposta de erro com o código de status do erro do Stripe.
                return {
                    statusCode: error.statusCode ?? 403,
                    isValid: false,
                    errorMessage: error.message,
                };
            }

            // Trata os erros do Prisma.
            if (error instanceof Prisma.PrismaClientValidationError) {
                // Obtém o erro do MongoDB da mensagem de erro do Prisma.
                const mongoDBError = error.message.slice(error.message.search('Argument'));

                // Retorna uma resposta de erro com o erro do MongoDB.
                return {
                    isValid: false,
                    errorMessage: mongoDBError,
                    statusCode: 403,
                };
            }

            // Trata os erros gerais.
            return {
                statusCode: 402,
                isValid: false,
                errorMessage: String(error),
            };
        }
    }

    async syncStudents(): Promise<validationResponse> {

        try {

            const students = await prisma.students.findMany()

            students.forEach(async (student) => {

                const { purcharsedSubscriptions } = student


                if (!purcharsedSubscriptions) {
                    return student
                }

                purcharsedSubscriptions.forEach(async (subscription) => {

                    const { stripeSubscriptionID } = subscription

                    if (stripeSubscriptionID) {


                        const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionID)

                        const { unit_amount } = stripeSubscription.items.data[0].price

                        await prisma.students.update({
                            where: { id: student.id },
                            data: {
                                purcharsedSubscriptions: {
                                    updateMany: {
                                        where: {
                                            stripeSubscriptionID: subscription.stripeSubscriptionID
                                        }, data: {
                                            paymentStatus: stripeSubscription.status ?? 'Not found',
                                            valuePaid: unit_amount ?? 0
                                        }
                                    }
                                }
                            }
                        })
                    }

                })

            })

            return {
                statusCode: 200,
                isValid: true,
                successMessage: "Inscrições sincronizadas com sucesso."
            }
        } catch (error: any) {
            // Trata os erros do Stripe.
            if (error instanceof Stripe.errors.StripeError) {
                // Retorna uma resposta de erro com o código de status do erro do Stripe.
                return {
                    statusCode: error.statusCode ?? 403,
                    isValid: false,
                    errorMessage: error.message,
                };
            }

            // Trata os erros do Prisma.
            if (error instanceof Prisma.PrismaClientValidationError) {
                // Obtém o erro do MongoDB da mensagem de erro do Prisma.
                const mongoDBError = error.message.slice(error.message.search('Argument'));

                // Retorna uma resposta de erro com o erro do MongoDB.
                return {
                    isValid: false,
                    errorMessage: mongoDBError,
                    statusCode: 403,
                };
            }

            // Trata os erros gerais.
            return {
                statusCode: 402,
                isValid: false,
                errorMessage: String(error),
            };
        }
    }

}

export { StudentsRepository }


