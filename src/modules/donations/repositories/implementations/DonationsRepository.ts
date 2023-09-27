import { Prisma } from "@prisma/client";
import { prisma } from "../../../../prisma";
import { validationResponse } from "../../../../types";
import { Donations } from "../../entities/Donations";
import { CreateDonationProps } from "../../useCases/createDonation/CreateDonationController";
import { IDonationsRepository } from "../IDonationsRepository";
import { StripeCustomer } from "../../../../hooks/StripeCustomer";
import { StripeFakeFront } from "../../../../hooks/StripeFakeFront";
import { DeleteDonationProps } from "../../useCases/deleteDonation/DeleteDonationController";
import { ListDonationsQuery } from "../../useCases/listDonations/ListDonationsController";


class DonationsRepository implements IDonationsRepository {

    private donations: Donations[]
    constructor() {
        this.donations = [];
    }

    async filterDonation(
        {name,
        email,
        cpf,
        cnpj,
        paymentStatus,
        initValue,
        endValue,
        initDate,
        endDate}:ListDonationsQuery,
        page:number,
        pageRange:number
    ): Promise<validationResponse> {
        
        
        try {

            if (page == 0) {
                page = 1
            }

        const filteredDonations = await prisma.donations.groupBy({
            by:[
                'id',
                'name',
                'email',
                'phoneNumber',
                'isPhoneWhatsapp',
                'gender',
                'birth',
                'state',
                'city',
                'homeNumber',
                'complement',
                'district',
                'zipCode',
                'street',
                'cpf',
                'rg',
                'cnpj',
                'ufrg',
                

                'valuePaid',
                'paymentMethod',
                'paymentStatus',
                'paymentDate',

                'stripeCustomerID',
                'donationExpirationDate',

                'createdAt',
            ],
            where: {
                AND: [
                    {name: {contains: name}},
                    {email: email},
                    {cpf: cpf},
                    {cnpj: cnpj},
                    {paymentStatus: paymentStatus}
                ]
            },
            having: {
                valuePaid: {
                    gt: initValue,
                    lt: endValue
                },
                paymentDate: {
                    gte:new Date(initDate),
                    lte:new Date(endDate)
                }
            },
            orderBy: {
                name: 'asc'
            },
            skip: (page-1) * pageRange,
            take: pageRange
            
        })

        // console.log(filteredDonations)

        return {
            isValid: true,
            statusCode: 202,
            donationsList: filteredDonations,
            totalDocuments: filteredDonations.length
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


    async createDonation(donationData: CreateDonationProps): Promise<validationResponse> {

        try {

            //Criando a donation no banco de dados
            const createdDonation = await prisma.donations.create({
                data: {
                    name: donationData.name,
                    email: donationData.email,
                    phoneNumber: donationData.phoneNumber,
                    isPhoneWhatsapp: donationData.isPhoneWhatsapp,
                    gender: donationData.gender ?? 'Não informado',
                    birth: donationData.birth,
                    state: donationData.state,
                    city: donationData.city,
                    street: donationData.street,
                    
                    homeNumber: donationData.homeNumber,
                    complement: donationData.complement ?? 'Não informado',
                    district: donationData.district,
                    zipCode: donationData.zipCode,
                    cpf: donationData.cpf,
                    rg: donationData.rg?? 'Não informado',
                    cnpj: donationData.cnpj ?? 'Não informado',
                    ufrg: donationData.ufrg,
                    valuePaid: donationData.valuePaid,
                    paymentDate: new Date(),
                    paymentMethod: 'Sem informação ainda',
                    paymentStatus: 'Sem informação ainda',
                    stripeCustomerID: 'Sem informação ainda',
                    donationExpirationDate: null


                }
            })


            // Buscando o RG e CPF do customer no Stripe
            const stripeCustomer = new StripeCustomer()
            const { cpf, rg, cnpj } = createdDonation
            const stripeCustomerID = await stripeCustomer.searchCustomer(cpf, cnpj)

            // console.log('SEARCHED: stripeCustomerID')
            // console.log(stripeCustomerID)


            // Validando existencia do customer, se ele não existir, a gente cria
            if (!stripeCustomerID) {


                // Não existe nenhum customer com esse RG e CPF no stripe, por isso vamos criar
                const stripeCustomerCreatedID = await stripeCustomer.createCustomer(donationData)
                // console.log('CREATED: stripeCustomerCreatedID')
                // console.log(stripeCustomerCreatedID)

                // Atribuindo o stripeCustomerID a donation recém criada
                await prisma.donations.update({
                    where: { id: createdDonation.id },
                    data: {
                        stripeCustomerID: stripeCustomerCreatedID
                    }
                })

                ////TESTE SUBSCRIPTION
                const stripeFrontEnd = new StripeFakeFront()

                await stripeFrontEnd.createSubscription({
                    donationID: createdDonation.id,
                    stripeCustomerID: stripeCustomerCreatedID,
                    cpf,
                    cnpj,
                    rg
                })

            } else {

                //Atribuindo o stripeCustomerID a donation recém criada
                await prisma.donations.update({
                    where: { id: createdDonation.id },
                    data: {
                        stripeCustomerID: stripeCustomerID
                    }
                })


                ////TESTE SUBSCRIPTION
                const stripeFrontEnd = new StripeFakeFront()

                await stripeFrontEnd.createSubscription({
                    donationID: createdDonation.id,
                    stripeCustomerID: stripeCustomerID,
                    cpf,
                    cnpj,
                    rg
                })
            }

            return { isValid: true, successMessage: 'Doação criada com sucesso!', statusCode: 202 }

        }
        catch (error: unknown) {
            if (error instanceof Prisma.PrismaClientValidationError) {

                const argumentPosition = error.message.search('Argument')
                const mongoDBError = error.message.slice(argumentPosition)
                return { isValid: false, errorMessage: mongoDBError, statusCode: 403 }

            } else {
                return { isValid: false, errorMessage: String(error), statusCode: 403 }
            }
        }
    }
    
    async deleteDonation(donationID: Donations["id"], donationData: DeleteDonationProps): Promise<validationResponse> {

        try {

            //Criando a donation no banco de dados
            const donationExists = await prisma.donations.findFirst({
                where: { id: donationID }
            })

            if (!donationExists) {
                return {
                    isValid: false,
                    errorMessage: 'Doação não encontrada',
                    statusCode: 403
                }
            }

            if (donationData.paymentStatus === 'canceled') {
                
                const stripeCustomer = new StripeCustomer()
                
                const stripeResponse = await stripeCustomer.cancelDonationSubscription(donationExists.id)

                if (stripeResponse.isValid == true) {

                    await prisma.donations.update({
                        where: { id: donationExists.id },
                        data: {
                            paymentStatus: donationData.paymentStatus
                        }
                    })
                }

                return stripeResponse
            }

            return {
                isValid: false,
                errorMessage: "Doação não atualizada. Cheque se o Status de pagamento foi enviado corretamente. Ex: paymentStatus: 'canceled'",
                statusCode: 304
            }
            

        }
        catch (error: unknown) {
            if (error instanceof Prisma.PrismaClientValidationError) {

                const argumentPosition = error.message.search('Argument')
                const mongoDBError = error.message.slice(argumentPosition)
                return { isValid: false, errorMessage: mongoDBError, statusCode: 403 }

            } else {
                return { isValid: false, errorMessage: String(error), statusCode: 403 }
            }
        }
    }
}

export { DonationsRepository }











// Função list antiga
// {
    

//     if (actualPage == 0) {
//         actualPage = 1;
//     }

//     // Função do prisma para buscar todos as donations
//     if (email === 'notInformed' && date != 'notInformed') {

//         const donations = await prisma.donations.groupBy({
//             by: [
//                 "id",
//                 "name",
//                 "email",
//                 "phoneNumber",
//                 "gender",
//                 "birth",
//                 "country",
//                 "state",
//                 "city",
//                 "address",
//                 "cpf",
//                 "rg",
//                 "valuePaid",
//                 "paymentMethod",
//                 "paymentStatus",
//                 "paymentDate",
//                 "donationExpirationDate",
//                 "stripeCustomerID",
//                 "createdAt"
//             ],
//             having: {
//                 valuePaid: {
//                     gt: initValue,
//                     lt: endValue
//                 },
//                 paymentDate: date,

//             },

//             orderBy: {
//                 name: 'asc',
//             },
//             skip: (actualPage - 1) * 10,
//             take: 10
//         })

//         return {
//             isValid: true,
//             statusCode: 202,
//             donationsList: donations
//         }
//     }



//     else if (email != 'notInformed' && date === 'notInformed') {

//         const donations = await prisma.donations.groupBy({
//             by: [
//                 "id",
//                 "name",
//                 "email",
//                 "phoneNumber",
//                 "gender",
//                 "birth",
//                 "country",
//                 "state",
//                 "city",
//                 "address",
//                 "cpf",
//                 "rg",
//                 "valuePaid",
//                 "paymentMethod",
//                 "paymentStatus",
//                 "paymentDate",
//                 "donationExpirationDate",
//                 "stripeCustomerID",
//                 "createdAt"
//             ],
//             having: {
//                 valuePaid: {
//                     gt: initValue,
//                     lt: endValue
//                 },
//                 email: email
//             },
//             orderBy: {
//                 name: 'asc',
//             },
//             skip: (actualPage - 1) * 10,
//             take: 10
//         })

//         return {
//             isValid: true,
//             statusCode: 202,
//             donationsList: donations
//         }
//     }



//     else if (email != 'notInformed' && date != 'notInformed') {

//         const donations = await prisma.donations.groupBy({
//             by: [
//                 "id",
//                 "name",
//                 "email",
//                 "phoneNumber",
//                 "gender",
//                 "birth",
//                 "country",
//                 "state",
//                 "city",
//                 "address",
//                 "cpf",
//                 "rg",
//                 "valuePaid",
//                 "paymentMethod",
//                 "paymentStatus",
//                 "paymentDate",
//                 "donationExpirationDate",
//                 "stripeCustomerID",
//                 "createdAt"
//             ],
//             having: {
//                 valuePaid: {
//                     gt: initValue,
//                     lt: endValue
//                 },
//                 email: email,
//                 paymentDate: date
//             },
//             orderBy: {
//                 name: 'asc',
//             },
//             skip: (actualPage - 1) * 10,
//             take: 10
//         })

//         return {
//             isValid: true,
//             statusCode: 202,
//             donationsList: donations
//         }
//     }



//     else {
//         const donations = await prisma.donations.groupBy({
//             by: [
//                 "id",
//                 "name",
//                 "email",
//                 "phoneNumber",
//                 "gender",
//                 "birth",
//                 "country",
//                 "state",
//                 "city",
//                 "address",
//                 "cpf",
//                 "rg",
//                 "valuePaid",
//                 "paymentMethod",
//                 "paymentStatus",
//                 "paymentDate",
//                 "donationExpirationDate",
//                 "stripeCustomerID",
//                 "createdAt"
//             ],
//             having: {
//                 valuePaid: {
//                     gt: initValue,
//                     lt: endValue
//                 }
//             },
//             orderBy: {
//                 name: 'asc',
//             },
//             skip: (actualPage - 1) * 10,
//             take: 10
//         })

//         return {
//             isValid: true,
//             statusCode: 202,
//             donationsList: donations
//         }
//     }
// }