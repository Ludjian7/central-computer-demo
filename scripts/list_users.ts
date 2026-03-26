import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const POSTGRES_URL = "postgres://cd4a220d10bb94191634a5313e242ac0bed87cb06588e699d5f90de4f318839c:sk_JJOd67l2HGNZasA9jKgVE@db.prisma.io:5432/postgres?sslmode=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: POSTGRES_URL,
    },
  },
});

async function main() {
  const users = await prisma.user.findMany({
    select: { username: true, role: true, isActive: true }
  });
  console.log(`Found ${users.length} users.`);
  users.forEach(u => console.log(`- ${u.username} (${u.role})${u.isActive ? '' : ' [INACTIVE]'}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
