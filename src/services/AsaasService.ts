import { asaas } from "../lib/asaas";
import { prisma } from "../prisma";
import { randomUUID } from 'crypto';
import { MailService } from "./MailService"; 
import jwt from 'jsonwebtoken';

const mailService = new MailService();

interface CreatePaymentData {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  value: number; 
  interval: 'month' | 'one_time';
  cycles: number;
  productName: string;
  
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
  
  type: 'donation' | 'inscription';
  schoolClassID?: string; 
  
  // Campos extras de Inscrição
  sobrenome?: string;
  emailResponsavel?: string;
  aceiteTermoCiencia?: boolean;
  aceiteTermoInscricao?: boolean;
  selfDeclaration?: string;
  oldSchool?: string;
  oldSchoolAdress?: string;
  highSchoolGraduationDate?: string;
  highSchoolPeriod?: string;
  metUsMethod?: string;
  exStudent?: string;
  codigoDesconto?: string; // Adicionado campo de desconto
}

export class AsaasService {

  async createPaymentSession(data: CreatePaymentData) {
    const customerId = await this.findOrCreateCustomer(data);
    const txid = `asaas_${randomUUID()}`; 
    
    // Valor Base em Reais
    let finalValueInReais = data.value / 100;
    let couponCodeUsed: string | undefined = undefined;

    // --- LÓGICA DE DESCONTO ---
    if (data.codigoDesconto) {
      console.log(`[AsaasService] Verificando cupom: ${data.codigoDesconto}`);
      const coupon = await prisma.discountCoupon.findFirst({
        where: { code: data.codigoDesconto, isActive: true }
      });

      if (coupon) {
        // Subtrai o valor do desconto
        finalValueInReais = (data.value / 100) - coupon.discountValue;
        
        // Garante que não fique negativo
        if (finalValueInReais < 0) finalValueInReais = 0;
        
        couponCodeUsed = coupon.code;
        console.log(`[AsaasService] Cupom aplicado! Valor original: ${data.value/100}, Desconto: ${coupon.discountValue}, Final: ${finalValueInReais}`);
      } else {
        console.warn(`[AsaasService] Cupom inválido ou inativo: ${data.codigoDesconto}`);
      }
    }
    // ---------------------------

    let paymentUrl = '';
    let asaasSubscriptionId: string | null = null; 

    // ATENÇÃO: O Asaas tem limite mínimo para cartão (geralmente R$ 5,00).
    // Se o valor final for muito baixo (ex: R$ 0,60), o Asaas pode rejeitar.
    // Mas vamos enviar o valor calculado corretamente agora.

    if (data.interval === 'one_time') {
        const payload = {
            customer: customerId,
            billingType: 'UNDEFINED',
            value: finalValueInReais, // Usa o valor com desconto
            dueDate: new Date().toISOString().split('T')[0],
            description: data.productName,
            externalReference: txid, 
            postalService: false
        };
        const response = await asaas.post('/payments', payload);
        paymentUrl = response.data.invoiceUrl;
    
    } else {
        const payload: any = {
            customer: customerId,
            billingType: 'CREDIT_CARD',
            value: finalValueInReais, // Usa o valor com desconto
            nextDueDate: new Date().toISOString().split('T')[0],
            cycle: 'MONTHLY',
            description: data.productName,
            externalReference: txid,
        };

        if (data.cycles > 0) {
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + (data.cycles - 1));
            payload.endDate = endDate.toISOString().split('T')[0];
        }

        const response = await asaas.post('/subscriptions', payload);
        asaasSubscriptionId = response.data.id; 
        
        const payments = await asaas.get(`/subscriptions/${response.data.id}/payments`);
        const firstPayment = payments.data.data[0];
        paymentUrl = firstPayment.invoiceUrl;
    }

    let donationId = '';

