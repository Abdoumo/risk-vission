const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fraudItems = await prisma.fraudHistoryItem.findMany();
  let totalAmountEvaluated = 0;
  let totalExpectedLoss = 0;
  
  const userLossMap = {};

  for (const item of fraudItems) {
    const montantStr = item.montant ? item.montant.replace(/[^0-9.-]+/g, "") : "0";
    const montant = parseFloat(montantStr) || 0;
    totalAmountEvaluated += montant;

    let expectedLoss = 0;
    if (item.details) {
      try {
        const parsedDetails = typeof item.details === 'string' ? JSON.parse(item.details) : item.details;
        if (parsedDetails && parsedDetails.ml_results && parsedDetails.ml_results.credit_risk && parsedDetails.ml_results.credit_risk.expected_loss) {
          expectedLoss = parseFloat(parsedDetails.ml_results.credit_risk.expected_loss);
        }
      } catch (e) {
      }
    }
    totalExpectedLoss += expectedLoss;

    const entite = item.entite || "Unknown";
    if (!userLossMap[entite]) {
      userLossMap[entite] = {
        entite: entite,
        totalMontant: 0,
        expectedLoss: 0,
        transactions: 0,
        status: item.decision
      };
    }
    
    userLossMap[entite].totalMontant += montant;
    userLossMap[entite].expectedLoss += expectedLoss;
    userLossMap[entite].transactions += 1;
    
    if (item.decision === 'blocked') {
      userLossMap[entite].status = 'blocked';
    } else if (item.decision === 'review' && userLossMap[entite].status !== 'blocked') {
      userLossMap[entite].status = 'review';
    }
  }

  const lossPerUser = Object.values(userLossMap).sort((a, b) => b.expectedLoss - a.expectedLoss);

  console.log(JSON.stringify({
    totalAmountEvaluated,
    totalExpectedLoss,
    lossPerUser: lossPerUser.slice(0, 3) // show top 3
  }, null, 2));
}

main().finally(() => prisma.$disconnect());
