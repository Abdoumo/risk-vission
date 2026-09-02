const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function sync() {
    const varResultPath = path.join(__dirname, '../AI_Pipeline/var_results.json');
    if (fs.existsSync(varResultPath)) {
      const varJson = JSON.parse(fs.readFileSync(varResultPath, 'utf8'));
      const risquesPortefeuille = varJson.portfolio || [];
      const varData = varJson.var_data || [];
      
      await prisma.risqueActif.deleteMany();
      if (risquesPortefeuille.length > 0) {
        for (const r of risquesPortefeuille) {
          await prisma.risqueActif.create({ data: r });
        }
      }
      
      await prisma.varData.deleteMany();
      if (varData.length > 0) {
        for (const vd of varData) {
          await prisma.varData.create({ data: vd });
        }
      }
      console.log('Synced successfully!');
    } else {
        console.log('var_results.json not found');
    }
    await prisma.$disconnect();
}
sync();
