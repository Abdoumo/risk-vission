const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const varData = await prisma.varData.findMany();
  let totalPerte = 0;
  
  for (const item of varData) {
    if (item.perte) {
      totalPerte += item.perte;
    }
  }
  
  console.log('Total Perte in VarData:', totalPerte);
  console.log('VarData count:', varData.length);
}

main().finally(() => prisma.$disconnect());
