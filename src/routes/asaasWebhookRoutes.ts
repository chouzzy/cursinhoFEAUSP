import { anoDaTurma } from "../utils/matriculaYear";
import express, { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import { AsaasService } from "../services/AsaasService"; // Importe o AsaasService

const asaasWebhookRoutes = Router();
const asaasService = new AsaasService(); // Instancie o serviço

asaasWebhookRoutes.use((req, res, next) => {
    console.log(`[ASAAS WEBHOOK] Recebido método: ${req.method} URL: ${req.originalUrl}`);
    next();
});

// Eventos do Asaas que indicam que a cobrança não vai ser paga (ou ficou pendente).
// Só registramos no log, para que o diagnóstico de "o pagamento não funcionou" seja possível.
const FAILURE_EVENTS = [
    'PAYMENT_OVERDUE',
    'PAYMENT_DELETED',
    'PAYMENT_REFUNDED',
    'PAYMENT_CHARGEBACK_REQUESTED',
    'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED',
    'PAYMENT_REPROVED_BY_RISK_ANALYSIS',
    'PAYMENT_AWAITING_RISK_ANALYSIS',
];

asaasWebhookRoutes.post('/', express.json(), async (req: Request, res: Response) => {
    console.log("--- 🟢 INÍCIO DO WEBHOOK ASAAS ---");

    // O Asaas envia no header `asaas-access-token` o token definido no cadastro do webhook.
    // Com ASAAS_WEBHOOK_TOKEN configurado, qualquer chamada sem o token certo é recusada.
    // Sem a variável, o comportamento antigo é mantido (aceita tudo) e fica um aviso no log.
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
    if (expectedToken) {
        if (req.headers['asaas-access-token'] !== expectedToken) {
            console.warn("⛔ Webhook Asaas recusado: token ausente ou inválido.");
            return res.status(401).json({ received: false });
        }
    } else {
        console.warn("⚠️ ASAAS_WEBHOOK_TOKEN não configurado: webhook Asaas aceito sem autenticação.");
    }

    res.status(200).json({ received: true });
    console.log("Resposta 200 enviada ao Asaas.");

    (async () => {
        try {
            const body = req.body;
            const { event, payment } = body;

            if (!event || !payment) {
                console.warn("⚠️ Payload inválido ou incompleto.");
                return;
            }

            console.log(`[ASAAS WEBHOOK] evento=${event} payment=${payment.id} ref=${payment.externalReference} billingType=${payment.billingType} status=${payment.status}`);

            if (FAILURE_EVENTS.includes(event)) {
                console.warn(`⚠️ [ASAAS WEBHOOK] Cobrança ${payment.id} (ref ${payment.externalReference}) recebeu ${event}. Nada é alterado no banco.`);
                return;
            }

            // Cartão gera PAYMENT_CONFIRMED e, dias depois, PAYMENT_RECEIVED para a mesma cobrança.
            // Processar os dois duplicava e-mail e, na doação recorrente, somava o valor duas vezes.
            if (event === 'PAYMENT_RECEIVED' && payment.billingType === 'CREDIT_CARD') {
                console.log(`[ASAAS WEBHOOK] PAYMENT_RECEIVED de cartão (${payment.id}) já tratado no PAYMENT_CONFIRMED. Ignorando.`);
                return;
            }

            if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
                const externalReference = payment.externalReference;
                
                if (!externalReference) {
                    console.warn('⚠️ Pagamento sem referência externa (txid/id). Ignorando.');
                    return;
                }

                console.log(`Processando pagamento ref: ${externalReference}`);

                try {
                    // 1. Tenta buscar em Doações
                    const donation = await prisma.donations.findFirst({
                        where: { 
                            OR: [
                                { txid: externalReference },
                                { id: externalReference }
                            ]
                        }
                    });

                    if (donation) {
                        console.log(`✅ Doação encontrada (ID: ${donation.id}). Atualizando...`);

                        const isRecurring = donation.ciclesBought === 0 || donation.ciclesBought > 1;

                        // Doação única já confirmada: reenvio do Asaas não pode repetir e-mail nem regravar.
                        if (!isRecurring && donation.paymentStatus === 'CONCLUIDA') {
                            console.log(`Doação ${donation.id} já confirmada. Ignorando evento repetido.`);
                            return;
                        }

                        const updateData: any = {
                            paymentDate: new Date(),
                            paymentStatus: isRecurring ? 'active' : 'CONCLUIDA', 
                        };

                        if (payment.subscription) {
                            updateData.stripeSubscriptionID = payment.subscription;
                        }

                        if (isRecurring && donation.paymentStatus !== 'PENDENTE') {
                            updateData.valuePaid = { increment: payment.value };
                            updateData.ciclePaid = { increment: 1 };
                        } else {
                            updateData.valuePaid = payment.value;
                            updateData.ciclePaid = 1;
                        }

                        await prisma.donations.update({
                            where: { id: donation.id },
                            data: updateData
                        });
                        
                        console.log(`🎉 Doação Asaas ${donation.id} confirmada com sucesso.`);
                        
                        // **ENVIO DE EMAIL DE DOAÇÃO**
                        await asaasService.sendDonationSuccessEmail(donation.id);

                    } else {
                        // 2. Tenta buscar em Inscrições (Students)
                        console.log("Doação não encontrada. Verificando Inscrições (Students)...");
                        const student = await prisma.students.findFirst({
                            where: {
                                purcharsedSubscriptions: {
                                    some: { txid: externalReference }
                                }
                            }
                        });

                        if (student) {
                             console.log(`✅ Estudante encontrado (Nome: ${student.name}). Atualizando inscrição...`);
                             
                             // Precisamos gerar a matrícula aqui também, igual no Santander/Stripe
                             // Encontra a subscrição específica para pegar o schoolClassID
                             const subscription = student.purcharsedSubscriptions.find(s => s.txid === externalReference);
                             let novaMatriculaID = null;

                             if (subscription) {
                                 // Evita duplicidade se já processado
                                 if (subscription.paymentStatus === 'CONCLUIDA') {
                                     console.log(`Inscrição ${externalReference} já processada. Ignorando.`);
                                     return;
                                 }

                                 try {
                                     const turma = await prisma.schoolClass.update({
                                         where: { id: subscription.schoolClassID },
                                         data: { registrationCounter: { increment: 1 } }
                                     });
                                     const ano = anoDaTurma(turma.title);
                                     const codigoTurma = turma.code || 'GERAL';
                                     const sequencial = turma.registrationCounter.toString().padStart(4, '0');
                                     novaMatriculaID = `${ano}${codigoTurma}${sequencial}`;
                                 } catch (e) {
                                     console.error("Erro ao gerar matrícula Asaas:", e);
                                 }
                             }

                             await prisma.students.update({
                                where: { id: student.id },
                                data: {
                                    purcharsedSubscriptions: {
                                        updateMany: {
                                            where: { txid: externalReference },
                                            data: {
                                                paymentStatus: 'CONCLUIDA',
                                                pixStatus: 'CONCLUIDA',
                                                paymentDate: new Date(),
                                                matriculaID: novaMatriculaID
                                            }
                                        }
                                    }
                                }
                             });
                             console.log(`🎉 Inscrição Asaas ${externalReference} confirmada com sucesso.`);

                             // **ENVIO DE EMAIL DE INSCRIÇÃO**
                             if (subscription && novaMatriculaID) {
                                 await asaasService.sendInscriptionSuccessEmail(student.id, novaMatriculaID, subscription.schoolClassID);
                             }
                        } else {
                            console.warn(`⚠️ NENHUM REGISTRO ENCONTRADO para a referência: ${externalReference}`);
                        }
                    }
                } catch (dbError: any) {
                    console.error("❌ ERRO DE BANCO DE DADOS:", dbError.message);
                }
            } 
        } catch (bgError: any) {
            console.error("❌ ERRO CRÍTICO NO BACKGROUND:", bgError.message);
        } finally {
            console.log("--- 🏁 FIM DO PROCESSAMENTO ASAAS ---");
        }
    })();
});

export { asaasWebhookRoutes };