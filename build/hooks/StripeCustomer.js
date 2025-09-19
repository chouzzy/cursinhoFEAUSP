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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeCustomer = void 0;
const server_1 = require("../server");
const prisma_1 = require("../prisma");
const client_1 = require("@prisma/client");
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
    refundStudent(invoiceFound) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                //Encontrando o student a partir do stripe Customer ID no invoice (fatura)
                const studentExists = yield prisma_1.prisma.students.findFirst({
                    where: {
                        OR: [
                            { stripeCustomerID: invoiceFound.customer },
                        ]
                    }
                });
                // Checando se o student existe no banco de dados
                if (!studentExists) {
                    return {
                        isValid: false,
                        errorMessage: "Erro de Hook: os dados do reembolso não corresponde à nenhum estudante",
                        statusCode: 403
                    };
                }
                //Atualizando a inscrição reembolsada para Refunded
                studentExists.purcharsedSubscriptions.map((subscription) => {
                    if (subscription.schoolClassID === invoiceFound.lines.data[0].metadata.schoolClassID) {
                        subscription.paymentStatus = 'refunded';
                    }
                });
                //Atualizando o status de pagamento para "refunded" no banco de dados 
                yield prisma_1.prisma.students.update({
                    where: { id: studentExists.id },
                    data: {
                        purcharsedSubscriptions: studentExists.purcharsedSubscriptions
                    }
                });
                return { isValid: true, statusCode: 202, successMessage: "Cliente criado no servidor Stripe" };
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientValidationError) {
                    const argumentPosition = error.message.search('Argument');
                    const mongoDBError = error.message.slice(argumentPosition);
                    return { isValid: false, errorMessage: mongoDBError, statusCode: 403 };
                }
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    return { isValid: false, errorMessage: error, statusCode: 403 };
                }
                else {
                    return { isValid: false, errorMessage: String(error), statusCode: 403 };
                }
            }
        });
    }
    createStripeDonation(donationData) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const donationExists = yield prisma_1.prisma.donations.findFirst({
                    where: {
                        OR: [
                            { email: donationData.email },
                            { cpf: donationData.cpf },
                            { cnpj: donationData.cnpj },
                        ]
                    }
                });
                if (!donationExists) {
                    return {
                        isValid: false,
                        errorMessage: "Erro de hook: os dados do pagamento não correspondem com nenhuma doação",
                        statusCode: 403
                    };
                }
                const stripeDonorCreated = yield server_1.stripe.customers.create({
                    address: {
                        city: donationData.city,
                        line1: donationData.street,
                        state: donationData.city
                    },
                    name: donationData.name,
                    email: donationData.email,
                    phone: donationData.phoneNumber,
                    metadata: {
                        customerType: 'Donation',
                        cpf: (_a = donationData.cpf) !== null && _a !== void 0 ? _a : "NDA",
                        cnpj: (_b = donationData.cnpj) !== null && _b !== void 0 ? _b : "NDA"
                    }
                });
                return {
                    isValid: false,
                    stripeCreatedCustomerID: stripeDonorCreated.id,
                    statusCode: 403
                };
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientValidationError) {
                    const argumentPosition = error.message.search('Argument');
                    const mongoDBError = error.message.slice(argumentPosition);
                    return { isValid: false, errorMessage: mongoDBError, statusCode: 403 };
                }
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    return { isValid: false, errorMessage: error, statusCode: 403 };
                }
                else {
                    return { isValid: false, errorMessage: String(error), statusCode: 403 };
                }
            }
        });
    }
    updatePurchasedSubscriptions({ subscriptionCreated }) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stripeProductCreatedID = subscriptionCreated.items.data[0].price.product;
                const isTheProductASchoolClass = yield prisma_1.prisma.schoolClass.findFirst({
                    where: {
                        stripeProductID: stripeProductCreatedID
                    }
                });
                //Verifica se é Donation ou SchoolClass
                if (isTheProductASchoolClass) {
                    const customer = yield server_1.stripe.customers.update(subscriptionCreated.customer, {
                        metadata: {
                            paymentType: 'StudentSubscription',
                            schoolClassID: isTheProductASchoolClass.id,
                            productID: stripeProductCreatedID,
                            updatedAt: String((new Date()).toLocaleDateString('pt-BR')),
                        }
                    });
                    const student = yield prisma_1.prisma.students.findFirst({
                        where: {
                            cpf: customer.metadata.cpf
                        }
                    });
                    if (!student) {
                        return {
                            isValid: false,
                            errorMessage: "Produto já comprado.",
                            statusCode: 403
                        };
                    }
                    const schoolClassBought = yield prisma_1.prisma.schoolClass.findFirst({
                        where: {
                            stripeProductID: stripeProductCreatedID
                        }
                    });
                    if (!schoolClassBought) {
                        return {
                            isValid: false,
                            errorMessage: "Produto já comprado.",
                            statusCode: 403
                        };
                    }
                    student.purcharsedSubscriptions.map((subscription) => {
                        var _a;
                        if (subscription.schoolClassID == isTheProductASchoolClass.id
                            &&
                                subscription.paymentStatus == 'Pagamento não confirmado') {
                            subscription.schoolClassID = schoolClassBought.id,
                                subscription.productID = schoolClassBought.stripeProductID,
                                subscription.productName = schoolClassBought.title,
                                subscription.paymentMethod = `card = ${subscriptionCreated.default_payment_method}`,
                                subscription.paymentStatus = subscriptionCreated.status,
                                subscription.paymentDate = (_a = new Date()) !== null && _a !== void 0 ? _a : null,
                                subscription.valuePaid = subscriptionCreated.items.data[0].price.unit_amount;
                        }
                    });
                    yield prisma_1.prisma.students.update({
                        where: {
                            id: student.id,
                        },
                        data: {
                            purcharsedSubscriptions: student.purcharsedSubscriptions
                        }
                    });
                }
                else {
                    // Atualizando os status de pagamento da donation
                    const donationSubscribed = yield prisma_1.prisma.donations.update({
                        where: {
                            id: subscriptionCreated.metadata.donationID
                        },
                        data: {
                            valuePaid: subscriptionCreated.items.data[0].price.unit_amount,
                            paymentMethod: `card: ${subscriptionCreated.default_payment_method}`,
                            paymentStatus: subscriptionCreated.status,
                            paymentDate: (new Date()),
                            donationExpirationDate: (new Date(subscriptionCreated.current_period_end * 1000)),
                        }
                    });
                }
                return { isValid: true, statusCode: 202, successMessage: "Cliente criado no servidor Stripe." };
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientValidationError) {
                    const argumentPosition = error.message.search('Argument');
                    const mongoDBError = error.message.slice(argumentPosition);
                    return { isValid: false, errorMessage: mongoDBError, statusCode: 403 };
                }
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    return { isValid: false, errorMessage: error, statusCode: 403 };
                }
                else {
                    return { isValid: false, errorMessage: String(error), statusCode: 403 };
                }
            }
        });
    }
    cancelDonationSubscription(donationID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield server_1.stripe.subscriptions.search({
                    query: `metadata[\'donationID\']:\'${donationID}\'`,
                });
                if (!subscription) {
                    return {
                        isValid: false,
                        errorMessage: 'Inscrição de doação não encontrada no Stripe',
                        statusCode: 403
                    };
                }
                const subscriptionID = subscription.data[0].id;
                const deleted = yield server_1.stripe.subscriptions.del(subscriptionID);
                if (!deleted) {
                    return {
                        isValid: false,
                        errorMessage: ` Stripe não conseguiu excluir a inscrição: ${subscriptionID} `,
                        statusCode: 403
                    };
                }
                return {
                    isValid: true,
                    successMessage: `Inscrição ${subscriptionID} deletada com sucesso.`,
                    statusCode: 202
                };
            }
            catch (stripeError) {
                return {
                    isValid: false,
                    errorMessage: String(stripeError),
                    statusCode: 403
                };
            }
        });
    }
    searchCustomer(cpf, cnpj) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (cnpj && cnpj != "NDA") {
                    const customer = yield server_1.stripe.customers.search({
                        query: `metadata[\'cnpj\']:\'${cnpj}\'`,
                    });
                    if (customer.data.length == 0 || customer == null) {
                        return undefined;
                    }
                    return customer.data[0].id;
                }
                if (cpf && cpf != "NDA") {
                    const customer = yield server_1.stripe.customers.search({
                        query: `metadata[\'cpf\']:\'${cpf}\'`,
                    });
                    if (!customer.data || customer.data.length === 0) {
                        return undefined;
                    }
                    return customer.data[0].id;
                }
            }
            catch (error) {
                throw error;
            }
        });
    }
    createCustomerStudent(customerData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { cpf, rg } = customerData;
                const customer = yield server_1.stripe.customers.create({
                    description: `Customer criado por awer na data: ${(new Date()).toLocaleDateString('pt-BR')}`,
                    address: {
                        city: customerData.city,
                        line1: customerData.street,
                        state: customerData.state
                    },
                    email: customerData.email,
                    name: customerData.name,
                    phone: customerData.phoneNumber,
                    metadata: {
                        cpf: cpf,
                        rg: rg !== null && rg !== void 0 ? rg : 'NDA',
                        cnpj: 'NDA'
                    }
                });
                return customer.id;
            }
            catch (error) {
                throw error;
            }
        });
    }
    createCustomerDonations(customerData) {
        return __awaiter(this, void 0, void 0, function* () {
            let { cpf, rg, cnpj } = customerData;
            const customer = yield server_1.stripe.customers.create({
                description: `Customer criado por awer na data: ${(new Date()).toLocaleDateString('pt-BR')}`,
                address: {
                    city: customerData.city,
                    line1: customerData.street,
                    state: customerData.state
                },
                email: customerData.email,
                name: customerData.name,
                phone: customerData.phoneNumber,
                metadata: {
                    cpf: cpf !== null && cpf !== void 0 ? cpf : 'NDA',
                    rg: rg !== null && rg !== void 0 ? rg : 'NDA',
                    cnpj: cnpj !== null && cnpj !== void 0 ? cnpj : 'NDA'
                }
            });
            return customer.id;
        });
    }
}
exports.StripeCustomer = StripeCustomer;
