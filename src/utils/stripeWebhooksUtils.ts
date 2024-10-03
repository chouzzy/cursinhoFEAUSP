import { prisma } from "../prisma";
import { stripe } from "../server";
import { DiscriminatedEvent } from "../types/stripeEventTypes";

async function handleInvoicePaymentFailed(stripeEvent: DiscriminatedEvent) {


    try {
        if (stripeEvent.type === 'invoice.payment_failed') {


            const { id } = stripeEvent.data.object;
            const invoice = await stripe.invoices.retrieve(id);
            const { subscription } = invoice;

            if (!subscription || typeof (subscription) != 'string') {
                console.error('Assinatura não encontrada na invoice:', id);
                return;
            }

            const donation = await prisma.donations.findFirst({
                where: { stripeSubscriptionID: subscription },
            });

            if (!donation) {
                console.error('Doação não encontrada para a assinatura:', subscription);
                return;
            }

            await stripe.subscriptions.cancel(subscription);
            await prisma.donations.update({
                where: { id: donation.id },
                data: { paymentStatus: 'canceled' }
            });

            console.log(`Assinatura ${subscription} cancelada com sucesso!`);

            return
        }

    } catch (error) {
        throw Error(`Erro ao processar o evento invoice.payment_failed: ${error}`);
    }
}
async function handleCustomerSubscriptionUpdated(stripeEvent: DiscriminatedEvent) {


    try {
        if (stripeEvent.type === 'customer.subscription.updated') {

            // O evento é do tipo "invoice.payment_succeeded"

            // Obtém o ID da fatura
            const subscription = stripeEvent.data.object;
            const { id, items, status } = subscription

            // Obtém a doação associada à assinatura
            const donation = await prisma.donations.findFirst({
                where: { stripeSubscriptionID: id },
            });

            console.log('donation --------------------- retrieved')
            console.log(donation?.id)

            if (!donation) {
                console.log('donation not found')
                return
            }

            // Atualiza o status da doação para "paid"
            console.log('Donation found')

            await prisma.donations.update({
                where: { id: donation.id },
                data: {
                    paymentStatus: status,
                    ciclePaid: { increment: 1 },
                    valuePaid: { increment: items.data[0].plan.amount ?? 0 }
                }
            })

            console.log('donation incremented')

            return
        }

    } catch (error) {
        throw Error(`Erro ao processar o evento customer.subscription.updated: ${error}`);
    }
}

async function handlePaymentIntentSucceeded(stripeEvent: DiscriminatedEvent) {


    try {
        if (stripeEvent.type === 'payment_intent.succeeded') {

            console.log('payment_intent.succeeded')


            const { customer, metadata, amount } = stripeEvent.data.object

            if (customer && metadata) {


                const foundStudent = await prisma.students.findFirst({
                    where: {
                        AND: [
                            { stripeCustomerID: String(customer) },
                            { cpf: metadata.cpf }
                        ]
                    }
                })

                if (!foundStudent) {
                    return
                }

                const studentUpdated = await prisma.students.update({
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
                })


                console.log(`student updated: ${studentUpdated.id}`)

                return
            }
        }

    } catch (error) {
        throw Error(`Erro ao processar o evento payment_intent.succeeded: ${error}`);
    }
}
async function handlePaymentIntentFailed(stripeEvent: DiscriminatedEvent) {


    try {
        if (stripeEvent.type === 'payment_intent.payment_failed') {

            const { customer, metadata, amount } = stripeEvent.data.object

            if (customer && metadata) {


                const foundStudent = await prisma.students.findFirst({
                    where: {
                        AND: [
                            { stripeCustomerID: String(customer) },
                            { cpf: metadata.cpf }
                        ]
                    }
                })

                if (!foundStudent) {
                    return
                }

                const studentUpdated = await prisma.students.update({
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
                })


                console.log(`student updated: ${studentUpdated.id}`)

                return
            }
        }

    } catch (error) {
        throw Error(`Erro ao processar o evento payment_intent.payment_failed: ${error}`);
    }
}
async function handlePaymentIntentCanceled(stripeEvent: DiscriminatedEvent) {


    try {
        if (stripeEvent.type === 'payment_intent.canceled') {

            const { customer, metadata, amount } = stripeEvent.data.object

            if (customer && metadata) {


                const foundStudent = await prisma.students.findFirst({
                    where: {
                        AND: [
                            { stripeCustomerID: String(customer) },
                            { cpf: metadata.cpf }
                        ]
                    }
                })

                if (!foundStudent) {
                    return
                }

                const studentUpdated = await prisma.students.update({
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
                })


                console.log(`student updated: ${studentUpdated.id}`)

                return
            }
        }

    } catch (error) {
        throw Error(`Erro ao processar o evento payment_intent.canceled: ${error}`);
    }
}
async function handlePaymentIntentRequiresAction(stripeEvent: DiscriminatedEvent) {


    try {
        if (stripeEvent.type === 'payment_intent.requires_action') {

            const { customer, metadata, amount } = stripeEvent.data.object

            if (customer && metadata) {


                const foundStudent = await prisma.students.findFirst({
                    where: {
                        AND: [
                            { stripeCustomerID: String(customer) },
                            { cpf: metadata.cpf }
                        ]
                    }
                })

                if (!foundStudent) {
                    return
                }

                const studentUpdated = await prisma.students.update({
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
                })


                console.log(`student updated: ${studentUpdated.id}`)

                return
            }
        }

    } catch (error) {
        throw Error(`Erro ao processar o evento payment_intent.requires_action: ${error}`);
    }
}

export {
    handleInvoicePaymentFailed,
    handleCustomerSubscriptionUpdated,
    handlePaymentIntentSucceeded,
    handlePaymentIntentFailed,
    handlePaymentIntentCanceled,
    handlePaymentIntentRequiresAction
}