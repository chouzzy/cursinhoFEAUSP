import { NextFunction, Request, Response } from "express";

/**
 * Limite simples de requisições por IP, em memória (o backend roda em um processo só).
 * Pensado para o Processo Seletivo: segura robô e clique repetido nas rotas que criam
 * cobrança, mandam e-mail ou fazem login, sem atrapalhar quem está se inscrevendo.
 *
 * Variáveis (todas opcionais):
 *   RATE_LIMIT_DISABLED=true          desliga tudo
 *   RATE_LIMIT_WINDOW_MINUTES=10      tamanho da janela
 *   RATE_LIMIT_MAX_WRITES=60          POSTs públicos por IP na janela
 *   RATE_LIMIT_MAX_LOGIN=20           tentativas de login por IP na janela
 *
 * O limite é generoso de propósito: escola com laboratório sai por um IP só.
 */

type Bucket = { count: number; resetAt: number };

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MINUTES || 10) * 60 * 1000;
const MAX_WRITES = Number(process.env.RATE_LIMIT_MAX_WRITES || 60);
const MAX_LOGIN = Number(process.env.RATE_LIMIT_MAX_LOGIN || 20);

// Rotas públicas que criam cobrança, registro ou disparam e-mail.
const PUBLIC_WRITE_PATHS = [
    '/inscriptions',
    '/inscriptions/checkout',
    '/students/create',
    '/students/pix',
    '/donates/create',
    '/donates/pix',
    '/donates/checkout',
    '/donates/portal',
    '/donates/portal/cancel',
];
const LOGIN_PATHS = ['/admins/login'];

const buckets = new Map<string, Bucket>();

// Limpeza periódica para o Map não crescer sem fim.
setInterval(() => {
    const now = Date.now();
    buckets.forEach((b, k) => { if (b.resetAt <= now) buckets.delete(k); });
}, 60 * 1000).unref();

function clientIp(req: Request): string | null {
    const forwarded = req.headers['x-forwarded-for'];
    // Último item: é o IP que o nginx viu ($proxy_add_x_forwarded_for acrescenta no fim).
    // O primeiro pode ser inventado pelo próprio cliente.
    const list = (Array.isArray(forwarded) ? forwarded.join(',') : forwarded || '').split(',').map(s => s.trim()).filter(Boolean);
    if (list.length) return list[list.length - 1];
    const ip = req.socket.remoteAddress || '';
    // Atrás do nginx sem X-Forwarded-For, todo mundo chega como 127.0.0.1.
    // Nesse caso não limitamos, para não bloquear todos os candidatos de uma vez.
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') return null;
    return ip;
}

function normalizePath(path: string) {
    return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

export function publicRateLimit(req: Request, res: Response, next: NextFunction) {
    if (process.env.RATE_LIMIT_DISABLED === 'true' || req.method !== 'POST') return next();

    const path = normalizePath(req.path);
    const isLogin = LOGIN_PATHS.includes(path);
    if (!isLogin && !PUBLIC_WRITE_PATHS.includes(path)) return next();

    const ip = clientIp(req);
    if (!ip) return next();

    const scope = isLogin ? 'login' : 'write';
    const max = isLogin ? MAX_LOGIN : MAX_WRITES;
    const key = `${scope}:${ip}`;
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
        bucket = { count: 0, resetAt: now + WINDOW_MS };
        buckets.set(key, bucket);
    }
    bucket.count++;

    if (bucket.count > max) {
        const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
        res.setHeader('Retry-After', String(retryAfter));
        console.warn(`[RATE LIMIT] ${scope} bloqueado para ${ip} em ${path} (${bucket.count}/${max})`);
        return res.status(429).json({
            error: 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.',
        });
    }

    return next();
}
