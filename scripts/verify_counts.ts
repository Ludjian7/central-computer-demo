import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const usersCount = await prisma.user.count();
  const salesCount = await prisma.sale.count();
  const productsCount = await prisma.product.count();
  console.log('--- VERIFICATION ---');
  console.log(`Users: ${usersCount}`);
  console.log(`Sales: ${salesCount}`);
  console.log(`Products: ${productsCount}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
