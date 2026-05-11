import { prisma } from '../prisma'

async function main() {
    const turma = await prisma.schoolClass.findFirst({
        where: {
            title: { contains: 'Intensiva', mode: 'insensitive' },
        },
        orderBy: { id: 'desc' }, // mais recente primeiro
    })

    if (!turma) {
        console.log('Turma de Semana Intensiva não encontrada.')
        return
    }

    console.log(`Turma encontrada: "${turma.title}" (id: ${turma.id})`)
    console.log(`Code atual: ${turma.code ?? '(vazio)'}`)

    if (turma.code === 'TSI') {
        console.log('Code já está correto. Nada a fazer.')
        return
    }

    await prisma.schoolClass.update({
        where: { id: turma.id },
        data: { code: 'TSI' },
    })

    console.log('✓ Code atualizado para TSI com sucesso.')
    console.log('  Próximas matrículas geradas: 2026TSI0001, 2026TSI0002...')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
