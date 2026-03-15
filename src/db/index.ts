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
        // If INSERT, use RETURNING id to get the last inserted id
        const isInsert = postgresSql.trim().toUpperCase().startsWith('INSERT');
        if (isInsert) {
          const sqlWithReturning = postgresSql.includes('RETURNING')
            ? postgresSql
            : `${postgresSql} RETURNING id`;
          const result = await prisma.$queryRawUnsafe(sqlWithReturning, ...params) as any[];
          return { changes: result.length, lastInsertRowid: result[0]?.id ?? null };
        }
        const result = await prisma.$executeRawUnsafe(postgresSql, ...params);
        return { changes: result, lastInsertRowid: null };
      }
    };
  },
  // transaction wraps Prisma $transaction - fn is called with no extra args
  transaction: (fn: any) => async (...args: any[]) => prisma.$transaction(() => fn(...args)),
  $transaction: (fn: any) => prisma.$transaction(fn),
  $queryRawUnsafe: (sql: string, ...params: any[]) => prisma.$queryRawUnsafe(sql, ...params),
  $executeRawUnsafe: (sql: string, ...params: any[]) => prisma.$executeRawUnsafe(sql, ...params),
  prisma,
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
