/**
 * Retorna o bloco HTML do local de entrevista para o e-mail de confirmação,
 * de acordo com o código/título da turma.
 */
export function getLocationHtml(turma?: { code?: string | null; title?: string | null } | null): string {
    const code  = turma?.code?.toUpperCase()  ?? ''
    const title = turma?.title?.toLowerCase() ?? ''
    const isTSI = code.includes('TSI') || title.includes('intensiva')

    if (isTSI) {
        return `
            Faculdade de Economia Administração e Contabilidade<br>
            Av. Prof. Luciano Gualberto 908 - Butantã, São Paulo - SP, 05508-010
        `
    }

    // Padrão TSM (e qualquer outra turma sem regra específica)
    return `
        <strong>Entrevistas dia 04/04:</strong><br>
        Edifício Prof. Antonio Candido (Letras) - FFLCH-USP<br>
        Av. Prof. Luciano Gualberto, 298-460 - Butantã, São Paulo - SP, 05508-010<br><br>
        <strong>Entrevistas dias 11/04:</strong><br>
        Faculdade de Economia Administração e Contabilidade<br>
        Av. Prof. Luciano Gualberto 908 - Butantã, São Paulo - SP, 05508-010
    `
}
