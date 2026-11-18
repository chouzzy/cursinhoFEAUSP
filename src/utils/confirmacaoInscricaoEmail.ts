import { documentosDoEmail, getLocationHtml } from './emailUtils'

const esc = (s?: string | null) => (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

type Doc = { title?: string | null; downloadLink?: string | null }

const ehEntrevista = (d: Doc) => (d.title ?? '').toLowerCase().includes('entrevista')

/**
 * E-mail de confirmação de inscrição com a identidade do Cursinho
 * (azul #2a255a, amarelo #FFD500, logo branco). HTML de e-mail: tabelas e
 * estilo inline, para funcionar no Gmail e no Outlook.
 */
export function buildConfirmacaoInscricaoHtml(params: {
    nome?: string | null
    turma?: { code?: string | null; title?: string | null; documents?: Doc[] | null } | null
    pedido?: string | null
}): string {
    const { nome, turma, pedido } = params
    const docs = documentosDoEmail(turma?.documents)
    const temPreEntrevista = docs.some(ehEntrevista)
    const titulo = esc(turma?.title) || 'Cursinho FEA USP'

    // Pré-Entrevista por último, logo antes do parágrafo que aponta para ela
    const ordenados = [...docs.filter(d => !ehEntrevista(d)), ...docs.filter(ehEntrevista)]

    const fonte = 'font-family:Arial,Helvetica,sans-serif;'
    const p = (html: string) => `<p style="margin:0 0 16px 0;${fonte}font-size:15px;line-height:1.6;color:#3b3a65;">${html}</p>`
    const rotulo = (t: string) => `<p style="margin:0 0 10px 0;${fonte}font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#219EBC;">${t}</p>`

    const docRow = (d: Doc) => {
        const destaque = ehEntrevista(d)
        return `
        <tr><td style="padding:0 0 10px 0;">
          <a href="${esc(d.downloadLink)}" target="_blank" style="display:block;text-decoration:none;background:${destaque ? '#FFD500' : '#ffffff'};border:1px solid ${destaque ? '#FFD500' : '#D9D6EC'};border-radius:10px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="padding:14px 16px;${fonte}font-size:15px;font-weight:bold;color:#2a255a;">${esc(d.title)}</td>
              <td align="right" style="padding:14px 16px;${fonte}font-size:13px;font-weight:bold;color:${destaque ? '#2a255a' : '#219EBC'};white-space:nowrap;">${destaque ? 'Agendar' : 'Abrir'} &rarr;</td>
            </tr></table>
          </a>
        </td></tr>`
    }

    return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Inscrição confirmada</title></head>
<body style="margin:0;padding:0;background:#F1F0F7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F1F0F7;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;">

  <tr><td align="center" style="background:#2a255a;padding:28px 24px 24px 24px;">
    <img src="https://www.cursinhofeausp.com.br/img/logo_branco.png" width="190" alt="Cursinho FEA USP" style="display:block;width:190px;max-width:70%;height:auto;border:0;color:#ffffff;${fonte}font-size:20px;font-weight:bold;">
  </td></tr>
  <tr><td style="background:#FFD500;height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>

  <tr><td style="padding:32px 32px 8px 32px;">
    <p style="margin:0 0 6px 0;${fonte}font-size:13px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#E76F51;">${titulo}</p>
    <h1 style="margin:0 0 20px 0;${fonte}font-size:28px;line-height:1.2;color:#2a255a;">Inscrição confirmada!</h1>
    ${p(`Olá, <strong>${esc(nome)}</strong>!`)}
    ${p(`Agradecemos pela sua inscrição no Processo Seletivo da nossa <strong>${titulo}</strong>! Para continuar sua candidatura, não se esqueça de ler com atenção o Manual do Candidato e o Termo de Inscrição que estarão disponíveis nos links abaixo.`)}
  </td></tr>

  <tr><td style="padding:8px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFF6D1;border:2px dashed #E9C46A;border-radius:12px;">
      <tr><td align="center" style="padding:18px;">
        <p style="margin:0;${fonte}font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#8a6d1f;">Número do pedido</p>
        <p style="margin:6px 0 0 0;font-family:'Courier New',Courier,monospace;font-size:28px;font-weight:bold;letter-spacing:2px;color:#2a255a;">${esc(pedido) || 'Em processamento'}</p>
      </td></tr>
    </table>
  </td></tr>
${ordenados.length ? `
  <tr><td style="padding:24px 32px 6px 32px;">
    ${rotulo('Documentos')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${ordenados.map(docRow).join('')}</table>
  </td></tr>` : ''}
${temPreEntrevista ? `
  <tr><td style="padding:6px 32px 0 32px;">
    ${p(`Além disso, você deve agora <strong>agendar a data e horário</strong> da sua entrevista socioeconômica pelo Formulário de Pré-Entrevista acima.`)}
  </td></tr>` : ''}

  <tr><td style="padding:10px 32px 8px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EAF5FA;border-radius:12px;">
      <tr><td style="padding:18px 20px;">
        ${rotulo('Local da entrevista')}
        <p style="margin:0;${fonte}font-size:15px;line-height:1.6;color:#034464;">${getLocationHtml(turma)}</p>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:16px 32px 28px 32px;">
    <p style="margin:0;${fonte}font-size:13px;line-height:1.5;color:#6b6a8a;">*Ao agendar a entrevista e concluir sua inscrição, você concorda com as condições descritas no Termo de Inscrição.</p>
  </td></tr>

  <tr><td align="center" style="background:#2a255a;padding:22px 24px;">
    <p style="margin:0 0 6px 0;${fonte}font-size:14px;color:#ffffff;">Atenciosamente, <strong>Equipe Cursinho FEA USP</strong></p>
    <a href="https://www.cursinhofeausp.com.br" target="_blank" style="${fonte}font-size:14px;font-weight:bold;color:#FFD500;text-decoration:none;">cursinhofeausp.com.br</a>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`
}
