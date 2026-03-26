import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

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
  const sqlFilePath = path.join(process.cwd(), 'seed_demo_3bulan.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`File not found: ${sqlFilePath}`);
    process.exit(1);
  }

  console.log('Reading SQL file...');
  let sql = fs.readFileSync(sqlFilePath, 'utf8');

  // FIX BUG in SQL: all purchase_order_items have id=1
  // We'll remove the 'id,' from the columns list and the leading '1,' from each value tuple
  if (sql.includes('INSERT INTO "purchase_order_items" (id,')) {
    console.log('Fixing duplicate IDs in purchase_order_items...');
    sql = sql.replace(
      /INSERT INTO "purchase_order_items" \(id, po_id, product_id, quantity, unit_cost, subtotal, received_qty\) VALUES\s*([\s\S]+?);/g,
      (match, values) => {
        const fixedValues = values
          .split('\n')
          .map(line => line.replace(/^\s*\(\d+,/, '(')) // Remove the first number (the id) from each tuple
          .join('\n');
        return `INSERT INTO "purchase_order_items" (po_id, product_id, quantity, unit_cost, subtotal, received_qty) VALUES ${fixedValues};`;
      }
    );
  }

  // Logic to execute the SQL
  // Note: Since the SQL file has BEGIN/COMMIT, we can try executing it in blocks or as one if protocol allows.
  // For safety and visibility, we'll use a transaction block method via Prisma.
  
  console.log('Starting migration to production database...');
  try {
    // 1. Get all table names to truncate
    const tableNames: { table_name: string }[] = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != '_prisma_migrations';
    `);

    if (tableNames.length > 0) {
      const allTables = tableNames.map(t => `"${t.table_name}"`).join(', ');
      console.log(`Truncating ${tableNames.length} tables: ${allTables}`);
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${allTables} CASCADE;`);
    }

    // Set replication role to bypass foreign key checks during bulk insert
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);

    // Split SQL by semicolon followed by newline/whitespace
    const statements = sql
      .split(/;\s*$/m)
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.toUpperCase() !== 'BEGIN' && s.toUpperCase() !== 'COMMIT');

    console.log(`Found ${statements.length} statements. Executing...`);

    let count = 0;
    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement);
      } catch (stmtError) {
        console.error(`Error in statement: ${statement.substring(0, 200)}...`);
        throw stmtError;
      }
      count++;
      if (count % 50 === 0) console.log(`Executed ${count}/${statements.length} statements...`);
    }

    // Generate a fresh hash for password123 to be absolutely sure
    const confirmedHash = await import('bcryptjs' as any).then((m: any) => m.default.hashSync('password123', 10));
    console.log(`Updating admin.demo with confirmed hash: ${confirmedHash}`);
    await prisma.user.update({
      where: { username: 'admin.demo' },
      data: { passwordHash: confirmedHash }
    });

    // Restore replication role
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`);

    const usersCount = await prisma.user.count();
    const salesCount = await prisma.sale.count();
    const adminUser = await prisma.user.findUnique({ where: { username: 'admin.demo' } });
    console.log(`Migration successful! Users: ${usersCount}, Sales: ${salesCount}`);
    console.log(`Admin user: ${adminUser?.username}, Hash matches: ${adminUser?.passwordHash === confirmedHash}`);
  } catch (error) {
    console.error('Migration failed:', error);
    // Try to restore replication role even on failure
    try { await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`); } catch (e) {}
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
