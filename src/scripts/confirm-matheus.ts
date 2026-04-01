import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

const prisma = new PrismaClient();

function cleanEnv(value: string | undefined) {
  return (value || '').split('#')[0].replace(/['"]/g, '').trim();
}

const fromEmail = cleanEnv(process.env.MAIL_FROM_EMAIL);
const fromName  = cleanEnv(process.env.MAIL_FROM_NAME) || 'Cursinho FEA USP';
const mailerSend = new MailerSend({ apiKey: cleanEnv(process.env.MAILERSEND_API_KEY) });

async function main() {
  const studentId = '6a473122-719e-438b-bdb9-b74261030719';
  // Inscrição mais recente (20:56)
  const txid = 'inscfadb94e9e5f02530df712c68a88f';

  const student = await prisma.students.findUnique({ where: { id: studentId } });
  if (!student) { console.error('Aluno não encontrado'); return; }

  const sub = student.purcharsedSubscriptions.find(s => s.txid === txid);
  if (!sub) { console.error('Inscrição não encontrada'); return; }

  console.log(`Aluno: ${student.name} | email: ${student.email}`);
  console.log(`Inscrição: turma=${sub.schoolClassID} | status=${sub.paymentStatus}`);

  // Gera matrícula
  const turma = await prisma.schoolClass.update({
    where: { id: sub.schoolClassID },
    data: { registrationCounter: { increment: 1 } },
    include: { documents: true },
  });

  const ano = new Date().getFullYear();
  const codigoTurma = turma.code || 'GERAL';
  const sequencial = turma.registrationCounter.toString().padStart(4, '0');
  const matriculaID = `${ano}${codigoTurma}${sequencial}`;
  console.log(`Matrícula gerada: ${matriculaID} (turma: ${turma.title}, contador: ${turma.registrationCounter})`);

  // Atualiza banco
  await prisma.students.update({
    where: { id: student.id },
    data: {
      purcharsedSubscriptions: {
        updateMany: {
          where: { txid },
          data: { paymentStatus: 'CONCLUIDA', pixStatus: 'CONCLUIDA', matriculaID, pixDate: new Date().toISOString() },
        },
      },
    },
  });
  console.log('✓ Banco atualizado');

  // Documentos
  const documents = (turma.documents || []) as { title: string; downloadLink: string }[];
  let linksHtml = '';
  if (documents.length > 0) {
    linksHtml = `<div style="margin:20px 0;padding:15px;background:#f0f7ff;border-left:4px solid #004aad;border-radius:4px"><h3 style="margin-top:0;color:#004aad">Documentos Importantes</h3><ul>${documents.map(d => `<li><a href="${d.downloadLink}" style="color:#004aad;font-weight:bold">${d.title}</a></li>`).join('')}</ul></div>`;
  }

  // Envia email
  const emailParams = new EmailParams()
    .setFrom(new Sender(fromEmail, fromName))
    .setTo([new Recipient(student.email, student.name)])
    .setSubject('Inscrição Confirmada - Cursinho FEA USP')
    .setHtml(`<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:8px"><div style="text-align:center;border-bottom:2px solid #f4c430;padding-bottom:15px;margin-bottom:20px"><h1 style="color:#00274c;margin:0">Inscrição Confirmada!</h1></div><p>Olá, <strong>${student.name}</strong>!</p><p>Seu pagamento foi recebido e sua inscrição no <strong>Cursinho FEA USP</strong> foi realizada com sucesso.</p><div style="background:#f9f9f9;padding:15px;border-radius:5px;margin:25px 0;text-align:center;border:1px solid #eee"><p style="margin:0;font-size:.9em;color:#666;text-transform:uppercase">Número de Matrícula</p><p style="margin:5px 0 0;font-size:2em;font-weight:bold;color:#00274c">${matriculaID}</p></div>${linksHtml}<p>Fique atento ao seu e-mail e WhatsApp para as próximas etapas.</p><hr style="border:0;border-top:1px solid #eee;margin:20px 0"><p style="font-size:.9em;color:#888;text-align:center">Atenciosamente,<br><strong>Equipe Cursinho FEA USP</strong></p></div>`)
    .setText(`Olá ${student.name}, inscrição confirmada! Matrícula: ${matriculaID}.`);

  const resp = await mailerSend.email.send(emailParams);
  console.log(`✓ E-mail enviado! MessageId: ${resp?.headers?.['x-message-id'] || 'ok'}`);

  await prisma.$disconnect();
}

main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1); });
