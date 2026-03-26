import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_URL,
    },
  },
});

async function main() {
  const username = 'admin.demo';
  const user = await prisma.user.findUnique({ 
    where: { username } 
  });
  
  if (user) {
    console.log(`User found: ${user.username}, Role: ${user.role}, IsActive: ${user.isActive}`);
  } else {
    console.log(`User NOT found: ${username}`);
    // Let's list all usernames to see what's there
    const allUsers = await prisma.user.findMany({ select: { username: true } });
    console.log('All usernames in DB:', allUsers.map(u => u.username));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
