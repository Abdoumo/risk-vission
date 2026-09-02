import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const models = await prisma.predictionModel.findMany();
  console.log(models);
}
run().catch(console.error).finally(() => prisma.$disconnect());
