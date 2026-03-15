import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import path from 'path';

const prisma = new PrismaClient();
const sqliteDbPath = path.resolve('..', 'database.sqlite');
const sqlite = new Database(sqliteDbPath);

async function migrate() {
  console.log('Starting migration from SQLite to Postgres...');

  try {
    // 1. Users
    console.log('Migrating users...');
    const users = sqlite.prepare('SELECT * FROM users').all();
    for (const u: any of users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          username: u.username,
          email: u.email || `${u.username}@example.com`,
          passwordHash: u.password_hash,
          role: u.role,
          isActive: u.is_active === 1,
          createdAt: new Date(u.created_at)
        }
      });
    }

    // 2. Suppliers
    console.log('Migrating suppliers...');
    const suppliers = sqlite.prepare('SELECT * FROM suppliers').all();
    for (const s: any of suppliers) {
      await prisma.supplier.upsert({
        where: { id: s.id },
        update: {},
        create: {
          id: s.id,
          name: s.name,
          contactPerson: s.contact_person,
          email: s.email,
          phone: s.phone,
          address: s.address,
          city: s.city,
          postalCode: s.postal_code,
          notes: s.notes,
          isActive: s.is_active === 1,
          createdAt: new Date(s.created_at)
        }
      });
    }

    // 3. Products
    console.log('Migrating products...');
    const products = sqlite.prepare('SELECT * FROM products').all();
    for (const p: any of products) {
      await prisma.product.upsert({
        where: { id: p.id },
        update: {},
        create: {
          id: p.id,
          name: p.name,
          description: p.description,
          type: p.type,
          sku: p.sku,
          barcode: p.barcode,
          price: p.price,
          cost: p.cost,
          quantity: p.quantity,
          minQuantity: p.min_quantity,
          category: p.category,
          brand: p.brand,
          location: p.location,
          durationMinutes: p.duration_minutes,
          serviceDetails: p.service_details,
          supplierId: p.supplier_id,
          isActive: p.is_active === 1,
          createdAt: new Date(p.created_at)
        }
      });
    }

    // 4. Discounts
    console.log('Migrating discounts...');
    const discounts = sqlite.prepare('SELECT * FROM discounts').all();
    for (const d: any of discounts) {
      await prisma.discount.upsert({
        where: { id: d.id },
        update: {},
        create: {
          id: d.id,
          code: d.code,
          name: d.name,
          type: d.type,
          value: d.value,
          minPurchase: d.min_purchase,
          maxDiscount: d.max_discount,
          usageLimit: d.usage_limit,
          usedCount: d.used_count,
          validFrom: new Date(d.valid_from),
          validUntil: new Date(d.valid_until),
          isActive: d.is_active === 1,
          createdBy: d.created_by,
          createdAt: new Date(d.created_at)
        }
      });
    }

    // 5. Cash Shifts
    console.log('Migrating cash shifts...');
    const shifts = sqlite.prepare('SELECT * FROM cash_shifts').all();
    for (const cs: any of shifts) {
      await prisma.cashShift.upsert({
        where: { id: cs.id },
        update: {},
        create: {
          id: cs.id,
          userId: cs.user_id,
          openedAt: new Date(cs.opened_at),
          closedAt: cs.closed_at ? new Date(cs.closed_at) : null,
          openingCash: cs.opening_cash,
          closingCash: cs.closing_cash,
          systemCash: cs.system_cash,
          notes: cs.notes,
          status: cs.status
        }
      });
    }

    // 6. Sales
    console.log('Migrating sales...');
    const sales = sqlite.prepare('SELECT * FROM sales').all();
    for (const sl: any of sales) {
      await prisma.sale.upsert({
        where: { id: sl.id },
        update: {},
        create: {
          id: sl.id,
          invoiceNumber: sl.invoice_number,
          customerName: sl.customer_name,
          customerPhone: sl.customer_phone,
          customerEmail: sl.customer_email,
          subtotal: sl.subtotal,
          tax: sl.tax,
          discount: sl.discount,
          total: sl.total,
          paymentMethod: sl.payment_method,
          paymentStatus: sl.payment_status,
          notes: sl.notes,
          userId: sl.user_id,
          discountId: sl.discount_id,
          shiftId: sl.shift_id,
          createdAt: new Date(sl.created_at)
        }
      });
    }

    // 7. Sale Items
    console.log('Migrating sale items...');
    const saleItems = sqlite.prepare('SELECT * FROM sale_items').all();
    for (const si: any of saleItems) {
      await prisma.saleItem.upsert({
        where: { id: si.id },
        update: {},
        create: {
          id: si.id,
          saleId: si.sale_id,
          productId: si.product_id,
          quantity: si.quantity,
          price: si.price,
          unitCost: si.unit_cost,
          discount: si.discount,
          subtotal: si.subtotal,
          productName: si.product_name,
          productSku: si.product_sku,
          serviceSchedule: si.service_schedule ? new Date(si.service_schedule) : null,
          serviceStatus: si.service_status,
          serviceTechnician: si.service_technician,
          notes: si.notes,
          createdAt: new Date(si.created_at)
        }
      });
    }

    // 8. Stock Logs
    console.log('Migrating stock logs...');
    const stockLogs = sqlite.prepare('SELECT * FROM stock_logs').all();
    for (const sl: any of stockLogs) {
      await prisma.stockLog.upsert({
        where: { id: sl.id },
        update: {},
        create: {
          id: sl.id,
          productId: sl.product_id,
          type: sl.type,
          quantity: sl.quantity,
          balance: sl.balance,
          saleId: sl.sale_id,
          supplierId: sl.supplier_id,
          notes: sl.notes,
          userId: sl.user_id,
          createdAt: new Date(sl.created_at)
        }
      });
    }

    // 9. Returns
    console.log('Migrating returns...');
    const returns = sqlite.prepare('SELECT * FROM returns').all();
    for (const r: any of returns) {
      await prisma.return.upsert({
        where: { id: r.id },
        update: {},
        create: {
          id: r.id,
          saleId: r.sale_id,
          saleItemId: r.sale_item_id,
          productId: r.product_id,
          quantity: r.quantity,
          reason: r.reason,
          refundAmount: r.refund_amount,
          refundMethod: r.refund_method,
          status: r.status,
          processedBy: r.processed_by,
          notes: r.notes,
          createdAt: new Date(r.created_at)
        }
      });
    }

    // 10. Activity Logs
    console.log('Migrating activity logs...');
    const activityLogs = sqlite.prepare('SELECT * FROM activity_logs').all();
    for (const al: any of activityLogs) {
      await prisma.activityLog.upsert({
        where: { id: al.id },
        update: {},
        create: {
          id: al.id,
          userId: al.user_id,
          method: al.method,
          endpoint: al.endpoint,
          summary: al.summary,
          ipAddress: al.ip_address,
          createdAt: new Date(al.created_at)
        }
      });
    }

    // 11. Settings
    console.log('Migrating settings...');
    const settings = sqlite.prepare('SELECT * FROM settings').all();
    for (const st: any of settings) {
      await prisma.setting.upsert({
        where: { key: st.key },
        update: { value: String(st.value) },
        create: {
          key: st.key,
          value: String(st.value)
        }
      });
    }

    console.log('Data migration completed successfully!');
    
    // Resetting Postgres sequences (autoincrement)
    console.log('Resetting sequences...');
    const tables = [
      'users', 'suppliers', 'products', 'discounts', 'cash_shifts', 
      'sales', 'sale_items', 'stock_logs', 'returns', 'activity_logs'
    ];
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id), 0) + 1, false) FROM "${table}";`);
    }
    console.log('Sequences reset.');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
    sqlite.close();
  }
}

migrate();
