const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Wiping risk data...');
  await prisma.risqueActif.deleteMany();
  await prisma.riskKpi.deleteMany();
  await prisma.stressTest.deleteMany();
  await prisma.varData.deleteMany();
  console.log('Risk data wiped successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
