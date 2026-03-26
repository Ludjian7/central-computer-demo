import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing Prisma CashShift query...');
  try {
    const shift = await prisma.cashShift.findFirst({
      where: { 
        userId: 2, // Arbitrary test ID
        status: 'open' 
      },
      orderBy: { openedAt: 'desc' }
    });
    console.log('Query successful:', shift);
  } catch (error) {
    console.error('Prisma Error:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
