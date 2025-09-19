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
import { checkDuplicateSchoolClassIDs } from "../../../../utils/checkDuplicatedSchoolClassID";
import { CreatePixStudentRequestProps } from "../../useCases/Students/createPixStudents/CreatePixStudentsController";
import { criarCobrancaPix, getEfíAccessToken } from "../../../../hooks/efíHooks";
import { checkIfPixAlreadyConcluded, checkIfPixIsExpired, checkSchoolClassExists, createStudent, createStudentPix, getEfiCredentials, getSchoolClassPrice, getStripeStudentCustomerID, getStudent, getStudentAlreadyActive, getStudentByCPForRG, updateStudentPaymentInProgress, updateStudentPix } from "../../../../utils/studentHelpers";
import { StripeSubscriptionsManager } from "../../../../hooks/StripeSubscriptionsManager";


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

            const schoolClassFound = await getSchoolClassPrice(studentDataSchoolClassID)

            if (!schoolClassFound || schoolClassFound === 'NOT FOUND') {
                return {
                    isValid: false,
                    errorMessage: `Turma não encontrada`,
                    statusCode: 403
                }
            }

            if (schoolClassFound === 'INACTIVE') {
                return {
                    isValid: false,
                    errorMessage: `A turma se encontra inativa.`,
                    statusCode: 403
                }
            }

            if (schoolClassFound === 'CLOSED') {
                return {
                    isValid: false,
                    errorMessage: `A turma se encontra fechada.`,
                    statusCode: 403
                }
            }

            // CHECA SE O ESTUDANTE EXISTE NO BANCO DE DADOS
            const { name, cpf, rg, purcharsedSubscriptions } = studentData
            const { valuePaid } = purcharsedSubscriptions

            const searchedStudent = await getStudentByCPForRG(cpf, rg)



            // CHECA SE JA EXISTE O ESTUDANTE NO BANCO - ATUALIZA
            if (searchedStudent) {


                // RETORNA CASO A INSCRIÇÃO JÁ TENHA SIDO COMPRADA E O PAGAMENTO CONCLUIDO
                const studentAlreadySubscribed = await checkIfPixAlreadyConcluded(searchedStudent, studentData)

                if (studentAlreadySubscribed) {

                    return {
                        isValid: false,
                        errorMessage: `A inscrição já foi comprada anteriormente e está ativa.`,
                        statusCode: 403
                    }
                }

                // RETORNA CASO A INSCRIÇÃO JÁ TENHA SIDO COMPRADA E O PIX AINDA NÃO EXPIROU
                const isPixExpired = await checkIfPixIsExpired(searchedStudent, studentData)

                if (!isPixExpired) {
                    return {
                        isValid: false,
                        errorMessage: "O Pix gerado para essa inscrição ainda não expirou, e tem duração de 3 minutos.",
                        statusCode: 402
                    }
                }


                // AQUI OU O PIX EXPIROU OU NUNCA FOI COMPRADO!!!

                // PIX COB
                const pixData: pixCobDataProps = await criarCobrancaPix({ cpf, name, valuePaid })

                const updatedStudent = await updateStudentPix(pixData, searchedStudent, studentData)

                return {
                    isValid: true,
                    errorMessage: `Estudante atualizado com sucesso!`,
                    students: updatedStudent,
                    statusCode: 202
                }


            }

            // PIX COB
            const pixData: pixCobDataProps = await criarCobrancaPix({ cpf, name, valuePaid })


            const createdStudent = await createStudentPix(studentData, pixData)

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

    async createStudentPaymentIntent(studentData: CreateStudentRequestProps): Promise<validationResponse> {

        try {

            const { purcharsedSubscriptions, cpf, rg } = studentData
            const { schoolClassID, paymentMethod, currency } = purcharsedSubscriptions

            // CHECA SE A TURMA EXISTE
            const searchedSchoolClass = await checkSchoolClassExists(schoolClassID)

            if (!searchedSchoolClass) {
                return {
                    isValid: false,
                    errorMessage: `Turma não encontrada.`,
                    statusCode: 403
                }
            }


            // CHECA SE CLIENTE JÁ EXISTE NO STRIPE E CRIA
            const stripeCustomerID = await getStripeStudentCustomerID(studentData)

            // CHECA SE INSCRIÇÃO EXISTE NO BANCO DE DADOS
            const searchedStudent = await getStudent(cpf, rg)

            const stripeSubscriptions = new StripeSubscriptionsManager()
            const stripeResponse = await stripeSubscriptions.createStudentPaymentIntent({
                stripeCustomerID,
                cpf,
                rg,
                searchedSchoolClass,
                paymentMethod,
                currency
            })

            if (searchedStudent) {

                // FILTRA POSSÍVEL INSCRIÇÃO JÁ PAGA
                const studentAlreadyActive = await getStudentAlreadyActive(searchedStudent.id, schoolClassID)
                if (studentAlreadyActive) {

                    return {
                        isValid: false,
                        errorMessage: `A inscrição já foi comprada e está ativa!.`,
                        students: studentAlreadyActive,
                        statusCode: 403
                    }
                }

                const updatedStudent = await updateStudentPaymentInProgress(searchedStudent, schoolClassID)

                if (updatedStudent) {

                    return {
                        ...stripeResponse,
                        successMessage: 'Estudante atualizado e payment intent criado com sucesso!',
                        students: updatedStudent
                    }
                }

            }

            const createdStudent = await createStudent(studentData, stripeCustomerID, schoolClassID)

            return {
                ...stripeResponse,
                successMessage: 'Estudante e payment intents criados com sucesso!',
                students: createdStudent

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


