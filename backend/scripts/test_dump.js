const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.modelPerformance.findMany().then(console.log).finally(() => prisma.$disconnect());
