import { Request, Response } from "express"
import { ChargeRefundedProps, CustomerSubscriptionCreated, InvoiceRetrieveProps, StripeCheckoutCustomerProps, StripeCustomerData, validationResponse } from "../types"
import { stripe } from "../server";
import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";
import { CreateDonationProps } from "../modules/donations/useCases/createDonation/CreateDonationController";
import { Donations } from "../modules/donations/entities/Donations";

interface CreateCustomerRequestProps {
}

class StripeCustomer {

    // async updateStudent(
    //     customer: StripeCheckoutCustomerProps
    // ): Promise<validationResponse> {

    //     try {

    //
    //         const studentExists = await prisma.students.findFirst({
    //             where: {
    //                 OR: [
    //                     { email: customer.customerDetails.email },
    //                 ]
    //             }

    //         })

    //
    //

    //         if (!studentExists) {
    //             return {
    //                 isValid: false,
    //                 errorMessage: "🛑 Hook Error: the payment data doesn't matches to any student🛑",
    //                 statusCode: 403
    //             }
    //         }

    //         const schoolClassBought = await prisma.schoolClass.findFirst({
    //             where: {
    //                 stripeProductID: customer.metadata.productID
    //             }
    //         })
    //
    //

    //         if (!schoolClassBought) {
    //             return {
    //                 isValid: false,
    //                 errorMessage: "🛑 Product not found in database🛑",
    //                 statusCode: 403
    //             }
    //         }



    //
    //



    //

    //         return {
    //             isValid: true,
    //             statusCode: 202,
    //             successMessage: "Customer created on Stripe Server"
    //         }

    //     } catch (error: unknown) {

    //         if (error instanceof Prisma.PrismaClientValidationError) {
    //             const argumentPosition = error.message.search('Argument')
    //             const mongoDBError = error.message.slice(argumentPosition)
    //             return { isValid: false, errorMessage: mongoDBError, statusCode: 403 }
    //         }

    //         if (error instanceof Prisma.PrismaClientKnownRequestError) {
    //             return { isValid: false, errorMessage: error, statusCode: 403 }
    //         }

    //         else {
    //             return { isValid: false, errorMessage: String(error), statusCode: 403 }
    //         }
    //     }



    // }

