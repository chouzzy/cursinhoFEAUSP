import { prisma } from "../prisma";
import { MailService } from "./MailService";

const mailService = new MailService();

export class AutomationService {

  /**
   * Verifica doadores que fazem aniversário de doação hoje e envia e-mail.
   * Deve rodar diariamente (ex: 09:00).
   */
  async sendDonationAnniversaries() {
    console.log("[Job] Iniciando verificação de aniversário de doação...");
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    // Busca todas as doações concluídas
    // (Otimização futura: filtrar no banco se possível, mas em JS é mais flexível para datas)
    const donations = await prisma.donations.findMany({
      where: {
        paymentStatus: 'CONCLUIDA',
        email: { not: undefined } // Garante que tem email
      }
    });

    let count = 0;

    for (const donation of donations) {
      if (!donation.createdAt || !donation.email) continue;

      const donationDate = new Date(donation.createdAt);
      
      // Verifica se é o mesmo dia e mês de hoje, mas ano diferente
      if (
        donationDate.getMonth() === currentMonth && 
        donationDate.getDate() === currentDay &&
        donationDate.getFullYear() !== today.getFullYear()
      ) {
        const years = today.getFullYear() - donationDate.getFullYear();
        
        console.log(`[Job] Enviando parabéns de ${years} ano(s) para ${donation.name}`);
        
        await mailService.sendEmail({
            toEmail: donation.email,
            toName: donation.name,
            subject: `🎉 Parabéns! ${years} ano(s) transformando vidas!`,
            htmlContent: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; text-align: center;">
                    <h1 style="color: #004aad;">Hoje é um dia especial!</h1>
                    <p>Olá, <strong>${donation.name}</strong>!</p>
                    <p>Há exatamente <strong>${years} ano(s)</strong>, você fez sua primeira doação para o Cursinho FEA USP.</p>
                    <p>Graças a pessoas incríveis como você, continuamos mudando a realidade de centenas de estudantes.</p>
                    <br/>
                    <p>Nosso muito obrigado por estar conosco nessa jornada!</p>
                    <br/>
                    <p style="font-size: 0.9em; color: #666;">Com carinho,<br/>Equipe Cursinho FEA USP</p>
                </div>
            `,
            textContent: `Parabéns ${donation.name}! Hoje completa ${years} anos que você apoia o Cursinho FEA USP. Muito obrigado!`
        });
        count++;
      }
    }
    console.log(`[Job] Aniversários de doação enviados: ${count}`);
  }

  /**
   * Envia a prestação de contas mensal para todos os doadores ativos.
   * Deve rodar uma vez por mês (ex: dia 5).
   */
  async sendMonthlyReport() {
      // Esta lógica geralmente depende de um conteúdo dinâmico (o relatório do mês).
      // Pode ser configurada para pegar um template ou apenas enviar um aviso fixo.
      // Por enquanto, deixamos o placeholder.
      console.log("[Job] Placeholder: Envio de prestação de contas.");
  }
}