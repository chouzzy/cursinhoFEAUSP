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
}

export class AsaasService {

    async createPaymentSession(data: CreatePaymentData) {
        const customerId = await this.findOrCreateCustomer(data);
        const txid = `asaas_${randomUUID()}`;
        const valueInReais = data.value / 100;

        let paymentUrl = '';
        let asaasSubscriptionId: string | null = null;

        if (data.interval === 'one_time') {
            const payload = {
                customer: customerId,
                billingType: 'UNDEFINED',
                value: valueInReais,
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
                value: valueInReais,
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
                    valuePaid: valueInReais,
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
                    valueBought: valueInReais * (data.interval === 'month' ? (data.cycles || 1) : 1),
                    stripeCustomerID: customerId,
                    stripeSubscriptionID: asaasSubscriptionId
                }
            });
            donationId = donation.id;
        } else if (data.type === 'inscription' && data.schoolClassID) {
            // Lógica para Students (Inscrição)
            const sanitizedCpf = data.cpf.replace(/\D/g, '');

            // Verifica se aluno já existe pelo CPF
            let existingStudent = await prisma.students.findFirst({
                where: { cpf: sanitizedCpf }
            });

            const studentDataToSave = {
                name: data.name, // Nome já vem completo do controller
                email: data.email,
                cpf: sanitizedCpf,
                phoneNumber: data.phone,
                rg: data.rg, ufrg: data.ufrg || '', gender: data.gender || '', birth: data.birth || '',
                isPhoneWhatsapp: data.isPhoneWhatsapp || false,
                zipCode: data.zipCode || '', street: data.street || '', homeNumber: data.homeNumber || '',
                complement: data.complement, district: data.district || '', city: data.city || '', state: data.state || '',

                // Campos específicos de estudante
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
                valuePaid: valueInReais,
                pixCopiaECola: `asaas_na_${randomUUID()}`,
                pixQrCode: `asaas_na_${randomUUID()}`,
            };

            if (existingStudent) {
                // Verifica duplicidade de pagamento concluído
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
                        stripeCustomerID: customerId, // Atualiza ID do Asaas se mudou
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

    // 1. E-mail de Doação (Sucesso)
    async sendDonationSuccessEmail(donationId: string) {
        const donation = await prisma.donations.findUnique({ where: { id: donationId } });
        if (!donation || !donation.email) return;

        const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(donation.valuePaid);
        const isRecurring = donation.ciclesBought !== 1;
        const title = isRecurring ? 'Doação Mensal Confirmada' : 'Doação Recebida';
        const message = isRecurring
            ? 'Obrigado por continuar apoiando nosso sonho mensalmente.'
            : 'Sua generosidade faz toda a diferença.';

        await mailService.sendEmail({
            toEmail: donation.email,
            toName: donation.name,
            subject: isRecurring ? 'Sua doação mensal foi confirmada! 🎉' : 'Obrigado pela sua doação! 💙',
            htmlContent: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h1 style="color: #00274c; text-align: center;">${title}!</h1>
                <p>Olá, <strong>${donation.name}</strong>!</p>
                <p>Recebemos a confirmação da sua doação no valor de <strong>${formattedValue}</strong>.</p>
                <p>${message}</p>
                <div style="background-color: #f0f7ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #004aad;">
                   <p style="margin:0">Obrigado por apoiar o Cursinho FEA USP.</p>
                </div>
                <p style="font-size: 0.9em; color: #888; text-align: center;">Equipe Cursinho FEA USP</p>
            </div>
        `,
            textContent: `Olá ${donation.name}, recebemos sua doação de ${formattedValue}. Obrigado!`
        });
    }

    // 2. E-mail de Inscrição (Sucesso + Matrícula + Docs)
    async sendInscriptionSuccessEmail(studentId: string, matriculaID: string, schoolClassId: string) {
        const student = await prisma.students.findUnique({ where: { id: studentId } });
        const turma = await prisma.schoolClass.findUnique({ where: { id: schoolClassId }, include: { documents: true } });

        if (!student || !student.email) return;

        // Constrói lista de documentos
        let linksHtml = '';
        if (turma && turma.documents && turma.documents.length > 0) {
            linksHtml = `
          <div style="margin: 20px 0; padding: 15px; background-color: #f0f7ff; border-left: 4px solid #004aad; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #004aad;">Documentos Importantes</h3>
            <ul style="padding-left: 20px;">
              ${turma.documents.map((doc: any) =>
                `<li style="margin-bottom: 8px;">
                   <a href="${doc.downloadLink}" target="_blank" style="color: #004aad; text-decoration: none; font-weight: bold;">
                     ${doc.title}
                   </a>
                 </li>`
            ).join('')}
            </ul>
          </div>
        `;
        }

        await mailService.sendEmail({
            toEmail: student.email,
            toName: student.name,
            subject: 'Inscrição Confirmada - Cursinho FEA USP',
            htmlContent: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
                <h1 style="color: #00274c; text-align: center;">Inscrição Confirmada!</h1>
                <p>Olá, <strong>${student.name}</strong>!</p>
                <p>Seu pagamento foi aprovado e sua inscrição realizada com sucesso.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 25px 0; text-align: center; border: 1px solid #eee;">
                    <p style="margin: 0; font-size: 0.9em; color: #666; text-transform: uppercase;">Número de Pedido</p>
                    <p style="margin: 5px 0 0 0; font-size: 2em; font-weight: bold; color: #00274c;">${matriculaID}</p>
                </div>

                ${linksHtml}
                
                <p>Fique atento ao seu e-mail para informações sobre as entrevistas.</p>
                <br/>
                <p style="text-align: center; color: #888; font-size: 0.9em;">Equipe Cursinho FEA USP</p>
            </div>
        `,
            textContent: `Inscrição confirmada! Matrícula: ${matriculaID}`
        });
    }


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
                                <tr>
                                    <td align="center" style="padding: 40px 0 30px 0; background-color: #00274c;">
                                        <h1 style="color: #f4c430; font-size: 28px; margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Cursinho FEA USP</h1>
                                    </td>
                                </tr>
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

    // **MÉTODO ATUALIZADO: Retorna nome e lista de assinaturas**
    async listSubscriptions(email: string) {
        const donations = await prisma.donations.findMany({
            where: {
                email: email,
                paymentMethod: 'asaas_checkout',
                stripeSubscriptionID: { not: null }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Pega o nome do usuário da primeira doação encontrada
        const userName = donations.length > 0 ? donations[0].name : '';

        const details = await Promise.all(donations.map(async (donation) => {
            try {
                const response = await asaas.get(`/subscriptions/${donation.stripeSubscriptionID}`);
                const sub = response.data;
                return {
                    id: donation.id,
                    externalId: sub.id,
                    status: sub.status,
                    value: sub.value,
                    nextDueDate: sub.nextDueDate,
                    description: sub.description || donation.name
                };
            } catch (error) {
                return null;
            }
        }));

        return {
            userName: userName, // Retornamos o nome aqui
            subscriptions: details.filter(i => i !== null)
        };
    }

    async cancelSubscription(donationId: string, userEmail: string) {
        const donation = await prisma.donations.findUnique({ where: { id: donationId } });

        if (!donation || donation.email !== userEmail) throw new Error('Permissão negada.');
        if (!donation.stripeSubscriptionID) throw new Error('Assinatura não encontrada.');

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