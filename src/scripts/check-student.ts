import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const s = await prisma.students.findUnique({
    where: { id: '6a473122-719e-438b-bdb9-b74261030719' },
    select: { id: true, name: true, email: true, purcharsedSubscriptions: true }
  });
  console.log(JSON.stringify(s, null, 2));
  await prisma.$disconnect();
}
main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1); });
