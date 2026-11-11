import { NextFunction, Request, Response } from "express";

/**
 * Cache em memória do GET público /schoolClass (lista de turmas do site).
 * O site institucional busca essa lista a cada visita em /turmas; no Processo Seletivo
 * isso vira uma consulta ao Mongo por visitante. Com o cache, é uma consulta a cada
 * SCHOOLCLASS_CACHE_SECONDS (padrão 30s) por combinação de filtros.
 *
 * Qualquer escrita em /schoolClass (criar, editar, apagar turma, docs, etapas)
 * limpa o cache na hora, então o painel admin vê a mudança no site imediatamente.
 * SCHOOLCLASS_CACHE_SECONDS=0 desliga.
 */

const TTL_MS = Number(process.env.SCHOOLCLASS_CACHE_SECONDS ?? 30) * 1000;

type Entry = { status: number; body: unknown; expiresAt: number };
const cache = new Map<string, Entry>();

export function clearSchoolClassCache() {
    cache.clear();
}

export function schoolClassListCache(req: Request, res: Response, next: NextFunction) {
    if (TTL_MS <= 0 || req.method !== 'GET' || (req.path !== '/' && req.path !== '')) return next();

    const key = req.originalUrl;
    const hit = cache.get(key);
    if (hit && hit.expiresAt > Date.now()) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(hit.status).json(hit.body);
    }

    // Captura a resposta do controller para guardar.
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
        if (res.statusCode < 300) {
            cache.set(key, { status: res.statusCode, body, expiresAt: Date.now() + TTL_MS });
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
    };
    return next();
}

export function invalidateSchoolClassCacheOnWrite(req: Request, _res: Response, next: NextFunction) {
    if (req.method !== 'GET') clearSchoolClassCache();
    return next();
}
