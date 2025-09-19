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
exports.handlePaymentIntentRequiresAction = exports.handlePaymentIntentCanceled = exports.handlePaymentIntentFailed = exports.handlePaymentIntentSucceeded = exports.handleCustomerSubscriptionUpdated = exports.handleInvoicePaymentFailed = exports.handleCustomerSubscriptionDeleted = void 0;
const prisma_1 = require("../prisma");
const server_1 = require("../server");
// **
//  * Lida com o evento de cancelamento de uma assinatura.
//  * Encontra a assinatura no banco de dados local e atualiza seu status.
//  */
function handleCustomerSubscriptionDeleted(stripeEvent) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (stripeEvent.type === 'customer.subscription.deleted') {
                const subscription = stripeEvent.data.object;
                const { id, items, status } = subscription;
                // Supondo que você salva o ID da assinatura do Stripe no seu banco de dados
                // e que seu modelo Prisma se chama 'Donate' ou algo parecido.
                // Ajuste 'stripeSubscriptionId' e 'Donate' para os nomes corretos do seu schema.
                const updatedDonate = yield prisma_1.prisma.donations.updateMany({
                    where: {
                        // Encontra o registro pela ID da assinatura do Stripe
                        stripeSubscriptionID: subscription.id,
                    },
                    data: {
                        // Atualiza o status para indicar que foi cancelada
                        paymentStatus: 'canceled',
                        // Opcional: Salvar a data em que foi cancelada
                        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : new Date(),
                    },
                });
                if (updatedDonate.count > 0) {
                    console.log(`Assinatura ${subscription.id} marcada como 'canceled' no banco de dados.`);
                }
                else {
                    console.warn(`Webhook 'customer.subscription.deleted': Nenhuma assinatura encontrada no DB com o ID ${subscription.id}`);
                }
            }
        }
        catch (error) {
            console.error('Erro ao atualizar a assinatura para "canceled" no banco de dados:', error);
            // Lançar o erro faz com que o Stripe tente reenviar o webhook, o que pode ser útil.
            throw error;
        }
    });
}
exports.handleCustomerSubscriptionDeleted = handleCustomerSubscriptionDeleted;
function handleInvoicePaymentFailed(stripeEvent) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (stripeEvent.type === 'invoice.payment_failed') {
                const { id } = stripeEvent.data.object;
                const invoice = yield server_1.stripe.invoices.retrieve(id);
                const { subscription } = invoice;
                if (!subscription || typeof (subscription) != 'string') {
                    console.error('Assinatura não encontrada na invoice:', id);
                    return;
                }
                const donation = yield prisma_1.prisma.donations.findFirst({
                    where: { stripeSubscriptionID: subscription },
                });
                if (!donation) {
                    console.error('Doação não encontrada para a assinatura:', subscription);
                    return;
                }
                yield server_1.stripe.subscriptions.cancel(subscription);
                yield prisma_1.prisma.donations.update({
                    where: { id: donation.id },
                    data: { paymentStatus: 'canceled' }
                });
                console.log(`Assinatura ${subscription} cancelada com sucesso!`);
                return;
            }
        }
        catch (error) {
            throw Error(`Erro ao processar o evento invoice.payment_failed: ${error}`);
        }
    });
}
exports.handleInvoicePaymentFailed = handleInvoicePaymentFailed;
function handleCustomerSubscriptionUpdated(stripeEvent) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (stripeEvent.type === 'customer.subscription.updated') {
                // O evento é do tipo "invoice.payment_succeeded"
                // Obtém o ID da fatura
                const subscription = stripeEvent.data.object;
                const { id, items, status } = subscription;
                // Obtém a doação associada à assinatura
                const donation = yield prisma_1.prisma.donations.findFirst({
                    where: { stripeSubscriptionID: id },
                });
                console.log('donation --------------------- retrieved');
                console.log(donation === null || donation === void 0 ? void 0 : donation.id);
                if (!donation) {
                    console.log('donation not found');
                    return;
                }
                // Atualiza o status da doação para "paid"
                console.log('Donation found');
                yield prisma_1.prisma.donations.update({
                    where: { id: donation.id },
                    data: {
                        paymentStatus: status,
                        ciclePaid: { increment: 1 },
                        valuePaid: { increment: (_a = items.data[0].plan.amount) !== null && _a !== void 0 ? _a : 0 }
                    }
                });
                console.log('donation incremented');
                return;
            }
        }
        catch (error) {
            throw Error(`Erro ao processar o evento customer.subscription.updated: ${error}`);
        }
    });
}
exports.handleCustomerSubscriptionUpdated = handleCustomerSubscriptionUpdated;
function handlePaymentIntentSucceeded(stripeEvent) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (stripeEvent.type === 'payment_intent.succeeded') {
                console.log('payment_intent.succeeded');
                const { customer, metadata, amount } = stripeEvent.data.object;
                if (customer && metadata) {
                    const foundStudent = yield prisma_1.prisma.students.findFirst({
                        where: {
                            AND: [
                                { stripeCustomerID: String(customer) },
                                { cpf: metadata.cpf }
                            ]
                        }
                    });
                    if (!foundStudent) {
                        return;
                    }
                    const studentUpdated = yield prisma_1.prisma.students.update({
                        where: {
                            id: foundStudent.id
                        },
                        data: {
                            purcharsedSubscriptions: {
                                updateMany: {
                                    where: {
                                        schoolClassID: metadata.schoolClassID
                                    },
                                    data: {
                                        paymentStatus: 'CONCLUIDA',
                                        valuePaid: amount
                                    }
                                }
                            }
                        }
                    });
                    console.log(`student updated: ${studentUpdated.id}`);
                    return;
                }
            }
        }
        catch (error) {
            throw Error(`Erro ao processar o evento payment_intent.succeeded: ${error}`);
        }
    });
}
exports.handlePaymentIntentSucceeded = handlePaymentIntentSucceeded;
function handlePaymentIntentFailed(stripeEvent) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (stripeEvent.type === 'payment_intent.payment_failed') {
                const { customer, metadata, amount } = stripeEvent.data.object;
                if (customer && metadata) {
                    const foundStudent = yield prisma_1.prisma.students.findFirst({
                        where: {
                            AND: [
                                { stripeCustomerID: String(customer) },
                                { cpf: metadata.cpf }
                            ]
                        }
                    });
                    if (!foundStudent) {
                        return;
                    }
                    const studentUpdated = yield prisma_1.prisma.students.update({
                        where: {
                            id: foundStudent.id
                        },
                        data: {
                            purcharsedSubscriptions: {
                                updateMany: {
                                    where: {
                                        schoolClassID: metadata.schoolClassID
                                    },
                                    data: {
                                        paymentStatus: 'FALHOU',
                                        valuePaid: 0
                                    }
                                }
                            }
                        }
                    });
                    console.log(`student updated: ${studentUpdated.id}`);
                    return;
                }
            }
        }
        catch (error) {
            throw Error(`Erro ao processar o evento payment_intent.payment_failed: ${error}`);
        }
    });
}
exports.handlePaymentIntentFailed = handlePaymentIntentFailed;
function handlePaymentIntentCanceled(stripeEvent) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (stripeEvent.type === 'payment_intent.canceled') {
                const { customer, metadata, amount } = stripeEvent.data.object;
                if (customer && metadata) {
                    const foundStudent = yield prisma_1.prisma.students.findFirst({
                        where: {
                            AND: [
                                { stripeCustomerID: String(customer) },
                                { cpf: metadata.cpf }
                            ]
                        }
                    });
                    if (!foundStudent) {
                        return;
                    }
                    const studentUpdated = yield prisma_1.prisma.students.update({
                        where: {
                            id: foundStudent.id
                        },
                        data: {
                            purcharsedSubscriptions: {
                                updateMany: {
                                    where: {
                                        schoolClassID: metadata.schoolClassID
                                    },
                                    data: {
                                        paymentStatus: 'CANCELADO',
                                        valuePaid: 0
                                    }
                                }
                            }
                        }
                    });
                    console.log(`student updated: ${studentUpdated.id}`);
                    return;
                }
            }
        }
        catch (error) {
            throw Error(`Erro ao processar o evento payment_intent.canceled: ${error}`);
        }
    });
}
exports.handlePaymentIntentCanceled = handlePaymentIntentCanceled;
function handlePaymentIntentRequiresAction(stripeEvent) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (stripeEvent.type === 'payment_intent.requires_action') {
                const { customer, metadata, amount } = stripeEvent.data.object;
                if (customer && metadata) {
                    const foundStudent = yield prisma_1.prisma.students.findFirst({
                        where: {
                            AND: [
                                { stripeCustomerID: String(customer) },
                                { cpf: metadata.cpf }
                            ]
                        }
                    });
                    if (!foundStudent) {
                        return;
                    }
                    const studentUpdated = yield prisma_1.prisma.students.update({
                        where: {
                            id: foundStudent.id
                        },
                        data: {
                            purcharsedSubscriptions: {
                                updateMany: {
                                    where: {
                                        schoolClassID: metadata.schoolClassID
                                    },
                                    data: {
                                        paymentStatus: 'REQUIRES_ACTION',
                                    }
                                }
                            }
                        }
                    });
                    console.log(`student updated: ${studentUpdated.id}`);
                    return;
                }
            }
        }
        catch (error) {
            throw Error(`Erro ao processar o evento payment_intent.requires_action: ${error}`);
        }
    });
}
exports.handlePaymentIntentRequiresAction = handlePaymentIntentRequiresAction;
