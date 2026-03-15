import { PrismaClient } from '@prisma/client';

// Use a custom environment variable (CENTRAL_DB_URL) to prevent Vercel's 
// automated Postgres integration from overriding our connection string.
// Fallback to POSTGRES_URL for local development.
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.CENTRAL_DB_URL || process.env.POSTGRES_URL,
    },
  },
});

export const db = prisma as any;

