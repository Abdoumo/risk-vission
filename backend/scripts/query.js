const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.clientProfile.findMany();
  console.log(`Total clients: ${clients.length}`);
  if (clients.length > 0) {
    console.log('Sample client data:', JSON.stringify(clients[0].data, null, 2));
  }
}

main().finally(() => prisma.$disconnect());
