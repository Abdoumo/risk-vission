const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dataFlows = await prisma.dataFlow.findMany();
  console.log('DataFlows:', dataFlows);
  
  const fraudItems = await prisma.fraudHistoryItem.findMany();
  console.log('FraudItems count:', fraudItems.length);
  if (fraudItems.length > 0) {
    console.log('FraudItems sample:', fraudItems[0]);
  }
}

main().finally(() => prisma.$disconnect());