    if (data.type === 'donation') {
        const donation = await prisma.donations.create({
            data: {
                name: data.name,
                email: data.email,
                cpf: data.cpf.replace(/\D/g, ''),
                phoneNumber: data.phone,
                valuePaid: finalValueInReais, // Salva o valor com desconto
                paymentMethod: 'asaas_checkout',
                paymentStatus: 'PENDENTE',
                txid: txid,
                pixCopiaECola: `asaas_na_${randomUUID()}`,
                pixQrCode: `asaas_na_${randomUUID()}`,
                
                rg: data.rg, ufrg: data.ufrg || '', gender: data.gender || '', birth: data.birth || '',
                isPhoneWhatsapp: data.isPhoneWhatsapp || false,
                zipCode: data.zipCode || '', street: data.street || '', homeNumber: data.homeNumber || '',
                complement: data.complement, district: data.district || '', city: data.city || '', state: data.state || '',
                
                ciclesBought: data.interval === 'month' ? (data.cycles || 0) : 1,
                ciclePaid: 0,
                valueBought: finalValueInReais * (data.interval === 'month' ? (data.cycles || 1) : 1),
                stripeCustomerID: customerId,
                stripeSubscriptionID: asaasSubscriptionId
            }
        });
        donationId = donation.id;

    } else if (data.type === 'inscription' && data.schoolClassID) {
        const sanitizedCpf = data.cpf.replace(/\D/g, '');
        
        let existingStudent = await prisma.students.findFirst({
            where: { cpf: sanitizedCpf }
        });

        const studentDataToSave = {
            name: data.name,
            email: data.email,
            cpf: sanitizedCpf,
            phoneNumber: data.phone,
            rg: data.rg, ufrg: data.ufrg || '', gender: data.gender || '', birth: data.birth || '',
            isPhoneWhatsapp: data.isPhoneWhatsapp || false,
            zipCode: data.zipCode || '', street: data.street || '', homeNumber: data.homeNumber || '',
            complement: data.complement, district: data.district || '', city: data.city || '', state: data.state || '',
            emailResponsavel: data.emailResponsavel,
            aceiteTermoCiencia: data.aceiteTermoCiencia || false,
            aceiteTermoInscricao: data.aceiteTermoInscricao || false,
            selfDeclaration: data.selfDeclaration || '',
            oldSchool: data.oldSchool || '',
            oldSchoolAdress: data.oldSchoolAdress || '',
            highSchoolGraduationDate: data.highSchoolGraduationDate || '',
            highSchoolPeriod: data.highSchoolPeriod || '',
            metUsMethod: data.metUsMethod || '',
            exStudent: data.exStudent || 'Não',
        };

        const subscriptionData = {
            schoolClassID: data.schoolClassID,
            txid: txid,
            paymentMethod: "asaas_checkout",
            paymentStatus: "PENDENTE",
            pixStatus: "PENDENTE",
            paymentDate: new Date(),
            valuePaid: finalValueInReais, // Salva o valor com desconto
            codigoDesconto: couponCodeUsed, // Salva o cupom
            pixCopiaECola: `asaas_na_${randomUUID()}`,
            pixQrCode: `asaas_na_${randomUUID()}`,
        };

        if (existingStudent) {
            const completedSub = existingStudent.purcharsedSubscriptions.find(
                sub => sub.schoolClassID === data.schoolClassID && sub.paymentStatus === 'CONCLUIDA'
            );
            if (completedSub) {
                 throw new Error('Você já está inscrito e com o pagamento confirmado para esta turma.');
            }

            await prisma.students.update({
                where: { id: existingStudent.id },
                data: {
                    ...studentDataToSave,
                    stripeCustomerID: customerId,
                    purcharsedSubscriptions: {
                        push: [subscriptionData]
                    }
                }
            });
        } else {
            await prisma.students.create({
                data: {
                    ...studentDataToSave,
                    stripeCustomerID: customerId,
                    purcharsedSubscriptions: [subscriptionData]
                }
            });
        }
    }

