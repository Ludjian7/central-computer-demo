import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Export as db for minor backward compatibility if needed, 
// but preferred way is to import { prisma } directly.
export const db = prisma as any;

