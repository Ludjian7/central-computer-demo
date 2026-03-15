import { PrismaClient } from '@prisma/client';

// We explicitly set the URL here to prevent Vercel Postgres integration
// from overriding the standard PRISMA_DATABASE_URL at runtime.
const DEMO_DB_URL = "postgres://cd4a220d10bb94191634a5313e242ac0bed87cb06588e699d5f90de4f318839c:sk_JJOd67l2HGNZasA9jKgVE@db.prisma.io:5432/postgres?sslmode=require";

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.CENTRAL_DB_URL || DEMO_DB_URL,
    },
  },
});

export const db = prisma as any;

