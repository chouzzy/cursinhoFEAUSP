/**
 * Corrige os documentos da Turma de Semana Intensiva 2026 no banco.
 * Remove documentos de 2024 e substitui pelos corretos de 2026.
 *
 * Uso: npx ts-node src/scripts/fix-tsi-documents.ts
 */
import { prisma } from '../prisma'
import { randomUUID } from 'crypto'

const DOCUMENTOS_CORRETOS = [
    {
        docsID: randomUUID(),
        title: 'Manual do Candidato',
        downloadLink: 'https://bit.ly/ManualdoCandidatoTSI2026',
    },
    {
        docsID: randomUUID(),
        title: 'Termo de Inscrição',
        downloadLink: 'https://bit.ly/TermodeInscricaoTSI2026',
    },
    {
        docsID: randomUUID(),
        title: 'Formulário de Pré-Entrevista',
        downloadLink: 'https://bit.ly/PreEntrevistaTSI2026',
    },
]

async function main() {
    const turma = await prisma.schoolClass.findFirst({
        where: { title: { contains: 'Intensiva', mode: 'insensitive' } },
        include: { documents: true },
        orderBy: { id: 'desc' },
    })

    if (!turma) {
        console.error('Turma de Semana Intensiva não encontrada.')
        process.exit(1)
    }

    console.log(`Turma: "${turma.title}" (id: ${turma.id})`)
    console.log('\nDocumentos ATUAIS no banco:')
    turma.documents.forEach(d => console.log(`  - ${d.title}: ${d.downloadLink}`))

    await prisma.schoolClass.update({
        where: { id: turma.id },
        data: {
            documents: {
                set: DOCUMENTOS_CORRETOS,
            },
        },
    })

    console.log('\nDocumentos APÓS correção:')
    DOCUMENTOS_CORRETOS.forEach(d => console.log(`  ✓ ${d.title}: ${d.downloadLink}`))
    console.log('\n✓ Documentos atualizados com sucesso!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
