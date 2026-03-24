import { prisma } from "../prisma";
import { randomUUID } from 'crypto';
import { Students } from "@prisma/client";
import { MailService } from "./MailService"; 
import { stripe } from "../server";

const mailService = new MailService();

// Tipo derivado do modelo
type InscriptionData = Omit<Students, 'id' | 'createdAt' | 'purcharsedSubscriptions' | 'stripeCustomerID' | 'name' | 'emailResponsavel' | 'aceiteTermoCiencia' | 'aceiteTermoInscricao'> & {
  schoolClassID: string;
  nome: string;
  sobrenome: string;
  aceiteTermoCiencia: boolean;
  aceiteTermoInscricao: boolean;
  emailResponsavel?: string;
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
            const ano = new Date().getFullYear();
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
            let linksHtml = '';
            if (schoolClass.documents && schoolClass.documents.length > 0) {
                linksHtml = `
                  <div style="margin: 20px 0; padding: 15px; background-color: #f0f7ff; border-left: 4px solid #004aad; border-radius: 4px;">
                    <h3 style="margin-top: 0; color: #004aad;">Documentos Importantes</h3>
                    <p style="margin-bottom: 10px;">Por favor, acesse e leia os documentos abaixo:</p>
                    <ul style="padding-left: 20px;">
                      ${schoolClass.documents.map((doc: any) => 
                        `<li style="margin-bottom: 8px;">
                           <a href="${doc.downloadLink}" target="_blank" style="color: #004aad; text-decoration: none; font-weight: bold; font-size: 16px;">
                             ${doc.title} 
                             <span style="font-size: 12px; color: #666;">(Clique para acessar)</span>
                           </a>
                         </li>`
                      ).join('')}
                    </ul>
                  </div>
                `;
            }

            await mailService.sendEmail({
                toEmail: finalStudent.email,
                toName: finalStudent.name,
                subject: 'Inscrição Confirmada - Cursinho FEA USP',
                htmlContent: `
                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px; background-color: #ffffff;">
                        
                        <div style="text-align: center; border-bottom: 2px solid #f4c430; padding-bottom: 15px; margin-bottom: 20px;">
                            <h1 style="color: #00274c; margin: 0;">Inscrição Confirmada!</h1>
                        </div>
                        
                        <p style="font-size: 16px;">Olá, <strong>${finalStudent.name}</strong>!</p>
                        
                        <p>Temos o prazer de confirmar que a sua inscrição no <strong>Cursinho FEA USP</strong> foi realizada com sucesso (Inscrição Isenta/Gratuita).</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 25px 0; text-align: center; border: 1px solid #eee;">
                            <p style="margin: 0; font-size: 0.9em; color: #666; text-transform: uppercase; letter-spacing: 1px;">Número de Matrícula</p>
                            <p style="margin: 5px 0 0 0; font-size: 2em; font-weight: bold; color: #00274c;">${novaMatriculaID || 'Em processamento'}</p>
                        </div>

                        ${linksHtml}
                        
                        <div style="margin-top: 30px;">
                            <h3 style="color: #333;">Próximos Passos</h3>
                            <p>Fique tranquilo(a)! Nossa equipe de seleção entrará em contato em breve.</p>
                            <p>Fique atento ao seu <strong>e-mail</strong> e <strong>WhatsApp</strong> (caso tenha informado) para receber as datas das entrevistas e demais instruções.</p>
                        </div>
                        
                        <br />
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        
                        <p style="font-size: 0.9em; color: #888; text-align: center;">
                            Atenciosamente,<br/>
                            <strong>Equipe Cursinho FEA USP</strong><br/>
                            <a href="https://cursinhofeausp.com.br" style="color: #004aad; text-decoration: none;">cursinhofeausp.com.br</a>
                        </p>
                    </div>
                `,
                textContent: `Inscrição confirmada! Matrícula: ${novaMatriculaID}. A equipe entrará em contato em breve. Acesse os documentos da turma pelo portal.`
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