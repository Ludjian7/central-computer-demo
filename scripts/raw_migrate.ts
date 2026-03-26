import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config();

// Explicitly use the connection string set by the user
const connectionString = process.env.PRISMA_DATABASE_URL;

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  console.log('Connecting to raw Postgres instance via pg client...');
  await client.connect();

  const sqlFilePath = path.join(process.cwd(), 'seed_demo_3bulan.sql');
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`File not found: ${sqlFilePath}`);
    process.exit(1);
  }

  let sql = fs.readFileSync(sqlFilePath, 'utf8');

  // Fix the duplicate ID bug in purchase_order_items (same logic as before)
  if (sql.includes('INSERT INTO "purchase_order_items" (id,')) {
    console.log('Fixing duplicate IDs in purchase_order_items...');
    sql = sql.replace(
      /INSERT INTO "purchase_order_items" \(id, po_id, product_id, quantity, unit_cost, subtotal, received_qty\) VALUES\s*([\s\S]+?);/g,
      (match, values) => {
        const fixedValues = values
          .split('\n')
          .map(line => line.replace(/^\s*\(\d+,/, '('))
          .join('\n');
        return `INSERT INTO "purchase_order_items" (po_id, product_id, quantity, unit_cost, subtotal, received_qty) VALUES ${fixedValues};`;
      }
    );
  }

  console.log('Executing complete SQL dump...');
  try {
    // 1. Clear out tables 
    const tableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name != '_prisma_migrations';
    `;
    const res = await client.query(tableQuery);
    if (res.rows.length > 0) {
      const allTables = res.rows.map(r => `"${r.table_name}"`).join(', ');
      console.log(`Truncating ${res.rows.length} tables: ${allTables}`);
      await client.query(`TRUNCATE TABLE ${allTables} CASCADE;`);
    }

    // 2. Set replication role 
    await client.query(`SET session_replication_role = 'replica';`);

    // 3. Execute the full dump
    // pg client can execute multiple statements separated by semicolon out of the box
    await client.query(sql);

    // 4. Specifically ensure the password hash for admin.demo is perfectly valid
    const bcryptjs = await import('bcryptjs');
    const perfectHash = bcryptjs.default.hashSync('password123', 10);
    console.log(`Setting admin.demo password to new hash: ${perfectHash}`);
    await client.query(`UPDATE "users" SET password_hash = $1 WHERE username = 'admin.demo'`, [perfectHash]);

    // 5. Restore replication role
    await client.query(`SET session_replication_role = 'origin';`);

    // 6. Verify insertion directly
    const userCount = await client.query(`SELECT COUNT(*) FROM "users"`);
    const saleCount = await client.query(`SELECT COUNT(*) FROM "sales"`);
    console.log(`\nMigration successful via RAW pg client!`);
    console.log(`Users DB Count: ${userCount.rows[0].count}`);
    console.log(`Sales DB Count: ${saleCount.rows[0].count}`);

    const checkAdmin = await client.query(`SELECT username, password_hash FROM "users" WHERE username = 'admin.demo'`);
    if (checkAdmin.rows.length > 0) {
      console.log(`Admin User Verified: ${checkAdmin.rows[0].username}`);
      console.log(`Admin Hash Matches Expected: ${checkAdmin.rows[0].password_hash === perfectHash}`);
    } else {
      console.log('ADMIN USER NOT FOUND. Migration failed silently.');
    }

  } catch (err: any) {
    console.error('Migration failed:', err);
    try { await client.query(`SET session_replication_role = 'origin';`); } catch (e) {}
  } finally {
    await client.end();
  }
}

main();
