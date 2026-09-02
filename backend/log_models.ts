import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function logModels() {
  const models = await prisma.modelPerformance.findMany();
  console.log(models);
}

logModels()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
