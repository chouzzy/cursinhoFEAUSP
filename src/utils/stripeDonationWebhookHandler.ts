import { prisma } from "../prisma";
import Stripe from "stripe";
import { stripe } from "../server";
import { MailService } from "../services/MailService"; 

const mailService = new MailService();

// Helper para recalcular o total pago e ciclos diretamente do Stripe
async function syncDonationWithStripe(donationId: string, stripeCustomerId: string, stripeSubscriptionId?: string) {
    try {
        console.log(`Sincronizando doação ${donationId} com dados do Stripe...`);
        
        const params: Stripe.InvoiceListParams = {
            customer: stripeCustomerId,
            status: 'paid',
            limit: 100,
        };

        if (stripeSubscriptionId) {
            params.subscription = stripeSubscriptionId;
        }

        const invoices = await stripe.invoices.list(params);
        
        let totalPaid = 0;
        let cycles = 0;

        if (stripeSubscriptionId) {
            cycles = invoices.data.length;
            totalPaid = invoices.data.reduce((acc, inv) => acc + (inv.amount_paid / 100), 0);
        } else {
             return; 
        }

        console.log(`Dados Stripe recuperados: ${cycles} ciclos, R$ ${totalPaid} total.`);

        const updatedDonation = await prisma.donations.update({
            where: { id: donationId },
            data: {
                ciclePaid: cycles,
                valuePaid: totalPaid,
                paymentDate: new Date(),
                paymentStatus: 'active'
            }
        });

        if (updatedDonation.ciclesBought > 0 && updatedDonation.ciclePaid >= updatedDonation.ciclesBought) {
             console.log(`Ciclos contratados (${updatedDonation.ciclesBought}) atingidos. Verificando cancelamento...`);
             if (stripeSubscriptionId) {
                 const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
                 if (!sub.cancel_at_period_end) {
                     await stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: true });
                     console.log('Cancelamento agendado no Stripe.');
                 }
             }
        }

        return updatedDonation;

    } catch (error) {
        console.error("Erro ao sincronizar com Stripe:", error);
        throw error;
    }
}


export async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const donationId = session.metadata?.donationId;

  if (!donationId) return;

  try {
    const updateData: any = {
      paymentStatus: 'active',
      paymentDate: new Date(),
    };

    let stripeSubscriptionId = '';
    if (session.subscription) {
      stripeSubscriptionId = session.subscription as string;
      updateData.stripeSubscriptionID = stripeSubscriptionId;
    }
    
    if (session.customer) {
      updateData.stripeCustomerID = session.customer as string;
    }

    if (session.mode === 'payment') {
        updateData.paymentStatus = 'CONCLUIDA';
        updateData.ciclePaid = 1;
    }

    await prisma.donations.update({
      where: { id: donationId },
      data: updateData
    });

    console.log(`Doação ${donationId} confirmada via Checkout.`);

    if (session.mode === 'subscription' && session.customer) {
         setTimeout(async () => {
             await syncDonationWithStripe(donationId, session.customer as string, stripeSubscriptionId);
         }, 2000);
    }
    
     if (session.mode === 'subscription' && session.subscription) {
        const donation = await prisma.donations.findUnique({ where: { id: donationId } });
        if (donation && donation.ciclesBought > 0) {
             try {
                const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
                const startDate = new Date(subscription.current_period_start * 1000);
                const cancelDate = new Date(startDate);
                cancelDate.setMonth(cancelDate.getMonth() + donation.ciclesBought);
                const cancelAtTimestamp = Math.floor(cancelDate.getTime() / 1000);

                await stripe.subscriptions.update(session.subscription as string, {
                    cancel_at: cancelAtTimestamp,
                    proration_behavior: 'none',
                });
                console.log(`Assinatura programada para cancelar em timestamp ${cancelAtTimestamp}`);
            } catch (err) { console.error('Erro ao configurar cancel_at:', err); }
        }
    }


    const finalDonation = await prisma.donations.findUnique({ where: { id: donationId } });
    if (finalDonation?.email) {
        // Envia email de agradecimento
        // Se for assinatura, o valor inicial pago pode ser recuperado da sessão ou do banco
        // O valor salvo no banco é em Reais
        await sendThankYouEmail(finalDonation.email, finalDonation.name, finalDonation.valuePaid);
    }
  } catch (error) {
    console.error(`Erro ao atualizar doação ${donationId} no webhook:`, error);
    throw error;
  }
}

