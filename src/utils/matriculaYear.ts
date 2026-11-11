/**
 * Ano usado no ID de matrícula (ex.: 2027TSA0001).
 * Usa o ano escrito no título da turma ("Turma de Sábado 2027"), para que uma
 * turma de 2027 paga em 2026 não receba o prefixo 2026 nem colida com os IDs
 * da turma do ano anterior que usa o mesmo código. Sem ano no título, cai no ano atual.
 */
export function anoDaTurma(title?: string | null): number {
    const match = (title || '').match(/\b(20\d{2})\b/);
    return match ? Number(match[1]) : new Date().getFullYear();
}
