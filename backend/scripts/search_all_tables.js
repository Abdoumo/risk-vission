const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = ['CreditClient', 'FraudHistoryItem', 'XaiDecision', 'RisqueActif', 'Client', 'Account', 'Transaction'];
  for (const t of tables) {
    try {
      const res = await prisma.$queryRawUnsafe(`SELECT * FROM "${t}" WHERE CAST(row_to_json("${t}") AS TEXT) LIKE '%BNA004021%' LIMIT 5;`);
      if (res && res.length > 0) {
        console.log(`Found BNA004021 in table ${t}:`, res);
      }
    } catch (e) {
      // table might not exist
    }
  }
}

main().finally(() => prisma.$disconnect());
