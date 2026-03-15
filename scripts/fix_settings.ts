import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Setting up monthly_target...');
  await prisma.setting.upsert({
    where: { key: 'monthly_target' },
    update: { value: '150000000' },
    create: { key: 'monthly_target', value: '150000000' },
  });
  console.log('✅ monthly_target set to 150,000,000');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
