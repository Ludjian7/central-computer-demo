import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.js';

export const reportsRouter = Router();

// Middleware khusus untuk laporan (hanya admin dan owner)
reportsRouter.use(authMiddleware, roleGuard(['admin', 'owner']));

// GET /api/reports/summary - Ringkasan Dashboard
reportsRouter.get('/summary', (req: AuthRequest, res: Response) => {
  const { start_date, end_date } = req.query;

  try {
    let dateFilter = '';
    const params: any[] = [];

    if (start_date && end_date) {
      dateFilter = 'AND date(created_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    // 1. Total Pendapatan & Jumlah Transaksi
    const salesStats = db.prepare(`
      SELECT 
        COUNT(id) as total_transactions,
        COALESCE(SUM(total), 0) as total_revenue
      FROM sales
      WHERE payment_status IN ('paid', 'partial') ${dateFilter}
    `).get(...params) as any;

    // 2. Layanan Aktif (Scheduled / In Progress)
    const activeServices = db.prepare(`
      SELECT COUNT(id) as count
      FROM sale_items
      WHERE service_status IN ('scheduled', 'in_progress')
    `).get() as any;

    // 3. Produk Stok Menipis
    const lowStock = db.prepare(`
      SELECT COUNT(id) as count
      FROM products
      WHERE type = 'physical' AND quantity <= min_quantity AND is_active = 1
    `).get() as any;

    res.json({
      status: 'success',
      data: {
        total_transactions: salesStats.total_transactions,
        total_revenue: salesStats.total_revenue,
        active_services: activeServices.count,
        low_stock_items: lowStock.count
      },
      message: 'Ringkasan dashboard berhasil diambil'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/reports/sales-trend - Tren Penjualan (Grafik)
reportsRouter.get('/sales-trend', (req: AuthRequest, res: Response) => {
  const { start_date, end_date, period = 'daily' } = req.query;

  try {
    let dateFilter = '';
    const params: any[] = [];

    if (start_date && end_date) {
      dateFilter = 'AND date(created_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    let dateFormat = '%Y-%m-%d'; // daily
    if (period === 'weekly') {
      dateFormat = '%Y-W%W';
    } else if (period === 'monthly') {
      dateFormat = '%Y-%m';
    } else if (period === 'yearly') {
      dateFormat = '%Y';
    }

    const trend = db.prepare(`
      SELECT 
        strftime('${dateFormat}', created_at) as label,
        COUNT(id) as total_transactions,
        COALESCE(SUM(total), 0) as total_revenue
      FROM sales
      WHERE payment_status IN ('paid', 'partial') ${dateFilter}
      GROUP BY label
      ORDER BY label ASC
    `).all(...params);

    res.json({ status: 'success', data: trend, message: 'Tren penjualan berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/reports/top-products - Produk Terlaris
reportsRouter.get('/top-products', (req: AuthRequest, res: Response) => {
  const { start_date, end_date, limit = 10 } = req.query;

  try {
    let dateFilter = '';
    const params: any[] = [];

    if (start_date && end_date) {
      dateFilter = 'AND date(s.created_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    params.push(limit);

    const topProducts = db.prepare(`
      SELECT 
        si.product_id as id,
        si.product_name as name,
        si.product_sku,
        p.type,
        SUM(si.quantity) as quantity_sold,
        SUM(si.subtotal) as revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN products p ON si.product_id = p.id
      WHERE s.payment_status IN ('paid', 'partial') ${dateFilter}
      GROUP BY si.product_id, si.product_name, si.product_sku, p.type
      ORDER BY quantity_sold DESC
      LIMIT ?
    `).all(...params);

    res.json({ status: 'success', data: topProducts, message: 'Produk terlaris berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/reports/technician-performance - Performa Teknisi
reportsRouter.get('/technician-performance', (req: AuthRequest, res: Response) => {
  const { start_date, end_date } = req.query;

  try {
    let dateFilter = '';
    const params: any[] = [];

    if (start_date && end_date) {
      dateFilter = 'AND date(s.created_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    const performance = db.prepare(`
      SELECT 
        u.id as id,
        u.username as username,
        COUNT(si.id) as total_services,
        SUM(CASE WHEN si.service_status = 'completed' THEN 1 ELSE 0 END) as completed_services,
        SUM(CASE WHEN si.service_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_services
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN users u ON si.service_technician = u.id
      WHERE si.service_technician IS NOT NULL ${dateFilter}
      GROUP BY u.id, u.username
      ORDER BY completed_services DESC
    `).all(...params);

    res.json({ status: 'success', data: performance, message: 'Performa teknisi berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/reports/profit-loss - Laba Rugi
reportsRouter.get('/profit-loss', (req: AuthRequest, res: Response) => {
  const { start_date, end_date } = req.query;

  try {
    let dateFilter = '';
    const params: any[] = [];

    if (start_date && end_date) {
      dateFilter = 'AND date(s.created_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    // 1. Summary
    const summary = db.prepare(`
        SELECT 
            COALESCE(SUM(s.total), 0) as total_revenue,
            COALESCE(SUM(si.quantity * COALESCE(si.unit_cost, 0)), 0) as total_cogs
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        WHERE s.payment_status IN ('paid', 'partial') ${dateFilter}
    `).get(...params) as any;

    const totalRevenue = summary.total_revenue;
    const totalCogs = summary.total_cogs;
    const grossProfit = totalRevenue - totalCogs;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // 2. By Category
    const byCategory = db.prepare(`
        SELECT 
            p.category,
            SUM(si.subtotal) as revenue,
            SUM(si.quantity * COALESCE(si.unit_cost, 0)) as cogs,
            SUM(si.subtotal - (si.quantity * COALESCE(si.unit_cost, 0))) as gross_profit
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        LEFT JOIN products p ON si.product_id = p.id
        WHERE s.payment_status IN ('paid', 'partial') ${dateFilter}
        GROUP BY p.category
    `).all(...params) as any[];

    // 3. By Period (Monthly)
    const byPeriod = db.prepare(`
        SELECT 
            strftime('%Y-%m', s.created_at) as period,
            SUM(s.total) as revenue,
            SUM(si.quantity * COALESCE(si.unit_cost, 0)) as cogs,
            SUM(s.total - (si.quantity * COALESCE(si.unit_cost, 0))) as gross_profit,
            COUNT(DISTINCT s.id) as transactions
        FROM sales s
        JOIN sale_items si ON s.id = si.sale_id
        WHERE s.payment_status IN ('paid', 'partial') ${dateFilter}
        GROUP BY period
        ORDER BY period ASC
    `).all(...params);

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
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Gagal menghitung laporan laba rugi' });
  }
});
