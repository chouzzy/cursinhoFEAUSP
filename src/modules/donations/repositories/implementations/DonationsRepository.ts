import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../../prisma";
import { pixCobDataProps, validationResponse } from "../../../../types";
import { Donations } from "../../entities/Donations";
import { CreateDonationProps } from "../../useCases/createDonation/CreateDonationController";
import { IDonationsRepository } from "../IDonationsRepository";
import { StripeCustomer } from "../../../../hooks/StripeCustomer";
import { StripeFakeFront } from "../../../../hooks/StripeFakeFront";
import { ListDonationsQuery } from "../../useCases/listDonations/ListDonationsController";
import { agent, stripe } from "../../../../server";
import { CreatePixDonationProps } from "../../useCases/createPixDonation/CreatePixDonationController";
import { criarCobrancaPix, getEfíAccessToken } from "../../../../hooks/efíHooks";


class DonationsRepository implements IDonationsRepository {

    private donations: Donations[]
    constructor() {
        this.donations = [];
    }

    async filterDonation(
        { name,
            email,
            cpf,
            cnpj,
            paymentStatus,
            initValue,
            endValue,
            initDate,
            endDate }: ListDonationsQuery,
        page: number,
        pageRange: number
    ): Promise<validationResponse> {


        try {

            if (page == 0) {
                page = 1
            }

            const filteredDonations = await prisma.donations.groupBy({
                by: [
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
                    'ciclesBought',
                    'ciclePaid',
                    'valueBought',

                    'stripeCustomerID',
                    'donationExpirationDate',
                    
                    'txid',
                    'pixCopiaECola',
                    'pixQrCode',

                    'createdAt',
                ],
                where: {
                    AND: [
                        { name: { contains: name } },
                        { email: email },
                        { cpf: cpf },
                        { cnpj: cnpj },
                        { paymentStatus: paymentStatus }
                    ]
                },
                having: {
                    valuePaid: {
                        gte: initValue,
                        lte: endValue
                    },
                    paymentDate: {
                        gte: new Date(initDate),
                        lte: new Date(endDate)
                    }
                },
                orderBy: {
                    name: 'asc'
                },
                skip: (page - 1) * pageRange,
                take: pageRange

            })

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
                    rg: donationData.rg ?? 'Não informado',
                    cnpj: donationData.cnpj ?? 'Não informado',
                    ufrg: donationData.ufrg,
                    valuePaid: 0,
                    paymentDate: new Date(),
                    paymentMethod: 'Sem informação ainda',
                    paymentStatus: 'Sem informação ainda',
                    stripeCustomerID: 'Sem informação ainda',
                    stripeSubscriptionID: 'Sem informação ainda',
                    ciclePaid: 0,
                    ciclesBought: 0,
                    valueBought: donationData.valuePaid,

                    donationExpirationDate: null
                }
            })


            // Buscando o RG e CPF do customer no Stripe
            const stripeCustomer = new StripeCustomer()
            const { cpf, rg, cnpj } = createdDonation

            //Pesquisa o customer no stripe, priorizando CNPJ. O Front-end deveá enviar apenas CPF ou CNPJ, nunca os dois. Caso envie, o CNPJ será priorizado na busca.
            const stripeCustomerID = await stripeCustomer.searchCustomer(cpf, cnpj)


            // Validando existencia do customer, se ele não existir, a gente cria
            if (!stripeCustomerID) {

                // Não existe nenhum customer com esse RG e CPF no stripe, por isso vamos criar
                const stripeCustomerCreatedID = await stripeCustomer.createCustomer(donationData)

                ////TESTE SUBSCRIPTION
                const stripeFrontEnd = new StripeFakeFront()

                const stripeResponse = await stripeFrontEnd.createSubscription({
                    donationID: createdDonation.id,
                    stripeCustomerID: stripeCustomerCreatedID,
                    cpf,
                    cnpj,
                    rg,
                    paymentMethodID: donationData.paymentMethodID,
                    productSelectedID: donationData.productSelectedID,
                    cycles: donationData.cycles
                })


                if (!stripeResponse.stripeSubscription) {

                    // Atribuindo o stripeCustomerID a donation recém criada e atualizando os status de pagamento
                    await prisma.donations.update({
                        where: { id: createdDonation.id },
                        data: {
                            stripeCustomerID: stripeCustomerCreatedID,
                            paymentStatus: 'declined'

                        }
                    })

                    return stripeResponse
                }


                const { current_period_end, status, start_date, id, billing_cycle_anchor } = stripeResponse.stripeSubscription
                let { cancel_at } = stripeResponse.stripeSubscription
                const { unit_amount, recurring } = stripeResponse.stripeSubscription.items.data[0].price

                if (!cancel_at) {
                    cancel_at = current_period_end
                }

                // // Atribuindo o stripeCustomerID a donation recém criada e atualizando os status de pagamento

                const cancelAtDate = new Date(cancel_at * 1000).getTime()
                const startAtDate = new Date(start_date * 1000).getTime()
                const totalPaymentsBought = Math.floor(((cancelAtDate - startAtDate) / (1000 * 60 * 60 * 24 * 30))) - 1;



                await prisma.donations.update({
                    where: { id: createdDonation.id },
                    data: {
                        stripeCustomerID: stripeCustomerCreatedID,
                        stripeSubscriptionID: id,
                        paymentMethod: 'creditcard',
                        paymentStatus: status,
                        paymentDate: new Date(start_date * 1000),
                        donationExpirationDate: cancel_at ? new Date(cancel_at * 1000) : '',
                        ciclePaid: 1,
                        ciclesBought: (totalPaymentsBought),
                        valueBought: (unit_amount ?? 0) * (totalPaymentsBought),
                        valuePaid: unit_amount ?? 0

                    }
                })

                const { isValid, successMessage, statusCode } = stripeResponse
                return {
                    isValid,
                    successMessage,
                    statusCode
                }

            }

            // Caso o cliente já tenha feito uma doação anteriormente
            const stripeFrontEnd = new StripeFakeFront()

            const stripeResponse = await stripeFrontEnd.createSubscription({
                donationID: createdDonation.id,
                stripeCustomerID: stripeCustomerID,
                cpf,
                cnpj,
                rg,
                paymentMethodID: donationData.paymentMethodID,
                productSelectedID: donationData.productSelectedID,
                cycles: donationData.cycles
            })

            if (!stripeResponse.stripeSubscription) {

                // Atribuindo o stripeCustomerID a donation recém criada e atualizando os status de pagamento
                await prisma.donations.update({
                    where: { id: createdDonation.id },
                    data: {
                        stripeCustomerID: stripeCustomerID,
                        paymentStatus: 'declined'
                    }
                })

                return stripeResponse
            }


            let { cancel_at } = stripeResponse.stripeSubscription
            const { current_period_end, status, start_date, id, } = stripeResponse.stripeSubscription
            const { unit_amount, recurring } = stripeResponse.stripeSubscription.items.data[0].price

            if (!cancel_at) {
                cancel_at = current_period_end
            }
            const cancelAtDate = new Date(cancel_at * 1000).getTime()
            const startAtDate = new Date(start_date * 1000).getTime()
            const totalPaymentsBought = Math.floor((cancelAtDate - startAtDate) / (1000 * 60 * 60 * 24 * 30)) - 1;


            // // Atribuindo o stripeCustomerID a donation recém criada e atualizando os status de pagamento
            await prisma.donations.update({
                where: { id: createdDonation.id },
                data: {
                    stripeCustomerID: stripeCustomerID,
                    stripeSubscriptionID: id,
                    paymentMethod: 'creditcard',
                    paymentStatus: status,
                    paymentDate: new Date(start_date * 1000),
                    donationExpirationDate: cancel_at ? new Date(cancel_at * 1000) : null,
                    ciclePaid: 1,
                    ciclesBought: totalPaymentsBought,
                    valueBought: (unit_amount ?? 0) * totalPaymentsBought,
                    valuePaid: unit_amount ?? 0

                }
            })

            const { isValid, successMessage, statusCode } = stripeResponse

            return {
                isValid,
                successMessage,
                statusCode
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

    async createPixDonation(pixDonationData: CreatePixDonationProps): Promise<validationResponse> {


        try {

            const {
                name, email, phoneNumber, isPhoneWhatsapp, gender,
                birth, state, city, street, homeNumber, complement,
                district, zipCode, cpf, rg, cnpj, ufrg, valuePaid,
            } = pixDonationData

            const createdDonation = await prisma.donations.create({
                data: {
                    name: name,
                    email: email,

                    phoneNumber: phoneNumber,
                    isPhoneWhatsapp: isPhoneWhatsapp,
                    gender: gender ?? 'Não informado',

                    birth: birth,
                    state: state,
                    city: city,
                    street: street,
                    homeNumber: homeNumber,
                    complement: complement ?? 'Não informado',
                    district: district,
                    zipCode: zipCode,

                    cpf: cpf,
                    rg: rg ?? 'Não informado',
                    cnpj: cnpj ?? 'Não informado',
                    ufrg: ufrg,

                    valuePaid: 0,
                    paymentMethod: 'Pix',
                    paymentStatus: 'Sem informação ainda',
                    paymentDate: new Date(),
                    stripeCustomerID: 'Sem informação ainda',
                    stripeSubscriptionID: 'Pagamento via Efí',
                    ciclePaid: 1,
                    ciclesBought: 1,
                    valueBought: pixDonationData.valuePaid,

                    txid: null,
                    pixCopiaECola: null,
                    pixQrCode: null,
                    pixStatus: null,
                    pixValor: null,
                    pixDate: null,
                    pixExpiracaoEmSegundos: null,

                    donationExpirationDate: null
                }
            })


            const credentials = Buffer.from(
                `${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`
            ).toString('base64');


            const efiAccessToken = await getEfíAccessToken(agent, credentials)

            const pixData: pixCobDataProps = await criarCobrancaPix(agent, efiAccessToken, JSON.stringify({

                calendario: {
                    expiracao: 60 * 3
                },
                devedor: {
                    cpf: `${cpf}`,
                    nome: `${name}`
                },
                valor: {
                    original: `0.03`
                },
                chave: `${process.env.EFI_CHAVE_PIX}`,
                solicitacaoPagador: `Muito obrigado pela sua contribuição, ${name}! :)`

            }))

            const { txid, pixCopiaECola, location, status, valor, calendario } = pixData

            await prisma.donations.update({
                where: {
                    id: createdDonation.id
                },
                data: {
                    txid: txid,
                    pixCopiaECola: pixCopiaECola,
                    pixQrCode: location,
                    pixStatus: status,
                    pixValor: valor.original,
                    pixDate: calendario.criacao,
                    pixExpiracaoEmSegundos: calendario.expiracao
                }
            })

            return {
                isValid: true,
                statusCode: 202,
                successMessage: 'Post Recebido',
                txid: txid,
                pixCopiaECola: pixCopiaECola,
                pixQrCode: location,
                pixStatus: status,
                pixValor: valor,
                pixDate: calendario.criacao,
                pixExpiracaoEmSegundos: calendario.expiracao

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

    async deleteDonation(donationID: Donations["id"]): Promise<validationResponse> {

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

            const { stripeSubscriptionID } = donationExists

            if (stripeSubscriptionID == null) {
                return {
                    isValid: false,
                    statusCode: 403,
                    errorMessage: "Doação não encontrada no banco de dados."
                }
            }

            const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionID)

            if (!subscription) {
                return {
                    isValid: false,
                    statusCode: 403,
                    errorMessage: "Doação não encontrada no stripe."
                }
            }

            const subscriptionCanceled = await stripe.subscriptions.cancel(subscription.id)

            const { status } = subscriptionCanceled
            await prisma.donations.update({
                where: { id: donationExists.id },
                data: {
                    paymentStatus: status,
                    canceledAt: new Date()
                }
            })

            return {
                isValid: true,
                successMessage: `Doação de ${donationExists.name} cancelada com sucesso.`,
                statusCode: 402
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

    async refundDonation(donationID: Donations["id"], chargeID: string): Promise<validationResponse> {
        // Este comentário explica o que a função faz.
        // Esta função reembolsa uma cobrança.

        try {
            // Cria um reembolso para a cobrança no Stripe.
            const refund = await stripe.refunds.create({
                charge: chargeID,
            });

            const charge = await stripe.charges.retrieve(chargeID)
            const { customer } = charge

            if (!customer) {
                return {
                    statusCode: 403,
                    isValid: false,
                    errorMessage: 'Cobrança não encontrada',
                };
            }

            const donation = await prisma.donations.findFirst({
                where: { id: donationID }
            })

            if (!donation) {
                return {
                    statusCode: 403,
                    isValid: false,
                    errorMessage: 'Doação não encontrada'
                }
            }

            await prisma.donations.update({
                where: { id: donationID },
                data: {
                    paymentStatus: 'refunded',
                    valuePaid: {
                        decrement: charge.amount
                    }
                }
            })

            // Retorna uma resposta de sucesso com o reembolso.
            return {
                isValid: true,
                successMessage: 'Reembolso realizado com sucesso!',
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

    async listChargesDonation(donationID: string): Promise<validationResponse> {
        // Este comentário explica o que a função faz.
        // Esta função lista as cobranças de uma doação.

        try {
            // Busca a doação no banco de dados.
            const donation = await prisma.donations.findFirst({
                where: { id: donationID },
            });

            // Verifica se a doação existe.
            if (!donation) {
                // Retorna uma resposta de erro se a doação não existir.
                return {
                    isValid: false,
                    errorMessage: 'Doação não encontrada.',
                    statusCode: 403,
                };
            }

            // Obtém o ID do cliente do Stripe da doação.
            const stripeCustomerID = donation.stripeCustomerID;

            // Busca as cobranças do cliente do Stripe no Stripe.
            const charges = await stripe.charges.search({
                query: `customer:"${stripeCustomerID}"`,
            });

            // Retorna uma resposta de sucesso com as cobranças.
            return {
                isValid: true,
                successMessage: `As cobranças do ${donation.name} foram listadas com sucesso!`,
                charges,
                statusCode: 202,
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

    async syncDonations(): Promise<validationResponse> {

        try {

            const donations = await prisma.donations.findMany()

            const syncronizedDonations = donations.map(async (donation) => {

                const { stripeSubscriptionID } = donation

                if (stripeSubscriptionID === 'Sem informação ainda') {
                    return donation
                }


                if (stripeSubscriptionID == null) {
                    return donation

                }


                const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionID)

                const { current_period_start, cancel_at, start_date } = stripeSubscription

                const { unit_amount } = stripeSubscription.items.data[0].price

                const billingDate = new Date(current_period_start * 1000).getTime()

                if (cancel_at && unit_amount) {

                    const cancelAtDate = new Date(cancel_at * 1000).getTime()
                    const startAtDate = new Date(start_date * 1000).getTime()



                    //tem um erro aqui cancel e start vazios provavlemnte
                    const totalPaymentsLeft = Math.floor((cancelAtDate - billingDate) / (1000 * 60 * 60 * 24 * 30)) - 1;
                    const totalPaymentsBought = Math.floor(((cancelAtDate - startAtDate) / (1000 * 60 * 60 * 24 * 30))) - 1;

                    if (stripeSubscriptionID == 'sub_1OAbVVHkzIzO4aMOEOqp813l') {

                        // console.log('billingDate')
                        // console.log(billingDate)
                        // console.log('cancelAtDate')
                        // console.log(cancelAtDate)
                        // console.log('startAtDate')
                        // console.log(startAtDate)

                        // console.log('totalPaymentsLeft, totalPaymentsBought')
                        // console.log(totalPaymentsLeft, totalPaymentsBought)
                        // console.log('current_period_start')
                        // console.log(current_period_start)
                    }

                    donation.paymentStatus = stripeSubscription.status
                    donation.ciclePaid = (totalPaymentsBought - (totalPaymentsLeft) + 1)
                    donation.ciclesBought = (totalPaymentsBought)
                    donation.valueBought = ((totalPaymentsBought) * unit_amount)
                    donation.valuePaid = (totalPaymentsBought - (totalPaymentsLeft) + 1) * unit_amount

                } else {
                    donation.paymentStatus = stripeSubscription.status
                }

                return donation

            })

            syncronizedDonations.forEach(async (donation) => {
                await prisma.donations.update({
                    where: { id: (await donation).id },
                    data: {
                        paymentStatus: (await donation).paymentStatus,
                        ciclePaid: (await donation).ciclePaid,
                        ciclesBought: (await donation).ciclesBought,
                        valueBought: (await donation).valueBought,
                        valuePaid: (await donation).valuePaid,
                    }
                })
            })

            return {
                statusCode: 200,
                isValid: true,
                successMessage: "Doações sincronizadas com sucesso."
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

export { DonationsRepository }