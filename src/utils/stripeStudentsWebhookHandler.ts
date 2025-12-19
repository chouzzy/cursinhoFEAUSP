import { prisma } from "../prisma";
import Stripe from "stripe";
import { MailService } from "../services/MailService"; 

const mailService = new MailService();

export async function handleStudentCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  
  const { studentId, schoolClassID, txid } = session.metadata || {};

  console.log(`[DEBUG 1] Webhook Inscrição Iniciado. Dados: StudentID=${studentId}, ClassID=${schoolClassID}, TXID=${txid}`);

  if (!studentId || !schoolClassID || !txid) {
    console.warn(`[DEBUG ERROR] Metadata incompleto na sessão ${session.id}`);
    return;
  }

  try {
    // 1. Busca o estudante
    console.log(`[DEBUG 2] Buscando estudante ${studentId}...`);
    const student = await prisma.students.findUnique({
        where: { id: studentId }
    });

    if (!student) {
        console.error(`[DEBUG ERROR] Estudante não encontrado.`);
        return;
    }
    console.log(`[DEBUG 3] Estudante encontrado: ${student.name}`);

    // Encontra a inscrição específica
    const subscription = student.purcharsedSubscriptions.find(s => s.txid === txid);

    // *** CHECAGEM DE IDEMPOTÊNCIA MELHORADA ***
    // Só ignoramos se estiver TUDO pronto (Pagamento OK e Matrícula Gerada/Pix Status OK)
    // Se paymentStatus for CONCLUIDA mas pixStatus for PENDENTE, deixamos passar para corrigir.
    if (subscription?.paymentStatus === 'CONCLUIDA' && subscription?.pixStatus === 'CONCLUIDA') {
        console.log(`[DEBUG SKIP] Inscrição ${txid} já processada COMPLETAMENTE (Status e Pix OK).`);
        return;
    }

    // Debug para entender o estado inconsistente, se houver
    if (subscription?.paymentStatus === 'CONCLUIDA' && subscription?.pixStatus !== 'CONCLUIDA') {
        console.log(`[DEBUG FIX] Inscrição ${txid} está inconsistente (Payment=CONCLUIDA, Pix=${subscription.pixStatus}). Reprocessando para gerar matrícula...`);
    }
    
    if (!subscription) {
        console.warn(`[DEBUG WARNING] Subscrição com txid ${txid} não encontrada no array do aluno.`);
    }

    // 2. GERAÇÃO DE MATRÍCULA
    console.log(`[DEBUG 4] Iniciando geração de matrícula para turma ${schoolClassID}...`);
    let novaMatriculaID = null;
    let turma = null;
    
    try {
        console.log(`[DEBUG 4.1] Incrementando contador da turma...`);
        turma = await prisma.schoolClass.update({
            where: { id: schoolClassID },
            data: { registrationCounter: { increment: 1 } }
        });
        console.log(`[DEBUG 4.2] Turma atualizada. Contador: ${turma.registrationCounter}`);

        const ano = new Date().getFullYear();
        const codigoTurma = turma.code || 'GERAL';
        const sequencial = turma.registrationCounter.toString().padStart(4, '0');
        novaMatriculaID = `${ano}${codigoTurma}${sequencial}`;
        console.log(`[DEBUG 4.3] ID Gerado: ${novaMatriculaID}`);

    } catch (err: any) {
        console.error(`[DEBUG ERROR MATRICULA] Falha ao gerar matrícula: ${err.message}`);
        if (!turma) {
             console.log(`[DEBUG 4.4] Tentando buscar turma sem update (fallback)...`);
             turma = await prisma.schoolClass.findUnique({ where: { id: schoolClassID }});
        }
    }

    // 3. Atualiza o banco de dados
    console.log(`[DEBUG 5] Iniciando atualização do estudante (status CONCLUIDA)...`);
    const updateResult = await prisma.students.update({
        where: { id: studentId },
        data: {
            purcharsedSubscriptions: {
                updateMany: {
                    where: { txid: txid },
                    data: {
                        paymentStatus: 'CONCLUIDA',
                        pixStatus: 'CONCLUIDA', // Garante que ambos fiquem consistentes
                        matriculaID: novaMatriculaID,
                        paymentDate: new Date(),
                    }
                }
            }
        }
    });
    console.log(`[DEBUG 6] Estudante atualizado com sucesso. ID: ${updateResult.id}`);

    // 4. Envia o E-mail
    console.log(`[DEBUG 7] Preparando envio de e-mail...`);
    if (student.email) {
        let linksHtml = '';
        if (turma && turma.documents && turma.documents.length > 0) {
            linksHtml = `
              <div style="margin: 20px 0; padding: 15px; background-color: #f0f7ff; border-left: 4px solid #004aad; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #004aad;">Documentos Importantes</h3>
                <ul style="padding-left: 20px;">
                  ${turma.documents.map((doc: any) => 
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
            toEmail: student.email,
            toName: student.name,
            subject: 'Inscrição Confirmada - Cursinho FEA USP',
            htmlContent: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #00274c;">Inscrição Confirmada!</h1>
                    <p>Olá, <strong>${student.name}</strong>!</p>
                    <p>Seu pagamento via cartão foi aprovado e sua inscrição realizada com sucesso.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 25px 0; text-align: center; border: 1px solid #eee;">
                        <p style="margin: 0; font-size: 0.9em; color: #666; text-transform: uppercase;">Número de Matrícula</p>
                        <p style="margin: 5px 0 0 0; font-size: 2em; font-weight: bold; color: #00274c;">${novaMatriculaID || 'Em processamento'}</p>
                    </div>

                    ${linksHtml}
                    
                    <p>Fique atento ao seu e-mail para informações sobre as entrevistas.</p>
                    <br/>
                    <p>Atenciosamente,<br/><strong>Equipe Cursinho FEA USP</strong></p>
                </div>
            `,
            textContent: `Inscrição confirmada! Matrícula: ${novaMatriculaID}`
        });
        console.log(`[DEBUG 8] E-mail enviado.`);
    } else {
        console.log(`[DEBUG 8] E-mail não enviado (endereço não encontrado).`);
    }

  } catch (error) {
    console.error(`[DEBUG CRITICAL] Erro no handler:`, error);
    throw error;
  }
}