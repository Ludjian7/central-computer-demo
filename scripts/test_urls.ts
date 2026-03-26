import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const PRISMA_URL = process.env.PRISMA_DATABASE_URL;
const POSTGRES_URL = process.env.POSTGRES_URL;

console.log('--- Configured Environment Variables ---');
console.log('PRISMA_DATABASE_URL:', PRISMA_URL);
console.log('POSTGRES_URL:', POSTGRES_URL);

async function checkDb(url: string | undefined, name: string) {
  if (!url) {
    console.log(`\nURL for ${name} is NOT DEFINED`);
    return;
  }
  
  console.log(`\n--- Testing Connection: ${name} ---`);
  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });

  try {
    const userCount = await prisma.user.count();
    const saleCount = await prisma.sale.count();
    console.log(`[SUCCESS] Database connected! Users: ${userCount}, Sales: ${saleCount}`);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({ select: { username: true } });
      console.log('Usernames:', users.map(u => u.username));
    }
  } catch (error: any) {
    console.log(`[ERROR] Connection failed: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await checkDb(PRISMA_URL, 'PRISMA_DATABASE_URL');
  await checkDb(POSTGRES_URL, 'POSTGRES_URL');
}

main().catch(console.error);
