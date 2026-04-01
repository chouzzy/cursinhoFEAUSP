import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const terms = ['Daniel', 'Giovanna', 'Raphaela', 'Nicolly'];
  for (const t of terms) {
    const students = await prisma.students.findMany({
      where: { name: { contains: t, mode: 'insensitive' } },
      select: { id: true, name: true, email: true, purcharsedSubscriptions: true }
    });
    console.log('\n--- ' + t + ' ---');
    if (students.length === 0) { console.log('  (nenhum)'); continue; }
    students.forEach(s => {
      console.log('  name:', JSON.stringify(s.name), '| email:', s.email);
      s.purcharsedSubscriptions.forEach((sub, i) => {
        console.log('    sub[' + i + '] status=' + JSON.stringify(sub.paymentStatus) + ' matricula=' + (sub.matriculaID || 'N/A') + ' txid=' + (sub.txid || 'N/A'));
      });
    });
  }
  await prisma.$disconnect();
}
main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1); });
