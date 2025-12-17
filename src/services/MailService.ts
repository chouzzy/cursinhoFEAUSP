import { MailerSend, EmailParams, Sender, Recipient, Attachment } from "mailersend";
import fs from 'fs';
import path from 'path';

// Configuração inicial
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || '',
});

const sentFrom = new Sender(
  process.env.MAIL_FROM_EMAIL || 'no-reply@trial-3yxj6lj90x5ldo2r.mlsender.net', // Use o domínio de teste se ainda não validou o seu
  process.env.MAIL_FROM_NAME || 'Cursinho FEA USP'
);

interface SendEmailProps {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  attachments?: {
    filename: string;
    path: string; // Caminho local do arquivo no servidor
  }[];
}

export class MailService {

  /**
   * Envia um e-mail transacional usando MailerSend.
   */
  async sendEmail({ toEmail, toName, subject, htmlContent, textContent, attachments }: SendEmailProps) {
    try {
      const recipients = [
        new Recipient(toEmail, toName)
      ];

      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject(subject)
        .setHtml(htmlContent)
        .setText(textContent || 'Este e-mail contém conteúdo HTML. Por favor, habilite a visualização.');

      // Processamento de anexos (se houver)
      if (attachments && attachments.length > 0) {
        const emailAttachments = attachments.map(att => {
            // Lê o arquivo e converte para base64
            const content = fs.readFileSync(att.path).toString('base64');
            
            return new Attachment(
               content,
               att.filename,
               'attachment'
            );
        });
        
        emailParams.setAttachments(emailAttachments);
      }

      const response = await mailerSend.email.send(emailParams);
      
      console.log(`E-mail enviado para ${toEmail}. Status ID: ${response?.headers?.['x-message-id'] || 'ok'}`);
      return true;

    } catch (error: any) {
      console.error('Erro ao enviar e-mail:', error.body || error.message);
      // Não lançamos erro para não quebrar o fluxo principal (ex: inscrição), 
      // mas logamos para monitoramento.
      return false; 
    }
  }
}