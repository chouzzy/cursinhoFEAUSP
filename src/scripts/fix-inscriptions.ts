/**
 * Script para corrigir inscrições com pagamento não processado.
 * Cada entrada usa email + txid específico para máxima precisão.
 *
 * Como rodar (na raiz de cursinhoFEAUSP):
 *   npx ts-node-dev --transpile-only src/scripts/fix-inscriptions.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { MailService } from '../services/MailService';

const prisma = new PrismaClient();
const mailService = new MailService();

// ─── Casos a corrigir ─────────────────────────────────────────────────────────

interface Task {
  label: string;
  email: string;
  /** txid da inscrição alvo */
  txid: string;
  /**
   * confirm           → PENDENTE, precisa de tudo (status + matrícula + email)
   * matricula_email   → já CONCLUIDA (qualquer grafia), falta matrícula + email
   */
  mode: 'confirm' | 'matricula_email';
}

const TASKS: Task[] = [
  // Confirmação de pagamento (PENDENTE → CONCLUIDA + matrícula + email)
  {
    label: 'Daniel Bueno Siqueira',
    email: 'flaviabueno2022@gmail.com',
    txid: 'inscf09ceecfa8150f3b9447bb8d1657', // sub mais recente (sub[1])
    mode: 'confirm',
  },
  {
    label: 'Giovanna Rocha da Silva Faria',
    email: 'giovanna.rochafaria09@gmail.com',
    txid: 'insc6318c742d0b496a796fee26ab12b',
    mode: 'confirm',
  },
  // Já confirmados manualmente — apenas matrícula + email
  {
    label: 'Nicolly Gonçalves Gabriel',
    email: 'nicollyggn@gmail.com',
    txid: 'insc46cbd076f0f9c7c450d8d418ef87', // sub[2] status="CONCLUÍDA"
    mode: 'matricula_email',
  },
  {
    label: 'Raphaela De Souza da Silva',
    email: 'raphaelasilvia679@gmail.com',
    txid: 'inscb822311cc66bdd0e9e14a00fb113', // sub[2] status="CONCLUIDA"
    mode: 'matricula_email',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildEmailHtml(
  studentName: string,
  matriculaID: string | null,
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
          ${matriculaID || 'Em processamento'}
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

// ─── Lógica principal ─────────────────────────────────────────────────────────

async function processTask(task: Task) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processando: ${task.label} (modo: ${task.mode})`);
  console.log('='.repeat(60));

  // 1. Encontra o estudante pelo email
  const student = await prisma.students.findFirst({
    where: { email: task.email },
  });

  if (!student) {
    console.error(`  [ERRO] Estudante com email "${task.email}" não encontrado.`);
    return;
  }
  console.log(`  Encontrado: ${student.name} | id: ${student.id}`);

  // 2. Localiza a inscrição alvo pelo txid
  const targetSub = student.purcharsedSubscriptions.find(s => s.txid === task.txid);
  if (!targetSub) {
    console.error(`  [ERRO] Inscrição com txid "${task.txid}" não encontrada para este estudante.`);
    return;
  }

  console.log(`  Inscrição: turma=${targetSub.schoolClassID} | status=${JSON.stringify(targetSub.paymentStatus)} | matricula=${targetSub.matriculaID ?? 'N/A'}`);

  // 3. Validações de estado
  const isConcluida = targetSub.paymentStatus === 'CONCLUIDA' || targetSub.paymentStatus === 'CONCLUÍDA';

  if (task.mode === 'confirm' && isConcluida) {
    console.log(`  ↳ Já está CONCLUIDA. Verificando se precisa de matrícula/email...`);
    if (targetSub.matriculaID) {
      console.log(`  ✓ Já tem matrícula (${targetSub.matriculaID}) e já foi processada. Nada a fazer.`);
      return;
    }
    // Tem CONCLUIDA mas sem matriculaID — cai no fluxo de matricula_email
  }

  if (task.mode === 'confirm' && !isConcluida && targetSub.paymentStatus !== 'PENDENTE') {
    console.log(`  [AVISO] Status inesperado: ${targetSub.paymentStatus}. Prosseguindo com confirmação.`);
  }

  // 4. Gera matrícula
  let matriculaID = targetSub.matriculaID;
  let documents: { title: string; downloadLink: string }[] = [];

  if (!matriculaID) {
    console.log(`  → Gerando ID de matrícula...`);
    const turma = await prisma.schoolClass.update({
      where: { id: targetSub.schoolClassID },
      data: { registrationCounter: { increment: 1 } },
      include: { documents: true },
    });
    const ano = new Date().getFullYear();
    const codigoTurma = turma.code || 'GERAL';
    const sequencial = turma.registrationCounter.toString().padStart(4, '0');
    matriculaID = `${ano}${codigoTurma}${sequencial}`;
    documents = turma.documents as { title: string; downloadLink: string }[];
    console.log(`  ✓ Matrícula: ${matriculaID} (turma: ${turma.title}, contador: ${turma.registrationCounter})`);
  } else {
    console.log(`  ↳ Matrícula já existe: ${matriculaID}. Buscando documentos...`);
    const turma = await prisma.schoolClass.findUnique({
      where: { id: targetSub.schoolClassID },
      include: { documents: true },
    });
    documents = (turma?.documents ?? []) as { title: string; downloadLink: string }[];
  }

  // 5. Atualiza o banco
  const updateData: Record<string, any> = { matriculaID };
  if (task.mode === 'confirm') {
    updateData.paymentStatus = 'CONCLUIDA';
    updateData.pixStatus = 'CONCLUIDA';
    updateData.pixDate = new Date().toISOString();
  }

  await prisma.students.update({
    where: { id: student.id },
    data: {
      purcharsedSubscriptions: {
        updateMany: {
          where: { txid: task.txid },
          data: updateData,
        },
      },
    },
  });

  const statusLog = task.mode === 'confirm'
    ? 'paymentStatus=CONCLUIDA, pixStatus=CONCLUIDA'
    : 'status mantido (apenas matriculaID adicionado)';
  console.log(`  ✓ Banco atualizado: ${statusLog} | matriculaID=${matriculaID}`);

  // 6. Envia e-mail
  console.log(`  → Enviando e-mail para ${student.email}...`);
  const sent = await mailService.sendEmail({
    toEmail: student.email,
    toName: student.name,
    subject: 'Inscrição Confirmada - Cursinho FEA USP',
    htmlContent: buildEmailHtml(student.name, matriculaID, documents),
    textContent: `Olá ${student.name}, sua inscrição foi confirmada! Matrícula: ${matriculaID}. Fique atento ao seu e-mail e WhatsApp para próximas etapas.`,
  });

  if (sent) {
    console.log(`  ✓ E-mail enviado com sucesso.`);
  } else {
    console.error(`  [ERRO] Falha ao enviar e-mail. Verifique logs do MailService.`);
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔧 Iniciando correção de inscrições...\n');
  for (const task of TASKS) {
    await processTask(task);
  }
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Script finalizado.');
  console.log('='.repeat(60));
  await prisma.$disconnect();
}

main().catch(async err => {
  console.error('\n[FATAL]', err);
  await prisma.$disconnect();
  process.exit(1);
});