export async function handleInvoicePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  
  if (invoice.billing_reason === 'subscription_create') {
      return;
  }

  const stripeSubscriptionID = invoice.subscription as string;
  const stripeCustomerID = invoice.customer as string;

  try {
    const donation = await prisma.donations.findFirst({
        where: { stripeSubscriptionID: stripeSubscriptionID }
    });

    if (!donation) {
        return;
    }

    const updatedDonation = await syncDonationWithStripe(donation.id, stripeCustomerID, stripeSubscriptionID);

    console.log(`Doação ${donation.id} processada via Invoice.`);

    if (updatedDonation && donation.email) {
        const amountPaidNow = invoice.amount_paid / 100;
        await sendThankYouEmail(donation.email, donation.name, amountPaidNow, true);
    }

  } catch (error) {
      console.error(`Erro ao processar invoice ${invoice.id}:`, error);
      throw error;
  }
}

export async function handleSubscriptionUpdated(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    try {
        const donation = await prisma.donations.findFirst({
            where: { stripeSubscriptionID: subscription.id }
        });
        if (!donation) return;
        
        await syncDonationWithStripe(donation.id, subscription.customer as string, subscription.id);

        await prisma.donations.update({
            where: { id: donation.id },
            data: {
                paymentStatus: subscription.status,
                canceledAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
                donationExpirationDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null
            }
        });
    } catch (error) { console.error(error); }
}

export async function handleSubscriptionDeleted(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    try {
        const donation = await prisma.donations.findFirst({
            where: { stripeSubscriptionID: subscription.id }
        });
        if (!donation) return;

        await prisma.donations.update({
            where: { id: donation.id },
            data: {
                paymentStatus: 'canceled',
                canceledAt: new Date(),
            }
        });
    } catch (error) { console.error(error); }
}

// **FUNÇÃO DE EMAIL ESTILIZADA**
async function sendThankYouEmail(email: string, name: string, value: number, isRecurring = false) {
    const subject = isRecurring ? 'Sua doação mensal foi confirmada! 🎉' : 'Obrigado pela sua doação! 💙';
    const title = isRecurring ? 'Doação Mensal Recebida' : 'Doação Confirmada';
    const message = isRecurring 
        ? 'Obrigado por continuar apoiando nosso sonho mensalmente. Sua contribuição constante é a base para transformarmos a educação.' 
        : 'Sua generosidade faz toda a diferença. Com este apoio, damos mais um passo na democratização do ensino.';

    const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    try {
        await mailService.sendEmail({
            toEmail: email,
            toName: name,
            subject: subject,
            htmlContent: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td style="padding: 20px 0 30px 0;">
                                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; border: 1px solid #e0e0e5; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                                    <!-- Cabeçalho -->
                                    <tr>
                                        <td align="center" style="padding: 40px 0 30px 0; background-color: #00274c;">
                                            <h1 style="color: #f4c430; font-size: 28px; margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Cursinho FEA USP</h1>
                                        </td>
                                    </tr>
                                    <!-- Corpo -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                <tr>
                                                    <td style="color: #153643; font-size: 24px; font-weight: bold; padding-bottom: 20px;">
                                                        ${title}!
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #555555; font-size: 16px; line-height: 24px; padding-bottom: 30px;">
                                                        Olá, <strong>${name}</strong>!<br><br>
                                                        ${message}
                                                    </td>
                                                </tr>
                                                <!-- Box de Valor -->
                                                <tr>
                                                    <td align="center" style="padding-bottom: 30px;">
                                                        <table border="0" cellpadding="0" cellspacing="0" style="background-color: #f0f7ff; border-radius: 8px; border-left: 4px solid #004aad;">
                                                            <tr>
                                                                <td style="padding: 15px 30px; font-size: 18px; color: #004aad;">
                                                                    Valor doado: <strong>${formattedValue}</strong>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #555555; font-size: 16px; line-height: 24px;">
                                                        Em nome de todos os alunos, professores e voluntários, nosso muito obrigado por acreditar na educação.
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <!-- Rodapé -->
                                    <tr>
                                        <td style="padding: 30px; background-color: #f8f9fa; border-top: 1px solid #e0e0e5;">
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                <tr>
                                                    <td style="color: #999999; font-size: 12px; text-align: center; line-height: 18px;">
                                                        <p style="margin: 0;"><strong>Cursinho FEA USP</strong></p>
                                                        <p style="margin: 0;">Transformando vidas através da educação.</p>
                                                        <p style="margin: 10px 0 0 0;">
                                                            <a href="https://cursinhofeausp.com.br" style="color: #004aad; text-decoration: none;">Acesse nosso site</a>
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
            textContent: `Olá ${name}, obrigado pela doação de ${formattedValue}! Sua contribuição ajuda a manter o Cursinho FEA USP.`
        });
    } catch (e) {
        console.error("Erro ao enviar email (provavelmente limite do trial):", e);
    }
}