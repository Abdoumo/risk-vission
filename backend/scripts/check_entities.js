const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allFrauds = await prisma.fraudHistoryItem.findMany({
    select: { id: true, entite: true, score: true }
  });
  console.log(`Total frauds: ${allFrauds.length}`);
  console.log('Sample entities:', allFrauds.slice(0, 20));
  const bnaLike = allFrauds.filter(f => f.entite && f.entite.includes('BNA'));
  console.log(`Total with BNA: ${bnaLike.length}`);
}

main().finally(() => prisma.$disconnect());
