"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonationsRepository = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../../../../prisma");
const StripeCustomer_1 = require("../../../../hooks/StripeCustomer");
const StripeFakeFront_1 = require("../../../../hooks/StripeFakeFront");
const server_1 = require("../../../../server");
const stripe_1 = __importDefault(require("stripe"));
class DonationsRepository {
    constructor() {
        this.donations = [];
    }
    filterDonation({ name, email, cpf, cnpj, paymentStatus, initValue, endValue, initDate, endDate }, page, pageRange) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (page == 0) {
                    page = 1;
                }
                const filteredDonations = yield prisma_1.prisma.donations.groupBy({
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
                });
                return {
                    isValid: true,
                    statusCode: 202,
                    donationsList: filteredDonations,
                    totalDocuments: filteredDonations.length
                };
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientValidationError) {
                    const argumentPosition = error.message.search('Argument');
                    const mongoDBError = error.message.slice(argumentPosition);
                    return { isValid: false, errorMessage: mongoDBError, statusCode: 403 };
                }
                else {
                    return { isValid: false, errorMessage: String(error), statusCode: 403 };
                }
            }
        });
    }
    createDonation(donationData) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //Criando a donation no banco de dados
                const createdDonation = yield prisma_1.prisma.donations.create({
                    data: {
                        name: donationData.name,
                        email: donationData.email,
                        phoneNumber: donationData.phoneNumber,
                        isPhoneWhatsapp: donationData.isPhoneWhatsapp,
                        gender: (_a = donationData.gender) !== null && _a !== void 0 ? _a : 'Não informado',
                        birth: donationData.birth,
                        state: donationData.state,
                        city: donationData.city,
                        street: donationData.street,
                        homeNumber: donationData.homeNumber,
                        complement: (_b = donationData.complement) !== null && _b !== void 0 ? _b : 'Não informado',
                        district: donationData.district,
                        zipCode: donationData.zipCode,
                        cpf: donationData.cpf,
                        rg: (_c = donationData.rg) !== null && _c !== void 0 ? _c : 'Não informado',
                        cnpj: (_d = donationData.cnpj) !== null && _d !== void 0 ? _d : 'Não informado',
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
                });
                // Buscando o RG e CPF do customer no Stripe
                const stripeCustomer = new StripeCustomer_1.StripeCustomer();
                const { cpf, rg, cnpj } = createdDonation;
                //Pesquisa o customer no stripe, priorizando CNPJ. O Front-end deveá enviar apenas CPF ou CNPJ, nunca os dois. Caso envie, o CNPJ será priorizado na busca.
                const stripeCustomerID = yield stripeCustomer.searchCustomer(cpf, cnpj);
                // Validando existencia do customer, se ele não existir, a gente cria
                if (!stripeCustomerID) {
                    // Não existe nenhum customer com esse RG e CPF no stripe, por isso vamos criar
                    const stripeCustomerCreatedID = yield stripeCustomer.createCustomer(donationData);
                    ////TESTE SUBSCRIPTION
                    const stripeFrontEnd = new StripeFakeFront_1.StripeFakeFront();
                    const stripeResponse = yield stripeFrontEnd.createSubscription({
                        donationID: createdDonation.id,
                        stripeCustomerID: stripeCustomerCreatedID,
                        cpf,
                        cnpj,
                        rg,
                        paymentMethodID: donationData.paymentMethodID,
                        productSelectedID: donationData.productSelectedID,
                        cycles: donationData.cycles
                    });
                    if (!stripeResponse.stripeSubscription) {
                        // Atribuindo o stripeCustomerID a donation recém criada e atualizando os status de pagamento
                        yield prisma_1.prisma.donations.update({
                            where: { id: createdDonation.id },
                            data: {
                                stripeCustomerID: stripeCustomerCreatedID,
                                paymentStatus: 'declined'
                            }
                        });
                        return stripeResponse;
                    }
                    const { current_period_end, status, start_date, id, billing_cycle_anchor } = stripeResponse.stripeSubscription;
                    let { cancel_at } = stripeResponse.stripeSubscription;
                    const { unit_amount, recurring } = stripeResponse.stripeSubscription.items.data[0].price;
                    if (!cancel_at) {
                        cancel_at = current_period_end;
                    }
                    // // Atribuindo o stripeCustomerID a donation recém criada e atualizando os status de pagamento
                    const cancelAtDate = new Date(cancel_at * 1000).getTime();
                    const startAtDate = new Date(start_date * 1000).getTime();
                    const totalPaymentsBought = Math.floor(((cancelAtDate - startAtDate) / (1000 * 60 * 60 * 24 * 30))) - 1;
                    yield prisma_1.prisma.donations.update({
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
                            valueBought: (unit_amount !== null && unit_amount !== void 0 ? unit_amount : 0) * (totalPaymentsBought),
                            valuePaid: unit_amount !== null && unit_amount !== void 0 ? unit_amount : 0
                        }
                    });
                    const { isValid, successMessage, statusCode } = stripeResponse;
                    return {
                        isValid,
                        successMessage,
                        statusCode
                    };
                }
                // Caso o cliente já tenha feito uma doação anteriormente
                const stripeFrontEnd = new StripeFakeFront_1.StripeFakeFront();
                const stripeResponse = yield stripeFrontEnd.createSubscription({
                    donationID: createdDonation.id,
                    stripeCustomerID: stripeCustomerID,
                    cpf,
                    cnpj,
                    rg,
                    paymentMethodID: donationData.paymentMethodID,
                    productSelectedID: donationData.productSelectedID,
                    cycles: donationData.cycles
                });
                if (!stripeResponse.stripeSubscription) {
                    // Atribuindo o stripeCustomerID a donation recém criada e atualizando os status de pagamento
                    yield prisma_1.prisma.donations.update({
                        where: { id: createdDonation.id },
                        data: {
                            stripeCustomerID: stripeCustomerID,
                            paymentStatus: 'declined'
                        }
                    });
                    return stripeResponse;
                }
                let { cancel_at } = stripeResponse.stripeSubscription;
                const { current_period_end, status, start_date, id, } = stripeResponse.stripeSubscription;
                const { unit_amount, recurring } = stripeResponse.stripeSubscription.items.data[0].price;
                if (!cancel_at) {
                    cancel_at = current_period_end;
                }
                const cancelAtDate = new Date(cancel_at * 1000).getTime();
                const startAtDate = new Date(start_date * 1000).getTime();
                const totalPaymentsBought = Math.floor((cancelAtDate - startAtDate) / (1000 * 60 * 60 * 24 * 30)) - 1;
                // // Atribuindo o stripeCustomerID a donation recém criada e atualizando os status de pagamento
                yield prisma_1.prisma.donations.update({
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
                        valueBought: (unit_amount !== null && unit_amount !== void 0 ? unit_amount : 0) * totalPaymentsBought,
                        valuePaid: unit_amount !== null && unit_amount !== void 0 ? unit_amount : 0
                    }
                });
                const { isValid, successMessage, statusCode } = stripeResponse;
                return {
                    isValid,
                    successMessage,
                    statusCode
                };
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientValidationError) {
                    const argumentPosition = error.message.search('Argument');
                    const mongoDBError = error.message.slice(argumentPosition);
                    return { isValid: false, errorMessage: mongoDBError, statusCode: 403 };
                }
                else {
                    return { isValid: false, errorMessage: String(error), statusCode: 403 };
                }
            }
        });
    }
    deleteDonation(donationID) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //Criando a donation no banco de dados
                const donationExists = yield prisma_1.prisma.donations.findFirst({
                    where: { id: donationID }
                });
                if (!donationExists) {
                    return {
                        isValid: false,
                        errorMessage: 'Doação não encontrada',
                        statusCode: 403
                    };
                }
                const subscription = yield server_1.stripe.subscriptions.retrieve(donationExists.stripeSubscriptionID);
                if (!subscription) {
                    return {
                        isValid: false,
                        statusCode: 403,
                        errorMessage: "Doação não encontrada no stripe."
                    };
                }
                const subscriptionCanceled = yield server_1.stripe.subscriptions.cancel(subscription.id);
                const { status } = subscriptionCanceled;
                yield prisma_1.prisma.donations.update({
                    where: { id: donationExists.id },
                    data: {
                        paymentStatus: status,
                        canceledAt: new Date()
                    }
                });
                return {
                    isValid: true,
                    successMessage: `Doação de ${donationExists.name} cancelada com sucesso.`,
                    statusCode: 402
                };
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientValidationError) {
                    const argumentPosition = error.message.search('Argument');
                    const mongoDBError = error.message.slice(argumentPosition);
                    return { isValid: false, errorMessage: mongoDBError, statusCode: 403 };
                }
                if (error instanceof stripe_1.default.errors.StripeError) {
                    // Retorna uma resposta de erro com o código de status do erro do Stripe.
                    return {
                        statusCode: (_a = error.statusCode) !== null && _a !== void 0 ? _a : 403,
                        isValid: false,
                        errorMessage: error.message,
                    };
                }
                return { isValid: false, errorMessage: String(error), statusCode: 403 };
            }
        });
    }
    refundDonation(donationID, chargeID) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // Este comentário explica o que a função faz.
            // Esta função reembolsa uma cobrança.
            try {
                // Cria um reembolso para a cobrança no Stripe.
                const refund = yield server_1.stripe.refunds.create({
                    charge: chargeID,
                });
                const charge = yield server_1.stripe.charges.retrieve(chargeID);
                const { customer } = charge;
                if (!customer) {
                    return {
                        statusCode: 403,
                        isValid: false,
                        errorMessage: 'Cobrança não encontrada',
                    };
                }
                const donation = yield prisma_1.prisma.donations.findFirst({
                    where: { id: donationID }
                });
                if (!donation) {
                    return {
                        statusCode: 403,
                        isValid: false,
                        errorMessage: 'Doação não encontrada'
                    };
                }
                yield prisma_1.prisma.donations.update({
                    where: { id: donationID },
                    data: {
                        paymentStatus: 'refunded',
                        valuePaid: {
                            decrement: charge.amount
                        }
                    }
                });
                // Retorna uma resposta de sucesso com o reembolso.
                return {
                    isValid: true,
                    successMessage: 'Reembolso realizado com sucesso!',
                    statusCode: 202
                };
            }
            catch (error) {
                // Trata os erros do Stripe.
                if (error instanceof stripe_1.default.errors.StripeError) {
                    // Retorna uma resposta de erro com o código de status do erro do Stripe.
                    return {
                        statusCode: (_a = error.statusCode) !== null && _a !== void 0 ? _a : 403,
                        isValid: false,
                        errorMessage: error.message,
                    };
                }
                // Trata os erros do Prisma.
                if (error instanceof client_1.Prisma.PrismaClientValidationError) {
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
        });
    }
    listChargesDonation(donationID) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // Este comentário explica o que a função faz.
            // Esta função lista as cobranças de uma doação.
            try {
                // Busca a doação no banco de dados.
                const donation = yield prisma_1.prisma.donations.findFirst({
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
                const charges = yield server_1.stripe.charges.search({
                    query: `customer:"${stripeCustomerID}"`,
                });
                // Retorna uma resposta de sucesso com as cobranças.
                return {
                    isValid: true,
                    successMessage: `As cobranças do ${donation.name} foram listadas com sucesso!`,
                    charges,
                    statusCode: 202,
                };
            }
            catch (error) {
                // Trata os erros do Stripe.
                if (error instanceof stripe_1.default.errors.StripeError) {
                    // Retorna uma resposta de erro com o código de status do erro do Stripe.
                    return {
                        statusCode: (_a = error.statusCode) !== null && _a !== void 0 ? _a : 403,
                        isValid: false,
                        errorMessage: error.message,
                    };
                }
                // Trata os erros do Prisma.
                if (error instanceof client_1.Prisma.PrismaClientValidationError) {
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
        });
    }
    syncDonations() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const donations = yield prisma_1.prisma.donations.findMany();
                const syncronizedDonations = donations.map((donation) => __awaiter(this, void 0, void 0, function* () {
                    const { stripeSubscriptionID } = donation;
                    if (stripeSubscriptionID === 'Sem informação ainda') {
                        return donation;
                    }
                    const stripeSubscription = yield server_1.stripe.subscriptions.retrieve(stripeSubscriptionID);
                    const { current_period_start, cancel_at, start_date } = stripeSubscription;
                    const { unit_amount } = stripeSubscription.items.data[0].price;
                    const billingDate = new Date(current_period_start * 1000).getTime();
                    if (cancel_at && unit_amount) {
                        const cancelAtDate = new Date(cancel_at * 1000).getTime();
                        const startAtDate = new Date(start_date * 1000).getTime();
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
                        donation.paymentStatus = stripeSubscription.status;
                        donation.ciclePaid = (totalPaymentsBought - (totalPaymentsLeft) + 1);
                        donation.ciclesBought = (totalPaymentsBought);
                        donation.valueBought = ((totalPaymentsBought) * unit_amount);
                        donation.valuePaid = (totalPaymentsBought - (totalPaymentsLeft) + 1) * unit_amount;
                    }
                    else {
                        donation.paymentStatus = stripeSubscription.status;
                    }
                    return donation;
                }));
                syncronizedDonations.forEach((donation) => __awaiter(this, void 0, void 0, function* () {
                    yield prisma_1.prisma.donations.update({
                        where: { id: (yield donation).id },
                        data: {
                            paymentStatus: (yield donation).paymentStatus,
                            ciclePaid: (yield donation).ciclePaid,
                            ciclesBought: (yield donation).ciclesBought,
                            valueBought: (yield donation).valueBought,
                            valuePaid: (yield donation).valuePaid,
                        }
                    });
                }));
                return {
                    statusCode: 200,
                    isValid: true,
                    successMessage: "Doações sincronizadas com sucesso."
                };
            }
            catch (error) {
                // Trata os erros do Stripe.
                if (error instanceof stripe_1.default.errors.StripeError) {
                    // Retorna uma resposta de erro com o código de status do erro do Stripe.
                    return {
                        statusCode: (_a = error.statusCode) !== null && _a !== void 0 ? _a : 403,
                        isValid: false,
                        errorMessage: error.message,
                    };
                }
                // Trata os erros do Prisma.
                if (error instanceof client_1.Prisma.PrismaClientValidationError) {
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
        });
    }
}
exports.DonationsRepository = DonationsRepository;
