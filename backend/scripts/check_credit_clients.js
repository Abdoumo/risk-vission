const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.creditClient.count();
  const bnaClient = await prisma.creditClient.findFirst({
    where: { client_id: { contains: 'BNA004021' } }
  });
  console.log('CreditClient count:', count);
  console.log('BNA004021 in CreditClient:', bnaClient);
}

main().finally(() => prisma.$disconnect());
