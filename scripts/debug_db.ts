import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

console.log('--- ENV DEBUG ---');
console.log('Current CWD:', process.cwd());
const envPath = path.join(process.cwd(), '.env');
console.log('.env exists:', fs.existsSync(envPath));

const envConfig = dotenv.config();
if (envConfig.error) {
  console.error('Dotenv error:', envConfig.error);
} else {
  console.log('Dotenv loaded successfully');
}

console.log('PRISMA_DATABASE_URL:', process.env.PRISMA_DATABASE_URL ? 'DEFINED' : 'UNDEFINED');
console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? 'DEFINED' : 'UNDEFINED');

const POSTGRES_URL = "postgres://cd4a220d10bb94191634a5313e242ac0bed87cb06588e699d5f90de4f318839c:sk_JJOd67l2HGNZasA9jKgVE@db.prisma.io:5432/postgres?sslmode=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: POSTGRES_URL,
    },
  },
});

async function main() {
  // Check users
  const count = await prisma.user.count();
  console.log('Total users in DB:', count);
  
  const allUsers = await prisma.user.findMany({ select: { username: true } });
  console.log('Usernames:', allUsers.map(u => u.username));
}

main().catch(console.error).finally(() => prisma.$disconnect());
