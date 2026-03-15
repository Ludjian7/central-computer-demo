import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Shifting database dates to make them current...');
  
  // Calculate shift (SQL data ends at 2025-12-31, we want it to end around NOW 2026-03-16)
  // Distance is about 75 days.
  const daysToShift = 75; 

  const queries = [
    `UPDATE users SET created_at = created_at + INTERVAL '${daysToShift} days', updated_at = updated_at + INTERVAL '${daysToShift} days'`,
    `UPDATE suppliers SET created_at = created_at + INTERVAL '${daysToShift} days'`,
    `UPDATE products SET created_at = created_at + INTERVAL '${daysToShift} days', updated_at = updated_at + INTERVAL '${daysToShift} days'`,
    `UPDATE holiday_config SET date = date + INTERVAL '${daysToShift} days'`,
    `UPDATE discounts SET valid_from = valid_from + INTERVAL '${daysToShift} days', valid_until = valid_until + INTERVAL '${daysToShift} days', created_at = created_at + INTERVAL '${daysToShift} days'`,
    `UPDATE cash_shifts SET opened_at = opened_at + INTERVAL '${daysToShift} days', closed_at = closed_at + INTERVAL '${daysToShift} days'`,
    `UPDATE sales SET created_at = created_at + INTERVAL '${daysToShift} days', updated_at = updated_at + INTERVAL '${daysToShift} days'`,
    `UPDATE sale_items SET service_schedule = service_schedule + INTERVAL '${daysToShift} days', created_at = created_at + INTERVAL '${daysToShift} days'`,
    `UPDATE stock_logs SET created_at = created_at + INTERVAL '${daysToShift} days'`,
    `UPDATE activity_logs SET created_at = created_at + INTERVAL '${daysToShift} days'`,
    `UPDATE purchase_orders SET expected_date = expected_date + INTERVAL '${daysToShift} days', received_date = received_date + INTERVAL '${daysToShift} days', created_at = created_at + INTERVAL '${daysToShift} days', updated_at = updated_at + INTERVAL '${daysToShift} days'`,
    `UPDATE stock_opname SET opname_date = opname_date + INTERVAL '${daysToShift} days', completed_at = completed_at + INTERVAL '${daysToShift} days', created_at = created_at + INTERVAL '${daysToShift} days'`,
    `UPDATE returns SET created_at = created_at + INTERVAL '${daysToShift} days'`
  ];

  for (const q of queries) {
    console.log(`Executing: ${q}`);
    await prisma.$executeRawUnsafe(q);
  }

  console.log('✅ Dates shifted successfully by +75 days.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
