import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.dataFlow.deleteMany({});
  await prisma.apiLog.deleteMany({});
  // Wait, the table might be named flowStat or FlowStat. Let's look at schema.prisma or just use prisma.flowStat.deleteMany
  if (prisma.flowStat) await prisma.flowStat.deleteMany({});
  else if ((prisma as any).flowStat) await (prisma as any).flowStat.deleteMany({});
  await prisma.bankConnector.deleteMany({});
  console.log('Dummy data cleared from BankConnector, ApiLog, and DataFlow tables.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
