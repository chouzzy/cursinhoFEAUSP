import { anoDaTurma } from "../utils/matriculaYear";
import { prisma } from "../prisma";
import { randomUUID } from 'crypto';
import { Students } from "@prisma/client";
import { MailService } from "./MailService"; 
import { buildConfirmacaoInscricaoHtml } from "../utils/confirmacaoInscricaoEmail";
import { stripe } from "../server";

const mailService = new MailService();

// Tipo derivado do modelo
type InscriptionData = Omit<Students, 'id' | 'createdAt' | 'purcharsedSubscriptions' | 'stripeCustomerID' | 'name' | 'emailResponsavel' | 'nomeResponsavel' | 'cpfResponsavel' | 'aceiteTermoCiencia' | 'aceiteTermoInscricao'> & {
  schoolClassID: string;
  nome: string;
  sobrenome: string;
  aceiteTermoCiencia: boolean;
  aceiteTermoInscricao: boolean;
  emailResponsavel?: string;
  nomeResponsavel?: string | null;
  cpfResponsavel?: string | null;
  codigoDesconto?: string;
  paymentMethod?: string;
  price?: string;
  value?: number;
  interval?: string;
  cycles?: number;
};

export class StripeInscriptionService {

  async createCheckoutSession(inscriptionData: any) {
    const { 
      schoolClassID, 
      nome, 
      sobrenome, 
      codigoDesconto, 
      emailResponsavel,
      nomeResponsavel,
      cpfResponsavel,
      aceiteTermoCiencia,
      aceiteTermoInscricao,
      paymentMethod,
      price,
      value,
      interval,
      cycles,
      cpf, 
      ...studentModelData 
    } = inscriptionData;

    const nomeCompleto = `${nome} ${sobrenome}`;
    const sanitizedCpf = inscriptionData.cpf.replace(/\D/g, ''); 

    const schoolClass = await prisma.schoolClass.findUnique({
        where: { id: schoolClassID },
        include: { documents: true } 
    });

    if (!schoolClass) {
        throw new Error('Turma não encontrada.');
    }

    // **CORREÇÃO AQUI:** // Lendo de 'subscriptions.price' para alinhar com o frontend.
    // Fallback para 'registrations.value' apenas por segurança.
    let rawPrice = schoolClass.subscriptions?.price ?? schoolClass.registrations?.value ?? 0;
    
    // Converte de centavos para reais (float)
    let basePrice = rawPrice / 100;

    console.log(`[StripeInscription] Turma: ${schoolClass.title}, Preço Bruto (DB): ${rawPrice}, Preço Base (Reais): ${basePrice}`);

    let finalPrice = basePrice;
    let couponCodeUsed: string | undefined = undefined;

    if (codigoDesconto) {
      const coupon = await prisma.discountCoupon.findFirst({
        where: { code: codigoDesconto, isActive: true }
      });
      if (coupon) {
        finalPrice = basePrice - coupon.discountValue;
        if (finalPrice < 0) finalPrice = 0;
        couponCodeUsed = coupon.code;
        console.log(`[StripeInscription] Cupom aplicado: ${coupon.code}, Novo Preço: ${finalPrice}`);
      }
    }

    const customer = await this.findOrCreateCustomer(inscriptionData.email, nomeCompleto, sanitizedCpf);

    let studentId: string;
    
    let existingStudent = await prisma.students.findFirst({
        where: { cpf: sanitizedCpf }
    });

    const txid = `stripe_insc_${randomUUID()}`;

    if (existingStudent) {
        const completedSubscription = existingStudent.purcharsedSubscriptions.find(
            sub => sub.schoolClassID === schoolClassID && sub.paymentStatus === 'CONCLUIDA'
        );

        if (completedSubscription) {
            throw new Error('Você já está inscrito e com o pagamento confirmado para esta turma.');
        }

        const updatedStudent = await prisma.students.update({
            where: { id: existingStudent.id },
            data: {
                ...studentModelData, 
                name: nomeCompleto,
                email: inscriptionData.email, 
                emailResponsavel: emailResponsavel,
                nomeResponsavel: nomeResponsavel ?? null,
                cpfResponsavel: cpfResponsavel ?? null,
                purcharsedSubscriptions: {
                    push: [{
                        schoolClassID: schoolClassID,
                        productName: schoolClass.title,
                        txid: txid,
                        paymentMethod: "stripe_checkout",
                        paymentStatus: "PENDENTE",
                        pixStatus: "PENDENTE",
                        paymentDate: new Date(),
                        valuePaid: finalPrice,
                        codigoDesconto: couponCodeUsed,
                    }]
                }
            }
        });
        studentId = updatedStudent.id;
    } else {
        const newStudent = await prisma.students.create({
            data: {
                ...studentModelData, 
                name: nomeCompleto,
                cpf: sanitizedCpf, 
                email: inscriptionData.email,
                emailResponsavel: emailResponsavel,
                nomeResponsavel: nomeResponsavel ?? null,
                cpfResponsavel: cpfResponsavel ?? null,
                aceiteTermoCiencia: aceiteTermoCiencia,
                aceiteTermoInscricao: aceiteTermoInscricao,
                stripeCustomerID: customer.id,
                purcharsedSubscriptions: [{
                    schoolClassID: schoolClassID,
                    productName: schoolClass.title,
                    txid: txid,
                    paymentMethod: "stripe_checkout",
                    paymentStatus: "PENDENTE",
                    pixStatus: "PENDENTE",
                    paymentDate: new Date(),
                    valuePaid: finalPrice,
                    codigoDesconto: couponCodeUsed,
                }]
            }
        });
        studentId = newStudent.id;
    }

    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    if (!appUrl.startsWith('http')) {
        const protocol = appUrl.includes('localhost') ? 'http://' : 'https://';
        appUrl = `${protocol}${appUrl}`;
    }
    if (appUrl.endsWith('/')) {
        appUrl = appUrl.slice(0, -1);
    }

    const successUrl = `${appUrl}/inscricoes/sucesso`;

    // --- TRATAMENTO PARA VALOR GRATUITO OU ABAIXO DO MÍNIMO ---
    // O mínimo do Stripe é aprox R$ 2.50. Colocamos 3.00 para segurança.
    // Se for menor que isso, aprovamos direto para não dar erro.
    if (finalPrice < 3.00) {
        console.log(`Valor (${finalPrice}) abaixo do mínimo do Stripe. Processando como gratuito/isento.`);
        
        let novaMatriculaID = null;
        try {
            const updatedTurma = await prisma.schoolClass.update({
                where: { id: schoolClassID },
                data: { registrationCounter: { increment: 1 } }
            });
            const ano = anoDaTurma(updatedTurma.title);
            const codigoTurma = updatedTurma.code || 'GERAL';
            const sequencial = updatedTurma.registrationCounter.toString().padStart(4, '0');
            novaMatriculaID = `${ano}${codigoTurma}${sequencial}`;
        } catch (err) {
            console.error('Erro ao gerar matrícula para inscrição gratuita:', err);
        }

        const finalStudent = await prisma.students.update({
            where: { id: studentId },
            data: {
                purcharsedSubscriptions: {
                    updateMany: {
                        where: { txid: txid },
                        data: {
                            paymentStatus: 'CONCLUIDA',
                            pixStatus: 'CONCLUIDA',
                            matriculaID: novaMatriculaID,
                            paymentDate: new Date()
                        }
                    }
                }
            }
        });

        if (finalStudent.email) {
            await mailService.sendEmail({
                toEmail: finalStudent.email,
                toName: finalStudent.name,
                subject: 'Inscrição Confirmada - Cursinho FEA USP',
                htmlContent: buildConfirmacaoInscricaoHtml({ nome: finalStudent.name, turma: schoolClass, pedido: novaMatriculaID }),
                textContent: `Inscrição confirmada! Número do pedido: ${novaMatriculaID}. A equipe entrará em contato em breve. Acesse os documentos da turma pelo portal.`
            });
        }

        return { url: successUrl };
    }

    // --- FLUXO NORMAL (PAGAMENTO > R$ 3.00) ---
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
            currency: 'brl',
            product_data: { name: `Inscrição - ${schoolClass.title}` },
            unit_amount: Math.round(finalPrice * 100),
        },
        quantity: 1,
      }],
      metadata: {
        studentId: studentId,
        schoolClassID: schoolClassID,
        txid: txid,
        type: 'inscription'
      },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/inscricoes`,
    });

    return { url: session.url };
  }

  private async findOrCreateCustomer(email: string, name: string, cpf: string) {
    const existingCustomers = await stripe.customers.list({ email: email, limit: 1 });
    if (existingCustomers.data.length > 0) return existingCustomers.data[0];
    return await stripe.customers.create({ email, name, metadata: { cpf } });
  }
}