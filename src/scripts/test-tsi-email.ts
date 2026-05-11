/**
 * Script de teste do e-mail de confirmação da TSI.
 * Renderiza e envia o template real para um endereço de teste,
 * sem alterar nenhum dado no banco.
 *
 * Uso: npx ts-node src/scripts/test-tsi-email.ts seu@email.com
 */
import { prisma } from '../prisma'
import { MailService } from '../services/MailService'
import { getLocationHtml } from '../utils/emailUtils'

async function main() {
    const destinatario = process.argv[2]
    if (!destinatario) {
        console.error('Uso: npx ts-node src/scripts/test-tsi-email.ts seu@email.com')
        process.exit(1)
    }

    const turma = await prisma.schoolClass.findFirst({
        where: { title: { contains: 'Intensiva', mode: 'insensitive' } },
        include: { documents: true },
        orderBy: { id: 'desc' },
    })

    if (!turma) {
        console.error('Turma de Semana Intensiva não encontrada no banco.')
        process.exit(1)
    }

    console.log(`Usando turma: "${turma.title}" (code: ${turma.code ?? '(vazio)'})`)
    console.log(`Documentos cadastrados: ${turma.documents.map(d => d.title).join(', ') || '(nenhum)'}`)

    const linksHtml = turma.documents.length > 0 ? `
        <div style="margin: 20px 0; padding: 15px; background-color: #f0f7ff; border-left: 4px solid #004aad; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #004aad;">Documentos Importantes</h3>
            <p style="margin-bottom: 10px;">Por favor, acesse e leia os documentos abaixo:</p>
            <ul style="padding-left: 20px;">
                ${turma.documents.map(doc => `
                    <li style="margin-bottom: 8px;">
                        <a href="${doc.downloadLink}" target="_blank" style="color: #004aad; text-decoration: none; font-weight: bold; font-size: 16px;">
                            ${doc.title}
                            <span style="font-size: 12px; color: #666;">(Clique para acessar)</span>
                        </a>
                    </li>`).join('')}
            </ul>
        </div>` : ''

    const matriculaFake = `${new Date().getFullYear()}${turma.code || 'GERAL'}TESTE`

    const mailService = new MailService()
    const ok = await mailService.sendEmail({
        toEmail: destinatario,
        toName: 'Aluno Teste',
        subject: `[TESTE] Inscrição Confirmada - Cursinho FEA USP`,
        htmlContent: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px; background-color: #ffffff;">
                <div style="text-align: center; border-bottom: 2px solid #f4c430; padding-bottom: 15px; margin-bottom: 20px;">
                    <h1 style="color: #00274c; margin: 0;">Inscrição Confirmada!</h1>
                </div>
                <p style="font-size: 16px;">Olá, <strong>Aluno Teste</strong>!</p>
                <p>Agradecemos pela sua inscrição no Processo Seletivo da nossa <strong>${turma.title}</strong>! Para continuar sua inscrição, não se esqueça de ler com atenção o Manual do Candidato, o Formulário de Pré-Entrevista e o Termo de Inscrição que estarão disponíveis nos links abaixo.</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 25px 0; text-align: center; border: 1px solid #eee;">
                    <p style="margin: 0; font-size: 0.9em; color: #666; text-transform: uppercase; letter-spacing: 1px;">Número de Matrícula</p>
                    <p style="margin: 5px 0 0 0; font-size: 2em; font-weight: bold; color: #00274c;">${matriculaFake}</p>
                </div>
                ${linksHtml}
                <div style="margin-top: 30px;">
                    <h3 style="color: #333;">Próximos Passos</h3>
                    <p>Fique tranquilo(a)! Nossa equipe de seleção entrará em contato em breve.</p>
                    <p>Fique atento ao seu <strong>e-mail</strong> e <strong>WhatsApp</strong> (caso tenha informado) para receber as datas das entrevistas e demais instruções.</p>
                    <div style="margin: 20px 0; padding: 15px; background-color: #f0f7ff; border-left: 4px solid #004aad; border-radius: 4px;">
                        <p style="margin: 0; font-size: 0.9em;">
                            <strong>Local de Entrevista:</strong><br><br>
                            ${getLocationHtml(turma)}
                        </p>
                    </div>
                    <p style="font-size: 0.9em; color: #666;">*Ao agendar a entrevista e concluir sua inscrição, você concorda com as condições descritas no Termo de Inscrição.</p>
                </div>
                <br />
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 0.9em; color: #888; text-align: center;">
                    Atenciosamente,<br/>
                    <strong>Equipe Cursinho FEA USP</strong>
                </p>
                <p style="font-size: 0.75em; color: #bbb; text-align: center; margin-top: 8px;">
                    ⚠️ Este é um e-mail de TESTE — nenhum dado foi alterado no banco.
                </p>
            </div>`,
        textContent: `[TESTE] Inscrição confirmada na ${turma.title}. Matrícula: ${matriculaFake}`,
    })

    if (ok) {
        console.log(`✓ E-mail de teste enviado para ${destinatario}`)
        console.log(`  Matrícula exibida: ${matriculaFake}`)
        console.log(`  Documentos exibidos: ${turma.documents.length}`)
        console.log(`  Local: ${turma.code?.toUpperCase().includes('TSI') ? 'FEA (TSI)' : 'FFLCH + FEA (padrão)'}`)
    } else {
        console.error('✗ Falha ao enviar e-mail. Verifique as variáveis de ambiente do MailerSend.')
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
