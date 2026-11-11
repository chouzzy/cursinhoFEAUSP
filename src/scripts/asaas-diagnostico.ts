/**
 * Diagnóstico do Asaas, SOMENTE LEITURA (apenas GET no Asaas e findMany no banco).
 * Não cria cobrança, não altera configuração, não imprime chave nem dado pessoal.
 *
 * Uso no servidor de produção (na pasta do backend, com o .env de produção):
 *   npm run build && node build/scripts/asaas-diagnostico.js
 *   (em dev: npx ts-node-dev --transpile-only src/scripts/asaas-diagnostico.ts)
 *
 * Mostra:
 *  1. ambiente da chave (sandbox ou produção) e a URL configurada
 *  2. webhooks cadastrados no Asaas: URL, ativo, fila interrompida, se tem token
 *  3. para cada cobrança Asaas PENDENTE no banco: o status real dela no Asaas
 */
// carrega o .env se o pacote dotenv existir (o servidor pode injetar as variáveis de outro jeito)
try { require('dotenv').config(); } catch { /* sem dotenv: usa o ambiente do processo */ }
import { asaas } from '../lib/asaas';
import { prisma } from '../prisma';

async function main() {
    const key = process.env.ASAAS_API_KEY || '';
    const env = key.includes('_prod_') ? 'PRODUÇÃO' : key.includes('_hmlg_') ? 'SANDBOX' : 'DESCONHECIDO';
    console.log(`ASAAS_API_URL=${process.env.ASAAS_API_URL} | chave: ${env} | PAYMENT_PROVIDER=${process.env.PAYMENT_PROVIDER}`);
    console.log(`ASAAS_WEBHOOK_TOKEN configurado no backend: ${process.env.ASAAS_WEBHOOK_TOKEN ? 'sim' : 'não'}`);

    try {
        const { data } = await asaas.get('/webhooks');
        console.log(`\nWebhooks cadastrados: ${data.totalCount ?? data.data?.length ?? 0}`);
        for (const w of data.data || []) {
            console.log(`- ${w.name || w.id}: url=${w.url} enabled=${w.enabled} interrupted=${w.interrupted} hasAuthToken=${w.hasAuthToken} sendType=${w.sendType} eventos=${(w.events || []).length}`);
        }
    } catch (e: any) {
        console.log(`Falha ao listar webhooks: ${e.response?.status} ${JSON.stringify(e.response?.data?.errors || e.message)}`);
    }

    const pendentes: { origem: string; txid: string; criado: Date | null }[] = [];

    const donations = await prisma.donations.findMany({
        where: { paymentMethod: 'asaas_checkout', paymentStatus: 'PENDENTE' },
        select: { txid: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
    });
    donations.forEach(d => d.txid && pendentes.push({ origem: 'doação', txid: d.txid, criado: d.createdAt }));

    const students = await prisma.students.findMany({
        where: { purcharsedSubscriptions: { some: { paymentMethod: 'asaas_checkout', paymentStatus: 'PENDENTE' } } },
        select: { purcharsedSubscriptions: true },
    });
    students.forEach(s => s.purcharsedSubscriptions
        .filter(x => x.paymentMethod === 'asaas_checkout' && x.paymentStatus === 'PENDENTE')
        .forEach(x => x.txid && pendentes.push({ origem: 'inscrição', txid: x.txid, criado: x.paymentDate })));

    pendentes.sort((a, b) => new Date(b.criado || 0).getTime() - new Date(a.criado || 0).getTime());
    console.log(`\nCobranças Asaas PENDENTES no banco: ${pendentes.length} (status real no Asaas abaixo)`);

    for (const p of pendentes) {
        try {
            const { data } = await asaas.get('/payments', { params: { externalReference: p.txid } });
            const pays = data.data || [];
            const resumo = pays.length
                ? pays.map((x: any) => `${x.id} status=${x.status} tipo=${x.billingType} venc=${x.dueDate} pago=${x.paymentDate || x.confirmedDate || '-'}`).join(' | ')
                : 'NÃO ENCONTRADA no Asaas';
            console.log(`- ${p.origem} ${p.txid} criada=${p.criado?.toISOString?.() ?? p.criado}: ${resumo}`);
        } catch (e: any) {
            console.log(`- ${p.origem} ${p.txid}: erro ${e.response?.status} ${JSON.stringify(e.response?.data?.errors || e.message)}`);
        }
    }

    console.log('\nLeitura: status RECEIVED/CONFIRMED no Asaas com PENDENTE no banco = webhook não chegou ou falhou.');
    console.log('PENDING/OVERDUE no Asaas = a pessoa não pagou (abandono), não é falha do sistema.');
}

main()
    .catch(e => { console.error('ERRO', e.message); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