    return {
      url: paymentUrl,
      donationId: donationId
    };
  }

  // ** EMAIL ESTILIZADO DO PAINEL **
  async sendMagicLink(email: string) {
    const donation = await prisma.donations.findFirst({
        where: { email: email, paymentMethod: 'asaas_checkout' },
        orderBy: { createdAt: 'desc' }
    });

    if (!donation) throw new Error('Doador não encontrado.');

    const token = jwt.sign(
        { donationId: donation.id, type: 'access_portal', email }, // Incluindo email no token
        process.env.TOKEN_PRIVATE_KEY || 'secret', 
        { expiresIn: '1h' }
    );

    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}/doacoes/painel?token=${token}`;

    await mailService.sendEmail({
        toEmail: email,
        toName: donation.name,
        subject: 'Acesso ao Painel do Doador - Cursinho FEA USP',
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
                                                    Acesso ao Painel do Doador
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="color: #555555; font-size: 16px; line-height: 24px; padding-bottom: 20px;">
                                                    Olá, <strong>${donation.name}</strong>.
                                                    <br><br>
                                                    Você solicitou acesso para gerenciar suas doações. Clique no botão abaixo para entrar no seu painel seguro.
                                                </td>
                                            </tr>
                                            <!-- Botão de Ação -->
                                            <tr>
                                                <td align="center" style="padding-top: 20px; padding-bottom: 30px;">
                                                    <table border="0" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td align="center" style="border-radius: 5px;" bgcolor="#004aad">
                                                                <a href="${magicLink}" target="_blank" style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 5px; padding: 12px 25px; border: 1px solid #004aad; display: inline-block; font-weight: bold;">
                                                                    Acessar Meu Painel &rarr;
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="color: #999999; font-size: 14px; line-height: 20px; text-align: center;">
                                                    Este link expira em <strong>1 hora</strong> por segurança.<br/>
                                                    Se o botão não funcionar, copie e cole este link no seu navegador:<br/>
                                                    <span style="color: #004aad; word-break: break-all;">${magicLink}</span>
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
        textContent: `Acesse seu painel: ${magicLink}`
    });

    return { success: true };
  }

  async getSubscriptionDetails(donationId: string) {
      const donation = await prisma.donations.findUnique({ where: { id: donationId }});
      
      if (!donation) throw new Error('Doação não encontrada no banco.');
      if (!donation.stripeSubscriptionID) throw new Error('Esta doação não possui uma assinatura ativa (ID de assinatura ausente).');

      const response = await asaas.get(`/subscriptions/${donation.stripeSubscriptionID}`);
      const sub = response.data;

      return {
          status: sub.status,
          value: sub.value,
          nextDueDate: sub.nextDueDate,
          cycle: sub.cycle,
          description: sub.description
      };
  }

  async cancelSubscription(donationId: string, userEmail: string) {
      const donation = await prisma.donations.findUnique({ where: { id: donationId }});
      if (!donation || !donation.stripeSubscriptionID) throw new Error('Assinatura não encontrada.');
      if (!donation || donation.email !== userEmail) throw new Error('Permissão negada.');

      const response = await asaas.delete(`/subscriptions/${donation.stripeSubscriptionID}`);
      
      await prisma.donations.update({
          where: { id: donationId },
          data: { 
              paymentStatus: 'canceled',
              canceledAt: new Date()
          }
      });

      return { success: true, id: response.data.id };
  }

  private async findOrCreateCustomer(data: CreatePaymentData) {
    const cpfCnpj = data.cpf.replace(/\D/g, '');
    
    const { data: found } = await asaas.get('/customers', {
        params: { cpfCnpj }
    });

    if (found.data && found.data.length > 0) {
        return found.data[0].id;
    }

    const response = await asaas.post('/customers', {
        name: data.name,
        email: data.email,
        cpfCnpj: cpfCnpj,
        phone: data.phone,
        mobilePhone: data.phone
    });

    return response.data.id;
  }
}