    async refundStudent(
        invoiceFound: InvoiceRetrieveProps
    ): Promise<validationResponse> {

        try {

            //Encontrando o student a partir do stripe Customer ID no invoice (fatura)
            const studentExists = await prisma.students.findFirst({
                where: {
                    OR: [
                        { stripeCustomerID: invoiceFound.customer },
                    ]
                }

            })

            // Checando se o student existe no banco de dados
            if (!studentExists) {
                return {
                    isValid: false,
                    errorMessage: "🛑 Hook Error: the refund data doesn't matches to any student🛑",
                    statusCode: 403
                }
            }

            //Atualizando a inscrição reembolsada para Refunded
            studentExists.purcharsedSubscriptions.map((subscription) => {

                if (subscription.schoolClassID === invoiceFound.lines.data[0].metadata.schoolClassID) {
                    subscription.paymentStatus = 'refunded'

                }

            })

            //Atualizando o status de pagamento para "refunded" no banco de dados 
            await prisma.students.update({
                where: { id: studentExists.id },
                data: {
                    purcharsedSubscriptions: studentExists.purcharsedSubscriptions
                }
            })

            return { isValid: true, statusCode: 202, successMessage: "Customer created on Stripe Server" }

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

    async createStripeDonation(donationData: CreateDonationProps): Promise<validationResponse> {

        try {

            const donationExists = await prisma.donations.findFirst({
                where: {
                    OR: [
                        { email: donationData.email },
                        { cpf: donationData.cpf },
                    ]
                }

            })


            if (!donationExists) {
                return {
                    isValid: false,
                    errorMessage: "🛑 Hook Error: the payment data doesn't matches to any donation🛑",
                    statusCode: 403
                }
            }

            const stripeDonorCreated = await stripe.customers.create({
                address: {
                    city: donationData.city,
                    country: donationData.country,
                    line1: donationData.address,
                    state: donationData.city
                },
                name: donationData.name,
                email: donationData.email,
                phone: donationData.phoneNumber,
                metadata: {
                    customerType: 'Donation',
                    donationValue: donationData.valuePaid,
                    cpf: donationData.cpf
                }
            })

            return {
                isValid: false,
                stripeCreatedCustomerID: stripeDonorCreated.id,
                statusCode: 403
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

    async updatePurchasedSubscriptions({ subscriptionCreated }: { subscriptionCreated: CustomerSubscriptionCreated; }): Promise<validationResponse> {

        try {

            const stripeProductCreatedID = subscriptionCreated.items.data[0].price.product

            const isTheProductASchoolClass = await prisma.schoolClass.findFirst({
                where: {
                    stripeProductID: stripeProductCreatedID
                }
            })

            //Verifica se é Donation ou SchoolClass
            if (isTheProductASchoolClass) {



                const customer = await stripe.customers.update(
                    subscriptionCreated.customer,
                    {
                        metadata: {
                            paymentType: 'StudentSubscription',
                            schoolClassID: isTheProductASchoolClass.id,
                            productID: stripeProductCreatedID,
                            updatedAt: String(
                                (new Date()).toLocaleDateString('pt-BR')
                            ),
                        }
                    }
                )




                const student = await prisma.students.findFirst({
                    where: {
                        cpf: customer.metadata.cpf
                    }
                })




                if (!student) {
                    return {
                        isValid: false,
                        errorMessage: "🛑 Product already bought🛑",
                        statusCode: 403
                    }
                }

                const schoolClassBought = await prisma.schoolClass.findFirst({
                    where: {
                        stripeProductID: stripeProductCreatedID
                    }
                })

                if (!schoolClassBought) {
                    return {
                        isValid: false,
                        errorMessage: "🛑 Product already bought🛑",
                        statusCode: 403
                    }
                }

                student.purcharsedSubscriptions.map((subscription) => {

                    if (subscription.schoolClassID == isTheProductASchoolClass.id
                        &&
                        subscription.paymentStatus == 'Pagamento não confirmado') {


                        subscription.schoolClassID = schoolClassBought.id,
                            subscription.productID = schoolClassBought.stripeProductID,
                            subscription.productName = schoolClassBought.title,
                            subscription.paymentMethod = `card = ${subscriptionCreated.default_payment_method}`,
                            subscription.paymentStatus = subscriptionCreated.status,
                            subscription.paymentDate = String(
                                (new Date()).toLocaleDateString('pt-BR')
                            ) ?? '',
                            subscription.valuePaid = subscriptionCreated.items.data[0].price.unit_amount


                    }
                })




                await prisma.students.update({
                    where: {
                        id: student.id,
                    },
                    data: {
                        purcharsedSubscriptions: student.purcharsedSubscriptions
                    }
                })
            } else {

                // Atualizando os status de pagamento da donation

                const donationSubscribed = await prisma.donations.update({
                    where: {
                        id: subscriptionCreated.metadata.donationID
                    },
                    data: {
                        valuePaid: subscriptionCreated.items.data[0].price.unit_amount,
                        paymentMethod: `card: ${subscriptionCreated.default_payment_method}`,
                        paymentStatus: subscriptionCreated.status,
                        paymentDate: (new Date()).toLocaleDateString('pt-BR'),
                        donationExpirationDate: (new Date(subscriptionCreated.current_period_end * 1000)).toLocaleDateString('pt-BR'),
                    }
                })

            }



            return { isValid: true, statusCode: 202, successMessage: "Customer created on Stripe Server" }

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

    async cancelDonationSubscription(donationID: Donations["id"]): Promise<validationResponse> {

        try {

            const subscription = await stripe.subscriptions.search({
                query: `metadata[\'donationID\']:\'${donationID}\'`,
            })

            if (!subscription) {
                return {
                    isValid: false,
                    errorMessage: '🔴 Donation Subscription not found on stripe 🔴',
                    statusCode: 403
                }
            }

            const subscriptionID = subscription.data[0].id

            const deleted = await stripe.subscriptions.del(
                subscriptionID
            )

            if (!deleted) {
                return {
                    isValid: false,
                    errorMessage: `🔴 Stripe couldn't delete the subscription: ${subscriptionID} 🔴`,
                    statusCode: 403
                }
            }

            return {
                isValid: true,
                successMessage: `Subscription ${subscriptionID} deleted successfully`,
                statusCode: 202
            }

        } catch (stripeError: unknown) {
            return {
                isValid: false,
                errorMessage: String(stripeError),
                statusCode: 403
            }
        }




    }

    async searchCustomer(cpf: string, rg: string): Promise<string | undefined> {

        const customer = await stripe.customers.search({
            query: `metadata[\'cpf\']:\'${cpf}\' OR metadata[\'rg\']:\'${rg}\'`,
        });




        if (customer.data.length == 0) {
            return undefined
        }
        return customer.data[0].id
    }

    async createCustomer(customerData: StripeCustomerData): Promise<string> {

        const customer = await stripe.customers.create({
            description: `Customer criado por awer na data: ${(new Date()).toLocaleDateString('pt-BR')}`,
            address: {
                city: customerData.city,
                country: customerData.country,
                line1: customerData.address,
                state: customerData.state
            },
            email: customerData.email,
            name: customerData.name,
            phone: customerData.phoneNumber,
            metadata: {
                cpf: customerData.cpf,
                rg: customerData.rg,
            }
        });

        return customer.id
    }
}

export { StripeCustomer }