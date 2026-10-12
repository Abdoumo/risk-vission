const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const xaiCount = await prisma.xaiDecision.count();
  const xaiSample = await prisma.xaiDecision.findMany({ take: 5 });
  const fraudSample = await prisma.fraudHistoryItem.findMany({ take: 5 });
  console.log('XAI Decisions count:', xaiCount);
  console.log('XAI Decisions sample:', JSON.stringify(xaiSample, null, 2));
  console.log('Fraud sample:', JSON.stringify(fraudSample, null, 2));
}

main().finally(() => prisma.$disconnect());
