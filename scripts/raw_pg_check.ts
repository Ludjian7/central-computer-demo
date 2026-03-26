import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.PRISMA_DATABASE_URL,
});

async function check() {
  await client.connect();
  const res = await client.query('SELECT username, password_hash, role FROM users');
  console.log('Raw DB Users:', res.rows);
  await client.end();
}

check().catch(console.error);
