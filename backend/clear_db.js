const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
prisma.fraudHistoryItem.deleteMany().then(() => console.log('Deleted all fake data from DB!')).catch(console.error).finally(() => prisma.$disconnect());
