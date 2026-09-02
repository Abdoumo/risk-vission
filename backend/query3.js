const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fraudItems = await prisma.fraudHistoryItem.findMany();
  let totalMontant = 0;
  
  for (const item of fraudItems) {
    if (item.montant) {
      const montantStr = item.montant.replace(/[^0-9.-]+/g, "");
      const montant = parseFloat(montantStr);
      if (!isNaN(montant)) {
        totalMontant += montant;
      }
    }
  }
  
  console.log('Total Montant in FraudHistoryItem:', totalMontant);
}

main().finally(() => prisma.$disconnect());
