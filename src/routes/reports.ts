import { Router, Response } from 'express';
import { prisma } from '../db/index.js';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.js';

export const reportsRouter = Router();

// Middleware khusus untuk laporan (hanya admin dan owner)
reportsRouter.use(authMiddleware, roleGuard(['admin', 'owner']));

// Helper to build date range filter
function buildDateWhere(start_date?: string, end_date?: string) {
  if (start_date && end_date) {
    return {
      gte: new Date(`${start_date}T00:00:00.000Z`),
      lte: new Date(`${end_date}T23:59:59.999Z`)
    };
  }
  return undefined;
}

// GET /api/reports/summary - Ringkasan Dashboard
reportsRouter.get('/summary', async (req: AuthRequest, res: Response) => {
  const { start_date, end_date } = req.query as any;
  try {
    const dateWhere = buildDateWhere(start_date, end_date);
    const createdAtFilter = dateWhere ? { createdAt: dateWhere } : {};

    // 1. Total Pendapatan & Jumlah Transaksi
    const salesAgg = await prisma.sale.aggregate({
      _count: { id: true },
      _sum: { total: true },
      where: {
        paymentStatus: { in: ['paid', 'partial'] },
        ...createdAtFilter
      }
    });

    // 2. Layanan Aktif (Scheduled / In Progress)
    const activeServices = await prisma.saleItem.count({
      where: { serviceStatus: { in: ['scheduled', 'in_progress'] } }
    });

    // 3. Produk Stok Menipis
    const lowStock = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(id) as count FROM products
      WHERE type = 'physical' AND quantity <= min_quantity AND is_active = true
    `;

    res.json({
      status: 'success',
      data: {
        total_transactions: salesAgg._count.id,
        total_revenue: salesAgg._sum.total ?? 0,
        active_services: activeServices,
        low_stock_items: Number((lowStock[0] as any).count)
      },
      message: 'Ringkasan dashboard berhasil diambil'
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/reports/sales-trend - Tren Penjualan (Grafik)
reportsRouter.get('/sales-trend', async (req: AuthRequest, res: Response) => {
  const { start_date, end_date, period = 'daily' } = req.query as any;
  try {
    const dateWhere = buildDateWhere(start_date, end_date);

    let dateFormat = 'YYYY-MM-DD';
    if (period === 'weekly') dateFormat = 'IYYY-"W"IW';
    else if (period === 'monthly') dateFormat = 'YYYY-MM';
    else if (period === 'yearly') dateFormat = 'YYYY';

    const whereClause = dateWhere
      ? `WHERE payment_status IN ('paid', 'partial') AND created_at >= '${start_date}'::date AND created_at <= '${end_date}'::date + INTERVAL '1 day'`
      : `WHERE payment_status IN ('paid', 'partial')`;

    const trend = await prisma.$queryRawUnsafe(`
      SELECT 
        TO_CHAR(created_at, '${dateFormat}') as label,
        COUNT(id)::int as total_transactions,
        COALESCE(SUM(total), 0)::int as total_revenue
      FROM sales
      ${whereClause}
      GROUP BY label
      ORDER BY label ASC
    `);

    res.json({ status: 'success', data: trend, message: 'Tren penjualan berhasil diambil' });
  } catch (error) {
    console.error('Sales trend error:', error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/reports/top-products - Produk Terlaris
reportsRouter.get('/top-products', async (req: AuthRequest, res: Response) => {
  const { start_date, end_date, limit = 10 } = req.query as any;
  try {
    const whereClause = (start_date && end_date)
      ? `AND s.created_at >= '${start_date}'::date AND s.created_at < '${end_date}'::date + INTERVAL '1 day'`
      : '';

    const topProducts = await prisma.$queryRawUnsafe(`
      SELECT 
        si.product_id as id,
        si.product_name as name,
        si.product_sku,
        p.type,
        SUM(si.quantity)::int as quantity_sold,
        SUM(si.subtotal)::int as revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN products p ON si.product_id = p.id
      WHERE s.payment_status IN ('paid', 'partial') ${whereClause}
      GROUP BY si.product_id, si.product_name, si.product_sku, p.type
      ORDER BY quantity_sold DESC
      LIMIT ${parseInt(limit)}
    `);

    res.json({ status: 'success', data: topProducts, message: 'Produk terlaris berhasil diambil' });
  } catch (error) {
    console.error('Top products error:', error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/reports/technician-performance - Performa Teknisi
reportsRouter.get('/technician-performance', async (req: AuthRequest, res: Response) => {
  const { start_date, end_date } = req.query as any;
  try {
    const whereClause = (start_date && end_date)
      ? `AND s.created_at >= '${start_date}'::date AND s.created_at < '${end_date}'::date + INTERVAL '1 day'`
      : '';

    const performance = await prisma.$queryRawUnsafe(`
      SELECT 
        u.id as id,
        u.username as username,
        COUNT(si.id)::int as total_services,
        SUM(CASE WHEN si.service_status = 'completed' THEN 1 ELSE 0 END)::int as completed_services,
        SUM(CASE WHEN si.service_status = 'cancelled' THEN 1 ELSE 0 END)::int as cancelled_services
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN users u ON si.service_technician = u.id
      WHERE si.service_technician IS NOT NULL ${whereClause}
      GROUP BY u.id, u.username
      ORDER BY completed_services DESC
    `);

    res.json({ status: 'success', data: performance, message: 'Performa teknisi berhasil diambil' });
  } catch (error) {
    console.error('Technician performance error:', error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/reports/profit-loss - Laba Rugi
reportsRouter.get('/profit-loss', async (req: AuthRequest, res: Response) => {
  const { start_date, end_date } = req.query as any;
  try {
    const whereClause = (start_date && end_date)
      ? `AND s.created_at >= '${start_date}'::date AND s.created_at < '${end_date}'::date + INTERVAL '1 day'`
      : '';

    // 1. Summary
    const summary = await prisma.$queryRawUnsafe(`
        SELECT 
            COALESCE(SUM(s.total), 0)::int as total_revenue,
            COALESCE(SUM(si.quantity * COALESCE(si.unit_cost, 0)), 0)::int as total_cogs
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        WHERE s.payment_status IN ('paid', 'partial') ${whereClause}
    `) as any[];

    const totalRevenue = summary[0]?.total_revenue ?? 0;
    const totalCogs = summary[0]?.total_cogs ?? 0;
    const grossProfit = totalRevenue - totalCogs;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // 2. By Category
    const byCategory = await prisma.$queryRawUnsafe(`
        SELECT 
            p.category,
            SUM(si.subtotal)::int as revenue,
            SUM(si.quantity * COALESCE(si.unit_cost, 0))::int as cogs,
            SUM(si.subtotal - (si.quantity * COALESCE(si.unit_cost, 0)))::int as gross_profit
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        LEFT JOIN products p ON si.product_id = p.id
        WHERE s.payment_status IN ('paid', 'partial') ${whereClause}
        GROUP BY p.category
    `) as any[];

    // 3. By Period (Monthly)
    const byPeriod = await prisma.$queryRawUnsafe(`
        SELECT 
            TO_CHAR(s.created_at, 'YYYY-MM') as period,
            SUM(s.total)::int as revenue,
            SUM(si.quantity * COALESCE(si.unit_cost, 0))::int as cogs,
            SUM(s.total - (si.quantity * COALESCE(si.unit_cost, 0)))::int as gross_profit,
            COUNT(DISTINCT s.id)::int as transactions
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        WHERE s.payment_status IN ('paid', 'partial') ${whereClause}
        GROUP BY period
        ORDER BY period ASC
    `) as any[];

    res.json({
        status: 'success',
        data: {
            summary: {
                total_revenue: totalRevenue,
                total_cogs: totalCogs,
                gross_profit: grossProfit,
                gross_margin_pct: parseFloat(grossMarginPct.toFixed(1))
            },
            by_category: byCategory.map(c => ({
                ...c,
                margin_pct: c.revenue > 0 ? parseFloat(((c.gross_profit / c.revenue) * 100).toFixed(1)) : 0
            })),
            by_period: byPeriod
        },
        message: 'Laporan Laba Rugi berhasil dihitung'
    });
  } catch (error) {
    console.error('Profit loss error:', error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Gagal menghitung laporan laba rugi' });
  }
});
