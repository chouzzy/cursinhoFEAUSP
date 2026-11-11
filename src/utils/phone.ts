/**
 * Celular no padrão único do cadastro: só dígitos, DDD + número (10 ou 11 dígitos),
 * sem +55, parênteses, espaço ou traço. Ex.: 11987654321
 */
export const PHONE_REGEX = /^\d{10,11}$/;

export const PHONE_ERROR_MESSAGE =
    'Celular inválido. Digite só os números com DDD, sem +55, parênteses, espaço ou traço. Ex.: 11987654321';

export function isValidPhone(phone: unknown): boolean {
    return typeof phone === 'string' && PHONE_REGEX.test(phone);
}
