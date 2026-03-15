import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function runTests() {
  console.log('=========================================');
  console.log('🧪 TEST SCRIPT: DASHBOARD KPI ENHANCEMENT');
  console.log('=========================================');

  console.log('\n▶️ TESTING FASE 1: (REVENUE SPLIT)');
  try {
    const revenueByType = await prisma.$queryRawUnsafe<any[]>(`
      SELECT p.type, SUM(si.subtotal)::int as revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.payment_status IN ('paid', 'partial')
      GROUP BY p.type
    `);
    console.log('✅ [SUCCESS] Revenue split query berhasil dieksekusi.');
    console.log('   Data:', revenueByType);
  } catch(e: any) {
    console.error('❌ [FAILED] Revenue split query error:', e.message);
  }

  console.log('\n▶️ TESTING FASE 1: (LOW STOCK ENDPOINT)');
  try {
    const lowStock = await prisma.$queryRaw`
      SELECT 
        id, name, sku,
        quantity as current_stock,
        min_quantity as min_stock,
        (min_quantity - quantity)::int as shortage
      FROM products
      WHERE type = 'physical' 
        AND is_active = true
        AND quantity <= min_quantity
      LIMIT 2
    `;
    console.log('✅ [SUCCESS] Low stock query berhasil dieksekusi.');
    console.log('   Data:', lowStock);
  } catch(e: any) {
    console.error('❌ [FAILED] Low stock query error:', e.message);
  }

  console.log('\n▶️ TESTING FASE 1: (SERVICE AGING ENDPOINT)');
  try {
    const aging = await prisma.$queryRawUnsafe(`
      SELECT 
        si.id, si.product_name, si.service_status,
        EXTRACT(DAY FROM NOW() - si.service_schedule)::int as age_days
      FROM sale_items si
      WHERE si.service_status IN ('scheduled', 'in_progress')
      LIMIT 2
    `);
    console.log('✅ [SUCCESS] Service aging query berhasil dieksekusi.');
    console.log('   Data:', aging);
  } catch(e: any) {
    console.error('❌ [FAILED] Service aging query error:', e.message);
  }

  console.log('\n▶️ TESTING FASE 4: (SETTINGS UPSERT & TARGET BULANAN)');
  try {
    const settings = await prisma.setting.findMany();
    console.log(`✅ [SUCCESS] Get settings berhasil. Total: ${settings.length} pengaturan.`);
    
    // Simulate API upsert behavior for monthly_target
    await prisma.setting.upsert({
      where: { key: 'monthly_target' },
      update: { value: '150000000' },
      create: { key: 'monthly_target', value: '150000000'}
    });
    
    const updatedTarget = await prisma.setting.findUnique({ where: { key: 'monthly_target' } });
    console.log('✅ [SUCCESS] Prisma upsert berhasil. Target Bulanan saat ini:', updatedTarget?.value);
  } catch(e: any) {
    console.error('❌ [FAILED] Settings upsert error:', e.message);
  }

  console.log('\n🎉 SEMUA TEST SELESAI.');
  await prisma.$disconnect();
}

runTests();
