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
const stripe_1 = __importDefault(require("stripe"));
const client_1 = require("@prisma/client");
const prisma_1 = require("../../../../prisma");
const server_1 = require("../../../../server");
const ef_Hooks_1 = require("../../../../hooks/ef\u00EDHooks");
const donationHelpers_1 = require("../../../../utils/donationHelpers");
const studentHelpers_1 = require("../../../../utils/studentHelpers");
const StripeSubscriptionsManager_1 = require("../../../../hooks/StripeSubscriptionsManager");
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
                const filteredDonations = yield prisma_1.prisma.donations.findMany({
                    where: {
                        AND: [
                            { name: { contains: name } },
                            { email: email },
                            { cpf: cpf },
                            { cnpj: cnpj },
                            { paymentStatus: paymentStatus }
                        ],
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
                    take: pageRange,
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
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { product, price, unit_amount } = yield (0, donationHelpers_1.getStripeProduct)(donationData.productSelectedID);
                const createdDonation = yield (0, donationHelpers_1.createPrismaDonation)(donationData, unit_amount);
                const { cpf, rg, cnpj } = createdDonation;
                // Buscando o RG e CPF do customer no Stripe
                const stripeCustomerID = yield (0, studentHelpers_1.getStripeDonationCustomerID)(donationData);
                // Validando existencia do customer, se ele não existir, a gente cria
                const stripeSubscriptionsManager = new StripeSubscriptionsManager_1.StripeSubscriptionsManager();
                const stripeSubscription = yield stripeSubscriptionsManager.createDonationSubscription({
                    donationID: createdDonation.id,
                    stripeCustomerID,
                    cpf,
                    cnpj,
                    rg,
                    paymentMethod: donationData.paymentMethodID,
                    product,
                    unit_amount,
                    cycles: donationData.cycles
                });
                console.log('stripeResponse');
                console.log(stripeSubscription);
                const donationUpdated = yield (0, donationHelpers_1.updateDonationBought)(createdDonation, stripeSubscription, stripeCustomerID, unit_amount);
                return {
                    isValid: true,
                    statusCode: 202,
                    successMessage: "Doação criada com sucesso!",
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
    createPixDonation(pixDonationData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, cpf, valuePaid } = pixDonationData;
                const createdDonation = yield (0, donationHelpers_1.createDonationPix)(pixDonationData);
                const pixData = yield (0, ef_Hooks_1.criarCobrancaPix)({ cpf, name, valuePaid });
                const { txid, pixCopiaECola, location, status, valor, calendario } = pixData;
                const updatedDonation = yield (0, donationHelpers_1.updateDonationPix)(pixData, createdDonation);
                if (!updatedDonation) {
                    return {
                        isValid: false,
                        errorMessage: 'Donation não encontrada, erro no banco de dados',
                        statusCode: 404
                    };
                }
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
                const { stripeSubscriptionID } = donationExists;
                if (stripeSubscriptionID == null) {
                    return {
                        isValid: false,
                        statusCode: 403,
                        errorMessage: "Doação não encontrada no banco de dados."
                    };
                }
                const subscription = yield server_1.stripe.subscriptions.retrieve(stripeSubscriptionID);
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
                    if (stripeSubscriptionID == null) {
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
