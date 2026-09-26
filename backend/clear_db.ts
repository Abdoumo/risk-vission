import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.risqueActif.deleteMany();
  await prisma.varData.deleteMany();
  console.log('Cleared mock data');
}

main().finally(() => prisma.$disconnect());
