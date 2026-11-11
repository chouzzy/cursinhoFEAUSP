/**
 * Cria "Turma de Semana 2027" e "Turma de Sábado 2027" (status "Em breve" no site).
 *
 * Por que script: a criação pelo painel está quebrada (o controller grava status
 * "Em processamento", que o schema rejeita, e o painel não define o `code`).
 *
 * Como rodar (na raiz de cursinhoFEAUSP):
 *   npx ts-node-dev --transpile-only src/scripts/create-turmas-2027.ts           # só mostra (padrão)
 *   npx ts-node-dev --transpile-only src/scripts/create-turmas-2027.ts --apply   # grava no banco do .env
 *
 * Recusa gravar se já existir turma com o mesmo título ou o mesmo par (code + ano no título).
 *
 * Origem dos valores (modelo: turmas 2026 em produção):
 *  - description, observations, classContent, dateSchedule, hourSchedule, color: copiados de 2026 (cliente confirmar)
 *  - whoCanParticipate: texto de 2026 sem o trecho do ano (o de 2026 dizia "no ano 2025"); cliente confirmar
 *  - subscriptions.price / subscriptionSchedule: NÃO informados pelo cliente -> 0 / "A definir" (site mostra "a definir")
 *  - selectiveStages, documents: vazios até o cliente mandar datas e links
 *  - registrations: padrão das turmas sem informação ("Não informado", 0), igual TSM/TSI 2026
 *  - code TSE/TSA: mesmos de 2026; o ID de matrícula passa a usar o ano do título (2027TSE0001)
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidV4 } from 'uuid';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

const QUEM_PODE = 'Concluintes do Ensino Médio ou Estudantes do 3º ano do Ensino Médio';
const OBSERVACOES = 'Esta turma é extensiva, ou seja, as aulas começam em fevereiro e vão até o final do ano.';

const turmas = [
    {
        title: 'Turma de Semana 2027',
        code: 'TSE',
        informations: {
            description: 'Para quem pensa em prestar o vestibular e tem disponibilidade durante a semana, a Turma de Semana garante aulas no período da tarde, das 12h40 às 18h30. Durante as aulas são abordados os conteúdos dos principais vestibulares, com foco no ENEM e na FUVEST, além de ter possibilidade de comparecer aos plantões de dúvida durante a semana.',
            whoCanParticipate: QUEM_PODE,
            observations: OBSERVACOES,
            classContent: 'Pré-vestibular',
            dateSchedule: 'Segunda a Sexta',
            hourSchedule: '12h40 às 18h30',
            color: '#17304a',
        },
    },
    {
        title: 'Turma de Sábado 2027',
        code: 'TSA',
        informations: {
            description: 'Para quem pensa em prestar o vestibular mas não pode frequentar o cursinho durante a semana, a Turma de Sábado garante um dia inteiro de estudos aos sábados, das 8h00 às 18h30. Durante as aulas são abordados os conteúdos dos principais vestibulares, com foco no ENEM e na FUVEST, além de ter possibilidade de comparecer aos plantões de dúvida durante a semana.',
            whoCanParticipate: QUEM_PODE,
            observations: OBSERVACOES,
            classContent: 'Pré-vestibular',
            dateSchedule: 'Aos sábados',
            hourSchedule: '08h00 às 18h30',
            color: '#f9b03f',
        },
    },
].map((t) => ({
    ...t,
    registrationCounter: 0,
    subscriptions: { status: 'Em breve', price: 0, subscriptionSchedule: 'A definir' },
    selectiveStages: [],
    status: 'active',
    documents: [],
    registrations: { description: 'Não informado', value: 0 },
}));

async function main() {
    console.log(APPLY ? '>>> MODO --apply: vai gravar no banco' : '>>> DRY-RUN (nada é gravado). Use --apply para gravar.');

    for (const turma of turmas) {
        const existentes = await prisma.schoolClass.findMany({
            where: { OR: [{ title: turma.title }, { code: turma.code, title: { contains: '2027' } }] },
            select: { id: true, title: true, code: true, status: true },
        });

        if (existentes.length > 0) {
            console.log(`\n[PULANDO] "${turma.title}" já existe:`, existentes);
            continue;
        }

        const data = { ...turma, stripeProductID: `prod_legacy_${uuidV4()}` };
        console.log(`\n[${APPLY ? 'CRIANDO' : 'CRIARIA'}] ${turma.title}`);
        console.log(JSON.stringify(data, null, 2));

        if (APPLY) {
            const criada = await prisma.schoolClass.create({ data });
            console.log(`  -> criada com id ${criada.id}`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
