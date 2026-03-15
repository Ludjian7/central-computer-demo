import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed Users
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@central.com',
      passwordHash,
      role: 'admin',
    },
  });

  const owner = await prisma.user.upsert({
    where: { username: 'owner' },
    update: {},
    create: {
      username: 'owner',
      email: 'owner@central.com',
      passwordHash,
      role: 'owner',
    },
  });

  const karyawan = await prisma.user.upsert({
    where: { username: 'karyawan' },
    update: {},
    create: {
      username: 'karyawan',
      email: 'karyawan@central.com',
      passwordHash,
      role: 'karyawan',
    },
  });

  console.log({ admin, owner, karyawan });

  // 2. Seed Settings
  await prisma.setting.upsert({
    where: { key: 'store_name' },
    update: {},
    create: { key: 'store_name', value: 'Central Computer' },
  });

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
