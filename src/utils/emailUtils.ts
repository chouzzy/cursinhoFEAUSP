/**
 * Retorna o bloco HTML do local de entrevista para o e-mail de confirmação,
 * de acordo com o código/título da turma.
 *
 * Só TSI e TSM têm local definido; as demais turmas (ex.: TSE/TSA 2027)
 * recebem "a ser confirmado por e-mail".
 */
export function getLocationHtml(turma?: { code?: string | null; title?: string | null } | null): string {
    const code  = turma?.code?.toUpperCase()  ?? ''
    const title = turma?.title?.toLowerCase() ?? ''
    const isTSI = code.includes('TSI') || title.includes('intensiva')
    const isTSM = code.includes('TSM') || title.includes('maio')

    if (isTSI) {
        return `
            Faculdade de Economia Administração e Contabilidade<br>
            Av. Prof. Luciano Gualberto 908 - Butantã, São Paulo - SP, 05508-010
        `
    }

    if (isTSM) {
        return `
        <strong>Entrevistas dia 04/04:</strong><br>
        Edifício Prof. Antonio Candido (Letras) - FFLCH-USP<br>
        Av. Prof. Luciano Gualberto, 298-460 - Butantã, São Paulo - SP, 05508-010<br><br>
        <strong>Entrevistas dias 11/04:</strong><br>
        Faculdade de Economia Administração e Contabilidade<br>
        Av. Prof. Luciano Gualberto 908 - Butantã, São Paulo - SP, 05508-010
    `
    }

    return 'A ser confirmado por e-mail.'
}

/** Parágrafo de abertura do e-mail de confirmação de inscrição. */
export function getIntroHtml(turmaTitle?: string | null): string {
    return `<p>Agradecemos pela sua inscrição no Processo Seletivo da nossa <strong>${turmaTitle || 'Cursinho FEA USP'}</strong>! Para continuar sua candidatura, não se esqueça de ler com atenção o Manual do Candidato e o Termo de Inscrição que estarão disponíveis nos links abaixo.</p>`
}

/**
 * Parágrafo que vai logo depois da caixa de links. Só aparece se a turma tiver
 * o Formulário de Pré-Entrevista entre os documentos (o texto aponta para ele "acima").
 */
export function getAgendamentoHtml(documents?: { title?: string | null }[] | null): string {
    const temPreEntrevista = (documents ?? []).some(d => d.title?.toLowerCase().includes('entrevista'))
    if (!temPreEntrevista) return ''
    return `<p>Além disso, você deve agora <strong>agendar a data e horário</strong> da sua entrevista socioeconômica pelo Formulário de Pré-Entrevista acima.</p>`
}

/** Nota de rodapé sobre o Termo de Inscrição. */
export const TERMO_NOTA_HTML = `<p style="font-size: 0.9em; color: #666;">*Ao agendar a entrevista e concluir sua inscrição, você concorda com as condições descritas no Termo de Inscrição.</p>`
