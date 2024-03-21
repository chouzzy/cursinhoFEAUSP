import { Prisma } from "@prisma/client";
import { prisma } from "../../../../prisma";
import { validationResponse } from "../../../../types";
import { Students, purcharsedSubscriptions } from "../../entities/Students";
import { CreateStudentRequestProps } from "../../useCases/Students/createStudents/CreateStudentsController";
import { UpdateStudentRequestProps } from "../../useCases/Students/updateStudents/UpdateStudentController";
import { IStudentsRepository } from "../IStudentsRepository";
import { StripeCustomer } from "../../../../hooks/StripeCustomer";
import { StripeFakeFront } from "../../../../hooks/StripeFakeFront";
import { ListStudentsQuery } from "../../useCases/Students/listStudents/ListStudentsController";
import { stripe } from "../../../../server";
import Stripe from "stripe";


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


            let allStudents = await prisma.students.findMany()

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
                totalDocuments: allStudents.length
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

    async createStudent(studentData: CreateStudentRequestProps): Promise<validationResponse> {

        try {

            // CHECANDO SE A TURMA EXISTE
            const dbSchoolClass = await prisma.schoolClass.findFirst({
                where: {
                    stripeProductID: studentData.productSelectedID
                }
            })

            if (!dbSchoolClass) {
                return {
                    isValid: false,
                    errorMessage: `A turma não foi encontrada no sistema.`,
                    statusCode: 404
                }
            }

            const { cpf, rg } = studentData

            const stripeCustomer = new StripeCustomer()
            let stripeSearchedCustomerID = await stripeCustomer.searchCustomer(cpf, null)

            // CLIENTE NOVO
            if (!stripeSearchedCustomerID) {
                const stripeCustomerCreatedID = await stripeCustomer.createCustomer(studentData)
                stripeSearchedCustomerID = stripeCustomerCreatedID
            }

            // CLIENTE JÁ EXISTE
            const selectedSchoolClassID = dbSchoolClass.id

            // INSCRIÇÃO JÁ FOI COMPRADA ANTERIORMENTE?
            const selectedSchoolClassAlreadyBought = await stripe.subscriptions.search({
                query: `metadata[\'cpf\']:\'${cpf}\' AND metadata[\'schoolClassID\']:\'${selectedSchoolClassID}\'`,
            });

            if (selectedSchoolClassAlreadyBought.data.length == 0) {

                console.log('selectedSchoolClassAlreadyBought.data.length')
                console.log(selectedSchoolClassAlreadyBought.data.length)
                const existingStudent = await prisma.students.findFirst({
                    where: { cpf: cpf }
                })

                if (existingStudent) {
                 
                    // Operador ta errado aqui
                    const hasDuplicatedSubscription = existingStudent.purcharsedSubscriptions.some(sub => sub.schoolClassID === selectedSchoolClassID);

                    // Se existir uma assinatura duplicada
                    if (hasDuplicatedSubscription) {
                        console.log('duplicated!!')
                        return {
                            isValid: false,
                            errorMessage: `A inscrição já foi comprada anteriormente.`,
                            statusCode: 403
                        }
                    }
                }
                console.log('after existingStudent')

            }


            // A INSCRIÇÃO JÁ FOI COMPRADA ANTERIORMENTE? SE SIM:

            console.log('=====================================================================================================================================================================================================================')
            if (selectedSchoolClassAlreadyBought.data.length > 0) {

                const invoice = await stripe.invoices.retrieve(String(selectedSchoolClassAlreadyBought.data[0].latest_invoice));
                console.log('invoice')
                console.log(invoice)
                const charge = await stripe.charges.retrieve(`${invoice.charge ?? ""}`);

                console.log('charge')
                console.log(charge)
                // JÁ FOI REEMBOLSADO? SE NÃO:
                if (!charge.refunded) {
                    return {
                        isValid: false,
                        errorMessage: `A inscrição já foi comprada anteriormente.`,
                        statusCode: 403
                    }
                }

                // JÁ FOI REEMBOLSADO? SE SIM COMPRA MAIS UMA

            }

            // FAZENDO A COMPRA DA INSCRIÇÃO
            const stripeFrontEnd = new StripeFakeFront()

            const stripeResponse = await stripeFrontEnd.createSubscription({
                stripeCustomerID: stripeSearchedCustomerID,
                cpf: cpf,
                rg: rg,
                schoolClassID: dbSchoolClass.id,
                cycles: 1,
                paymentMethodID: studentData.paymentMethodID,
                productSelectedID: studentData.productSelectedID
            })

            // INSCRIÇÃO FALHOU
            if (!stripeResponse.stripeSubscription) {
                return stripeResponse
            }

            // INSCRIÇÃO CRIADA COM SUCESSO
            const { status, start_date, id } = stripeResponse.stripeSubscription

            const { unit_amount } = stripeResponse.stripeSubscription.items.data[0].price

            const { title, stripeProductID } = dbSchoolClass


            let foundStudent = await prisma.students.findFirst({
                where: { cpf: cpf }
            })



            // ESTUDANTE NUNCA FOI CADASTRADO NO BANCO
            if (!foundStudent) {

                foundStudent = await prisma.students.create({
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
                        stripeCustomerID: stripeSearchedCustomerID,

                        purcharsedSubscriptions: studentData.purcharsedSubscriptions
                    }
                })

            }

            // SE A TURMA JÁ FOI COMPRADA ANTERIORMENTE E FALHOU/REEMBOLSO , SÓ ATUALIZA OS DADOS
            const isStudentRegistered = foundStudent.purcharsedSubscriptions.some(
                sub => sub.schoolClassID === dbSchoolClass.id
            );


            if (isStudentRegistered) {


                const updatedStudent = await prisma.students.update({
                    where: { cpf: cpf },
                    data: {
                        purcharsedSubscriptions: {
                            updateMany: {
                                where: {
                                    schoolClassID: dbSchoolClass.id
                                },
                                data: {
                                    productID: stripeProductID,
                                    stripeSubscriptionID: id,
                                    productName: title,
                                    paymentMethod: 'creditcard',
                                    paymentStatus: status,
                                    paymentDate: new Date(start_date * 1000),
                                    valuePaid: unit_amount ?? studentData.purcharsedSubscriptions[0].valuePaid,
                                }
                            }
                        }
                    }
                })

                return {
                    isValid: true,
                    successMessage: `Inscrição comprada e estudante atualizado com sucesso!`,
                    students: updatedStudent,
                    statusCode: 202
                }

            }

            // SE A INSCRIÇÃO PARA A TURMA NUNCA COMPRADA, FAZ UM PUSH
            const subscribedStudent = await prisma.students.update({
                where: { cpf: cpf },
                data: {
                    purcharsedSubscriptions: {
                        push: {
                            schoolClassID: dbSchoolClass.id,
                            productID: stripeProductID,
                            stripeSubscriptionID: id,
                            productName: title,
                            paymentMethod: 'creditcard',
                            paymentStatus: status,
                            paymentDate: new Date(start_date * 1000),
                            valuePaid: unit_amount ?? studentData.purcharsedSubscriptions[0].valuePaid,
                        }
                    }
                }
            })

            return {
                isValid: true,
                successMessage: `Inscrição comprada com sucesso!`,
                students: subscribedStudent,
                statusCode: 202
            }

        }

        catch (error: unknown) {
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

                const subscriptions = await stripe.subscriptions.search({
                    query: `metadata[\'cpf\']:\'${student.cpf}\'`,


                });

                subscriptions.data.forEach(async (subscription) => {

                    const invoice = await stripe.invoices.retrieve(String(subscription.latest_invoice));

                    const charge = await stripe.charges.retrieve(`${invoice.charge ?? ""}`);

                    let paymentStatus
                    if (charge.refunded) {
                        paymentStatus = 'refunded'
                    } else {
                        paymentStatus = 'active'
                    }

                    const { unit_amount } = subscription.items.data[0].price

                    await prisma.students.update({
                        where: { id: student.id },
                        data: {
                            purcharsedSubscriptions: {
                                updateMany: {
                                    where: {
                                        stripeSubscriptionID: subscription.id
                                    }, data: {
                                        paymentStatus: `${paymentStatus}`,
                                        valuePaid: unit_amount ?? 0
                                    }
                                }
                            }
                        }
                    })



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


