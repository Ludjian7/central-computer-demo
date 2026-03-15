import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Compatibility helper to bridge better-sqlite3 sync API to Prisma async API
// This allows us to keep most SQL queries while switching to Postgres.
export const db = {
  prepare: (sql: string) => {
    // Convert SQLite ? placeholders to Postgres $1, $2, etc.
    let paramCount = 0;
    const postgresSql = sql.replace(/\?/g, () => `$${++paramCount}`);
    
    return {
      all: (...params: any[]) => prisma.$queryRawUnsafe(postgresSql, ...params),
      get: async (...params: any[]) => {
        const res = await prisma.$queryRawUnsafe(postgresSql, ...params) as any[];
        return res[0];
      },
      run: async (...params: any[]) => {
        const result = await prisma.$executeRawUnsafe(postgresSql, ...params);
        return { changes: result, lastInsertRowid: null }; // lastInsertRowid is tricky in Postgres, usually handled by RETURNING
      }
    };
  },
  transaction: (fn: any) => prisma.$transaction(tx => fn(tx)),
  // Also export the raw prisma methods for better refactoring later
  $queryRawUnsafe: (sql: string, ...params: any[]) => prisma.$queryRawUnsafe(sql, ...params),
  $executeRawUnsafe: (sql: string, ...params: any[]) => prisma.$executeRawUnsafe(sql, ...params),
  $transaction: (fn: any) => prisma.$transaction(fn),
  // Accessor for generated models
  user: prisma.user,
  product: prisma.product,
  supplier: prisma.supplier,
  sale: prisma.sale,
  saleItem: prisma.saleItem,
  stockLog: prisma.stockLog,
  return: prisma.return,
  purchaseOrder: prisma.purchaseOrder,
  purchaseOrderItem: prisma.purchaseOrderItem,
  stockOpname: prisma.stockOpname,
  stockOpnameItem: prisma.stockOpnameItem,
  discount: prisma.discount,
  cashShift: prisma.cashShift,
  setting: prisma.setting
};
