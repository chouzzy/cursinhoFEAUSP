/**
 * Testa criação de inscrição sem campo RG.
 * Valida que o schema e a inserção no banco funcionam corretamente.
 *
 * Uso: npx ts-node src/scripts/test-inscription-no-rg.ts
 *
 * O aluno de teste é deletado ao final — sem efeito colateral no banco.
 */
import 'dotenv/config';
import { prisma } from '../prisma';

const TEST_CPF = '99988877766'; // CPF fictício para o teste

async function main() {
    console.log('=== Teste de inscrição sem RG ===\n');

    // Busca a turma mais recente com inscrições abertas (ou qualquer turma)
    const turma = await prisma.schoolClass.findFirst({
        orderBy: { id: 'desc' },
    });

    if (!turma) {
        console.error('Nenhuma turma encontrada no banco.');
        process.exit(1);
    }

    console.log(`Turma usada: "${turma.title}" (id: ${turma.id})`);

    // Limpa aluno de teste anterior se existir
    await prisma.students.deleteMany({ where: { cpf: TEST_CPF } });

    // Tenta criar um aluno SEM rg e SEM ufrg (campo ufrg usa default 'NDA')
    const aluno = await prisma.students.create({
        data: {
            name: 'Aluno Teste Sem RG',
            email: 'teste-sem-rg@example.com',
            gender: 'Não informado',
            birth: '01/01/2000',
            phoneNumber: '11999999999',
            isPhoneWhatsapp: false,
            state: 'SP',
            city: 'São Paulo',
            street: 'Rua Teste',
            homeNumber: '1',
            complement: '',
            district: 'Centro',
            zipCode: '01310-100',
            emailResponsavel: 'Não informado',
            aceiteTermoCiencia: true,
            aceiteTermoInscricao: true,
            cpf: TEST_CPF,
            ufrg: 'NDA',
            selfDeclaration: 'Pardo',
            oldSchool: 'Escola Teste',
            oldSchoolAdress: 'Rua Escola 1',
            highSchoolGraduationDate: '2023',
            highSchoolPeriod: 'Manhã',
            metUsMethod: 'Instagram',
            exStudent: 'não',
            stripeCustomerID: '',
            purcharsedSubscriptions: {
                schoolClassID: turma.id,
                paymentMethod: 'PIX',
                paymentStatus: 'ATIVA',
                paymentDate: new Date(),
                valuePaid: 0,
                txid: `TESTE_${Date.now()}`,
                pixCopiaECola: 'copia_e_cola_ficticio',
                pixQrCode: 'qrcode_ficticio',
                pixStatus: 'ATIVA',
                pixValor: '35.00',
                pixDate: new Date().toISOString(),
                pixExpiracaoEmSegundos: 86400,
            },
        },
    });

    console.log(`\n✓ Aluno criado com sucesso!`);
    console.log(`  ID: ${aluno.id}`);
    console.log(`  Nome: ${aluno.name}`);
    console.log(`  CPF: ${aluno.cpf}`);
    console.log(`  RG no banco: ${aluno.rg ?? '(null — correto)'}`);
    console.log(`  UFRG no banco: ${aluno.ufrg}`);

    // Verifica que RG é null
    if (aluno.rg !== null) {
        console.error('\n✗ ERRO: rg deveria ser null, mas está preenchido!');
        process.exit(1);
    }

    // Limpa o aluno de teste
    await prisma.students.deleteMany({ where: { cpf: TEST_CPF } });
    console.log('\n✓ Aluno de teste removido do banco.');
    console.log('\n✓ Teste passou! Inscrições sem RG funcionam corretamente.');
}

main()
    .catch((err) => {
        console.error('\n✗ Teste falhou:', err.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
