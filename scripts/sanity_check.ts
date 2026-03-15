import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SANITY CHECK: SYNTHETIC DATA ---');
  
  try {
    // 1. Check Setting
    const target = await prisma.setting.findUnique({ where: { key: 'monthly_target' } });
    console.log(`\n• [Settings] Monthly Target: ${target?.value} (Expected: 150000000)`);

    // 2. Check Users
    const users = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    });
    console.log('\n• [Users] Roles distribution:');
    users.forEach(u => console.log(`  - ${u.role}: ${u._count.id}`));

    // 3. Check Products (Physical & Service)
    const productStats = await prisma.product.aggregate({
      _count: { id: true },
      _min: { price: true, cost: true, quantity: true, minQuantity: true },
      _max: { price: true, cost: true, quantity: true, minQuantity: true },
    });
    console.log(`\n• [Products] Total: ${productStats._count.id}`);
    console.log(`  - Price range: ${productStats._min.price} to ${productStats._max.price}`);
    console.log(`  - Cost range: ${productStats._min.cost} to ${productStats._max.cost}`);
    console.log(`  - Quantity range: ${productStats._min.quantity} to ${productStats._max.quantity}`);
    console.log(`  - Min Quantity range: ${productStats._min.minQuantity} to ${productStats._max.minQuantity}`);
    
    // Check if any negative values exist
    const negativeProducts = await prisma.product.count({
      where: { OR: [{ price: { lt: 0 } }, { cost: { lt: 0 } }, { quantity: { lt: 0 } }] }
    });
    console.log(`  - Products with negative price/cost/qty: ${negativeProducts} (Expected: 0)`);

    // 4. Check Sales
    const saleStats = await prisma.sale.aggregate({
      _count: { id: true },
      _min: { total: true, subtotal: true, createdAt: true },
      _max: { total: true, subtotal: true, createdAt: true },
    });
    console.log(`\n• [Sales] Total Transactions: ${saleStats._count.id}`);
    console.log(`  - Created date range: ${saleStats._min.createdAt?.toISOString().split('T')[0]} to ${saleStats._max.createdAt?.toISOString().split('T')[0]}`);
    console.log(`  - Total amount range: ${saleStats._min.total} to ${saleStats._max.total}`);
    
    // Check total match subtotal
    const mismatchedTotalsRaw = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int as count FROM sales WHERE total != subtotal
    `) as any[];
    console.log(`  - Mismatched total vs subtotal: ${mismatchedTotalsRaw[0].count} (Expected: 0 if no tax/discount)`);

    // Check payment statuses
    const statuses = await prisma.sale.groupBy({
      by: ['paymentStatus'],
      _count: { id: true }
    });
    console.log('  - Payment Statuses:');
    statuses.forEach(s => console.log(`    - ${s.paymentStatus}: ${s._count.id}`));

    // 5. Check Service Aging (SaleItems with services)
    const services = await prisma.saleItem.groupBy({
      by: ['serviceStatus'],
      where: { serviceStatus: { not: null } },
      _count: { id: true }
    });
    console.log('\n• [Services] Statuses:');
    services.forEach(s => console.log(`  - ${s.serviceStatus}: ${s._count.id}`));

    const overdueServices = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int as count
      FROM sale_items 
      WHERE service_status IN ('scheduled', 'in_progress')
        AND service_schedule < NOW() - INTERVAL '3 days'
    `) as any[];
    console.log(`  - Overdue Services (>3 days): ${overdueServices[0].count}`);

  } catch (error: any) {
    console.error('Error during sanity check:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
