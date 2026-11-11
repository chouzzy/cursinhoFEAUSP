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

asaasWebhookRoutes.post('/', express.json(), async (req: Request, res: Response) => {
    console.log("--- 🟢 INÍCIO DO WEBHOOK ASAAS ---");

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