/**
 * Reenvia e-mails de confirmação para os 4 estudantes já corrigidos no banco.
 * Lida com .env que tem comentários inline (ex: VALUE="x" # comentário).
 *
 * Como rodar:
 *   npx ts-node-dev --transpile-only src/scripts/send-confirmation-emails.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

const prisma = new PrismaClient();

// Limpa aspas e comentários inline do valor do .env
function cleanEnvValue(value: string | undefined): string {
  if (!value) return '';
  return value.split('#')[0].replace(/['"]/g, '').trim();
}

const fromEmail = cleanEnvValue(process.env.MAIL_FROM_EMAIL) || 'no-reply@cursinhofeausp.com.br';
const fromName  = cleanEnvValue(process.env.MAIL_FROM_NAME)  || 'Cursinho FEA USP';
const apiKey    = cleanEnvValue(process.env.MAILERSEND_API_KEY);

console.log(`Sender configurado: "${fromEmail}" <${fromName}>`);
console.log(`MailerSend API Key: ${apiKey ? '*** (definida)' : '(VAZIA — verifique o .env)'}\n`);

const mailerSend = new MailerSend({ apiKey });
const sentFrom   = new Sender(fromEmail, fromName);

const TARGET_EMAILS = [
  'flaviabueno2022@gmail.com',       // Daniel Bueno Siqueira
  'giovanna.rochafaria09@gmail.com', // Giovanna Rocha da Silva Faria
  'nicollyggn@gmail.com',            // Nicolly Gonçalves Gabriel
  'raphaelasilvia679@gmail.com',     // Raphaela De Souza da Silva
];

function buildEmailHtml(
  studentName: string,
  matriculaID: string,
  documents: { title: string; downloadLink: string }[]
): string {
  let linksHtml = '';
  if (documents.length > 0) {
    linksHtml = `
      <div style="margin: 20px 0; padding: 15px; background-color: #f0f7ff; border-left: 4px solid #004aad; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #004aad;">Documentos Importantes</h3>
        <p style="margin-bottom: 10px;">Por favor, acesse e leia os documentos abaixo:</p>
        <ul style="padding-left: 20px;">
          ${documents.map(doc =>
            `<li style="margin-bottom: 8px;">
               <a href="${doc.downloadLink}" target="_blank"
                  style="color: #004aad; text-decoration: none; font-weight: bold; font-size: 16px;">
                 ${doc.title}
                 <span style="font-size: 12px; color: #666;">(Clique para acessar)</span>
               </a>
             </li>`
          ).join('')}
        </ul>
      </div>`;
  }

  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6;
                max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;
                border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #f4c430; padding-bottom: 15px; margin-bottom: 20px;">
        <h1 style="color: #00274c; margin: 0;">Inscrição Confirmada!</h1>
      </div>
      <p style="font-size: 16px;">Olá, <strong>${studentName}</strong>!</p>
      <p>Temos o prazer de confirmar que o seu pagamento foi recebido e sua inscrição no
         <strong>Cursinho FEA USP</strong> foi realizada com sucesso.</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 25px 0;
                  text-align: center; border: 1px solid #eee;">
        <p style="margin: 0; font-size: 0.9em; color: #666; text-transform: uppercase; letter-spacing: 1px;">
          Número de Matrícula
        </p>
        <p style="margin: 5px 0 0 0; font-size: 2em; font-weight: bold; color: #00274c;">
          ${matriculaID}
        </p>
      </div>
      ${linksHtml}
      <div style="margin-top: 30px;">
        <h3 style="color: #333;">Próximos Passos</h3>
        <p>Fique tranquilo(a)! Nossa equipe de seleção entrará em contato em breve.</p>
        <p>Fique atento ao seu <strong>e-mail</strong> e <strong>WhatsApp</strong>
           (caso tenha informado) para receber as datas das entrevistas e demais instruções.</p>
      </div>
      <br />
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 0.9em; color: #888; text-align: center;">
        Atenciosamente,<br/>
        <strong>Equipe Cursinho FEA USP</strong><br/>
        <a href="https://cursinhofeausp.com.br" style="color: #004aad; text-decoration: none;">
          cursinhofeausp.com.br
        </a>
      </p>
    </div>`;
}

async function main() {
  console.log('📧 Enviando e-mails de confirmação...\n');

  for (const email of TARGET_EMAILS) {
    console.log(`\nBuscando estudante: ${email}`);
    const student = await prisma.students.findFirst({ where: { email } });

    if (!student) {
      console.error(`  [ERRO] Não encontrado.`);
      continue;
    }

    // Pega a inscrição confirmada com matriculaID
    const confirmedSub = student.purcharsedSubscriptions.find(
      s => (s.paymentStatus === 'CONCLUIDA' || s.paymentStatus === 'CONCLUÍDA') && s.matriculaID
    );

    if (!confirmedSub || !confirmedSub.matriculaID) {
      console.error(`  [ERRO] Nenhuma inscrição CONCLUIDA com matrícula encontrada para ${student.name}.`);
      continue;
    }

    console.log(`  ${student.name} | matrícula: ${confirmedSub.matriculaID}`);

    // Busca documentos da turma
    const turma = await prisma.schoolClass.findUnique({
      where: { id: confirmedSub.schoolClassID },
      include: { documents: true },
    });
    const documents = (turma?.documents ?? []) as { title: string; downloadLink: string }[];

    // Envia email diretamente com MailerSend (sem passar pelo MailService que lê env sem limpar)
    try {
      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo([new Recipient(student.email, student.name)])
        .setSubject('Inscrição Confirmada - Cursinho FEA USP')
        .setHtml(buildEmailHtml(student.name, confirmedSub.matriculaID, documents))
        .setText(`Olá ${student.name}, sua inscrição foi confirmada! Matrícula: ${confirmedSub.matriculaID}.`);

      const response = await mailerSend.email.send(emailParams);
      console.log(`  ✓ E-mail enviado! MessageId: ${response?.headers?.['x-message-id'] || 'ok'}`);
    } catch (err: any) {
      console.error(`  [ERRO] Falha ao enviar:`, err?.body || err?.message || err);
    }
  }

  console.log('\n✅ Concluído.');
  await prisma.$disconnect();
}

main().catch(async err => {
  console.error('[FATAL]', err);
  await prisma.$disconnect();
  process.exit(1);
});
