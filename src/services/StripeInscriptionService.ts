
import { prisma } from "../prisma";
import { randomUUID } from 'crypto';
import { Students } from "@prisma/client";
import { stripe } from "../server";

// Tipo derivado do modelo
type InscriptionData = Omit<Students, 'id' | 'createdAt' | 'purcharsedSubscriptions' | 'stripeCustomerID' | 'name' | 'emailResponsavel' | 'aceiteTermoCiencia' | 'aceiteTermoInscricao'> & {
  schoolClassID: string;
  nome: string;
  sobrenome: string;
  aceiteTermoCiencia: boolean;
  aceiteTermoInscricao: boolean;
  emailResponsavel?: string;
  codigoDesconto?: string;
  // Campos extras removidos...
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
      // Extraímos os campos que NÃO vão para o modelo Students
      paymentMethod,
      price,
      value,
      interval,
      cycles,
      cpf, // <--- CORREÇÃO: Removemos 'cpf' do spread para não tentar atualizar o campo unique
      ...studentModelData 
    } = inscriptionData;

    const nomeCompleto = `${nome} ${sobrenome}`;
    const sanitizedCpf = inscriptionData.cpf.replace(/\D/g, ''); // Usamos o original para sanitizar

    // Buscar o preço real da turma no banco de dados
    const schoolClass = await prisma.schoolClass.findUnique({
        where: { id: schoolClassID }
    });

    if (!schoolClass) {
        throw new Error('Turma não encontrada.');
    }

    let basePrice = (schoolClass.registrations?.value || 0) / 100;
    if (basePrice <= 0) basePrice = 10.00;

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
      }
    }

    const customer = await this.findOrCreateCustomer(inscriptionData.email, nomeCompleto, sanitizedCpf);

    let studentId: string;
    
    // **CORREÇÃO: Busca apenas por CPF** para garantir unicidade correta
    let existingStudent = await prisma.students.findFirst({
        where: { cpf: sanitizedCpf }
    });

    const txid = `stripe_insc_${randomUUID()}`;

    if (existingStudent) {
        // Verifica se já existe inscrição CONCLUÍDA para esta turma
        const completedSubscription = existingStudent.purcharsedSubscriptions.find(
            sub => sub.schoolClassID === schoolClassID && sub.paymentStatus === 'CONCLUIDA'
        );

        if (completedSubscription) {
            throw new Error('Você já está inscrito e com o pagamento confirmado para esta turma.');
        }

        const updatedStudent = await prisma.students.update({
            where: { id: existingStudent.id },
            data: {
                ...studentModelData, // Agora limpo, sem CPF
                name: nomeCompleto,
                // cpf: sanitizedCpf, // CPF não precisa ser atualizado pois já foi encontrado por ele
                email: inscriptionData.email, // Atualiza email se mudou
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
                ...studentModelData, // Agora limpo, sem CPF
                name: nomeCompleto,
                cpf: sanitizedCpf, // CPF inserido explicitamente aqui na criação
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
      success_url: `${appUrl}/inscricoes/sucesso?session_id={CHECKOUT_SESSION_ID}`,
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