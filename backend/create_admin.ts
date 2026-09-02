import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@riskvision.ai';
  const password = 'admin'; // You can change this if you want
  
  console.log(`Creating/Updating admin user with email: ${email}`);
  
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      name: 'Admin User',
    },
    create: {
      email,
      password: hashedPassword,
      role: 'ADMIN',
      name: 'Admin User',
    },
  });

  console.log(`✅ Admin user successfully created!`);
  console.log(`- Email: ${user.email}`);
  console.log(`- Password: ${password}`);
}

main()
  .catch((e) => {
    console.error('Error creating admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
