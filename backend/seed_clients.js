const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const csvPath = path.join(__dirname, '../AI_Pipeline/clients_bulk_test.csv');
  console.log('Reading CSV from', csvPath);

  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length < 2) return;

  const headers = lines[0].split(',');
  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx];
    });
    results.push(obj);
  }

  console.log(`Parsed ${results.length} rows. Seeding database...`);
  
  // Clear existing first
  await prisma.clientProfile.deleteMany();

  let count = 0;
  for (const row of results) {
    const client_name = row.client_name || `Client-${count}`;
    const data = { ...row };
    delete data.client_name;

    await prisma.clientProfile.create({
      data: {
        client_name,
        status: 'PENDING',
        data: data
      }
    });
    count++;
  }
  
  console.log(`Successfully seeded ${count} pending clients!`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
