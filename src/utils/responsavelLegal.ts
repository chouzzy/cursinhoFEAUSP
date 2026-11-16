/**
 * Regras do responsável legal na inscrição.
 *
 * Aluno menor de 18 anos precisa informar nome completo e CPF do responsável.
 * Para maior de idade os campos são ignorados (gravados como null).
 */

class ResponsavelLegalError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ResponsavelLegalError'
    }
}

/**
 * Calcula a idade a partir da data de nascimento.
 * Aceita "AAAA-MM-DD" (input type=date do site) e "DD/MM/AAAA".
 * Devolve null quando a data não pode ser lida.
 */
function calcularIdade(birth: string | null | undefined, hoje: Date = new Date()): number | null {
    if (!birth) return null

    let ano: number, mes: number, dia: number
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(birth.trim())
    const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(birth.trim())

    if (iso) {
        ano = Number(iso[1]); mes = Number(iso[2]); dia = Number(iso[3])
    } else if (br) {
        dia = Number(br[1]); mes = Number(br[2]); ano = Number(br[3])
    } else {
        return null
    }

    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null

    let idade = hoje.getFullYear() - ano
    const mesAtual = hoje.getMonth() + 1
    if (mesAtual < mes || (mesAtual === mes && hoje.getDate() < dia)) {
        idade--
    }
    return idade
}

function isMenorDeIdade(birth: string | null | undefined): boolean {
    const idade = calcularIdade(birth)
    return idade !== null && idade < 18
}

/** Valida CPF pelos dígitos verificadores. Recebe com ou sem máscara. */
function isCpfValido(cpf: string | null | undefined): boolean {
    const digitos = (cpf ?? '').replace(/\D/g, '')
    if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) return false

    const calcularDigito = (base: string, pesoInicial: number) => {
        const soma = base
            .split('')
            .reduce((acc, d, i) => acc + Number(d) * (pesoInicial - i), 0)
        const resto = (soma * 10) % 11
        return resto === 10 ? 0 : resto
    }

    const d1 = calcularDigito(digitos.slice(0, 9), 10)
    const d2 = calcularDigito(digitos.slice(0, 10), 11)
    return d1 === Number(digitos[9]) && d2 === Number(digitos[10])
}

interface DadosResponsavel {
    birth?: string | null
    cpf?: string | null
    nomeResponsavel?: string | null
    cpfResponsavel?: string | null
}

interface ResponsavelNormalizado {
    nomeResponsavel: string | null
    cpfResponsavel: string | null
}

/**
 * Valida e normaliza os dados do responsável legal.
 * Menor de idade: exige nome completo e CPF válido (diferente do CPF do aluno).
 * Maior de idade: devolve os dois campos como null.
 * Lança ResponsavelLegalError com a mensagem para o usuário.
 */
function normalizarResponsavelLegal(dados: DadosResponsavel): ResponsavelNormalizado {
    if (!isMenorDeIdade(dados.birth)) {
        return { nomeResponsavel: null, cpfResponsavel: null }
    }

    const nome = (dados.nomeResponsavel ?? '').trim().replace(/\s+/g, ' ')
    const cpf = (dados.cpfResponsavel ?? '').replace(/\D/g, '')

    if (!nome || nome.split(' ').length < 2) {
        throw new ResponsavelLegalError('Para menores de 18 anos, informe o nome completo do responsável legal.')
    }

    if (!isCpfValido(cpf)) {
        throw new ResponsavelLegalError('Para menores de 18 anos, informe um CPF válido do responsável legal.')
    }

    if (cpf === (dados.cpf ?? '').replace(/\D/g, '')) {
        throw new ResponsavelLegalError('O CPF do responsável legal precisa ser diferente do CPF do aluno.')
    }

    return { nomeResponsavel: nome, cpfResponsavel: cpf }
}

export {
    ResponsavelLegalError,
    calcularIdade,
    isMenorDeIdade,
    isCpfValido,
    normalizarResponsavelLegal,
}
export type { ResponsavelNormalizado }
