import { stripe } from "../server";
import { prisma } from "../prisma";
import { randomUUID } from 'crypto';
import { MailService } from "./MailService"; // Importamos o MailService

const mailService = new MailService(); // Instanciamos para enviar o e-mail do portal

interface CreateStripeDonationData {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  value: number; // Valor em centavos
  interval: 'month' | 'one_time';
  productName?: string;
  cycles: number; // Recebe a quantidade exata de ciclos
  
  // Opcionais...
  rg?: string;
  ufrg?: string;
  gender?: string;
  birth?: string;
  isPhoneWhatsapp?: boolean;
  zipCode?: string;
  street?: string;
  homeNumber?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
}

export class StripeDonationService {

  async createCheckoutSession(data: CreateStripeDonationData) {
    let customer = await this.findOrCreateCustomer(data.email, data.name, data.cpf);
    const txid = `stripe_${randomUUID()}`;

    // Determina o número de ciclos para salvar no banco
    const cyclesToSave = data.interval === 'one_time' ? 1 : (data.cycles || 0);

    const donation = await prisma.donations.create({
      data: {
        name: data.name,
        email: data.email,
        cpf: data.cpf.replace(/\D/g, ''),
        phoneNumber: data.phone,
        valuePaid: data.value / 100,
        paymentMethod: 'stripe_checkout',
        paymentStatus: 'PENDENTE',
        
        txid: txid,
        pixCopiaECola: `stripe_na_${randomUUID()}`, 
        pixQrCode: `stripe_na_${randomUUID()}`,    

        rg: data.rg,
        ufrg: data.ufrg || '',
        gender: data.gender || '',
        birth: data.birth || '',
        isPhoneWhatsapp: data.isPhoneWhatsapp || false,
        
        zipCode: data.zipCode || '',
        street: data.street || '',
        homeNumber: data.homeNumber || '',
        complement: data.complement,
        district: data.district || '',
        city: data.city || '',
        state: data.state || '',

        ciclesBought: cyclesToSave, 
        ciclePaid: 0,
        valueBought: (data.value / 100) * cyclesToSave, 
        stripeCustomerID: customer.id,
      }
    });

    const priceData = {
      currency: 'brl',
      product_data: {
        name: data.productName || 'Doação Cursinho FEA USP',
      },
      unit_amount: Math.round(data.value),
      ...(data.interval === 'month' && {
        recurring: {
          interval: 'month' as const,
        },
      }),
    };

    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    if (!appUrl.startsWith('http://') && !appUrl.startsWith('https://')) {
        const protocol = appUrl.includes('localhost') ? 'http://' : 'https://';
        appUrl = `${protocol}${appUrl}`;
    }
    if (appUrl.endsWith('/')) {
        appUrl = appUrl.slice(0, -1);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: data.interval === 'month' ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: priceData,
        quantity: 1,
      }],
      metadata: {
        donationId: donation.id, 
      },
      success_url: `${appUrl}/doacoes/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/doacoes`,
    });

    return {
      url: session.url,
      donationId: donation.id
    };
  }

  // **NOVO MÉTODO: Cria sessão do Portal do Cliente e envia por e-mail ESTILIZADO**
  async sendCustomerPortalLink(email: string) {
    // 1. Busca o doador pelo email
    const donation = await prisma.donations.findFirst({
        where: { email: email },
        orderBy: { createdAt: 'desc' } // Pega o mais recente se houver duplicados
    });

    if (!donation || !donation.stripeCustomerID) {
        throw new Error('Doador não encontrado ou sem vínculo com Stripe.');
    }

    // 2. Define a URL de retorno
    let returnUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    if (!returnUrl.startsWith('http')) returnUrl = `https://${returnUrl}`;
    if (returnUrl.endsWith('/')) {
        returnUrl = returnUrl.slice(0, -1);
    }

    // 3. Cria a sessão do portal no Stripe
    const session = await stripe.billingPortal.sessions.create({
        customer: donation.stripeCustomerID,
        return_url: `${returnUrl}/doacoes`, // Volta para a página de doações
    });

    // 4. Envia o link por e-mail com template estilizado
    console.log(`Enviando link do portal para ${email}...`);
    await mailService.sendEmail({
        toEmail: email,
        toName: donation.name,
        subject: 'Acesse seu Portal do Doador - Cursinho FEA USP',
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
                                                <td style="color: #153643; font-size: 24px; font-weight: bold; padding-bottom: 20px; text-align: center;">
                                                    Acesso ao Portal do Doador
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="color: #555555; font-size: 16px; line-height: 24px; padding-bottom: 20px;">
                                                    Olá, <strong>${donation.name}</strong>.
                                                    <br><br>
                                                    Você solicitou acesso para gerenciar suas doações. No portal, você pode:
                                                    <ul style="color: #555555; font-size: 16px; line-height: 24px;">
                                                        <li>Atualizar seu cartão de crédito</li>
                                                        <li>Baixar recibos de pagamentos anteriores</li>
                                                        <li>Cancelar sua assinatura mensal</li>
                                                    </ul>
                                                </td>
                                            </tr>
                                            <!-- Botão de Ação -->
                                            <tr>
                                                <td align="center" style="padding-top: 10px; padding-bottom: 30px;">
                                                    <table border="0" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td align="center" style="border-radius: 5px;" bgcolor="#004aad">
                                                                <a href="${session.url}" target="_blank" style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 5px; padding: 12px 25px; border: 1px solid #004aad; display: inline-block; font-weight: bold;">Acessar Portal Seguro &rarr;</a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="color: #999999; font-size: 14px; line-height: 20px; text-align: center;">
                                                    Este link expira em breve por segurança.<br/>
                                                    Se você não solicitou este acesso, pode ignorar este e-mail.
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
        textContent: `Olá ${donation.name}. Use este link para gerenciar sua doação: ${session.url}`
    });

    return { success: true, message: 'Link enviado por e-mail' };
  }

  private async findOrCreateCustomer(email: string, name: string, cpf: string) {
    const existingCustomers = await stripe.customers.list({ email: email, limit: 1 });
    
    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    return await stripe.customers.create({
      email,
      name,
      metadata: { cpf }
    });
  }
}