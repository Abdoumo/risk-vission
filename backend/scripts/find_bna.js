const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bnaFrauds = await prisma.fraudHistoryItem.findMany({
    where: {
      OR: [
        { entite: { contains: 'BNA' } },
        { id: { contains: 'BNA' } },
        { details: { string_contains: 'BNA' } }
      ]
    }
  });
  console.log('BNA frauds count in FraudHistoryItem:', bnaFrauds.length);
  if (bnaFrauds.length > 0) {
    console.log('Sample BNA:', JSON.stringify(bnaFrauds[0], null, 2));
  }
}

main().finally(() => prisma.$disconnect());
