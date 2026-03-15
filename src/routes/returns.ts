import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

export const returnsRouter = Router();

// POST /api/returns - Buat retur baru
returnsRouter.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { sale_id, sale_item_id, quantity, reason, refund_method } = req.body;
  const userId = req.user?.id;

  if (!sale_id || !sale_item_id || !quantity || !reason || !refund_method) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Semua field wajib diisi' });
    return;
  }

  try {
    // 1. Validasi sale_item
    const saleItem = await db.prepare('SELECT p.id as product_id, p.type, p.quantity as current_stock, si.quantity as ordered_qty, si.price, si.discount, s.payment_status FROM sale_items si JOIN sales s ON si.sale_id = s.id JOIN products p ON si.product_id = p.id WHERE si.id = ? AND si.sale_id = ?').get(sale_item_id, sale_id) as any;

    if (!saleItem) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Item transaksi tidak ditemukan' });
      return;
    }

    if (saleItem.payment_status !== 'paid' && saleItem.payment_status !== 'partial') {
      res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Hanya transaksi yang sudah dibayar yang bisa diretur' });
      return;
    }

    if (quantity > saleItem.ordered_qty) {
      res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Quantity retur tidak bisa melebihi quantity pembelian' });
      return;
    }

    if (saleItem.type !== 'physical') {
      res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Produk non-fisik (jasa) tidak bisa diretur stoknya' });
      return;
    }

    // Hitung refund amount: (harga - diskon) * qty
    const refundAmount = (saleItem.price - (saleItem.discount || 0)) * quantity;
    const newStockBalance = saleItem.current_stock + quantity;

    // Lakukan retur dalam transaksi
    const processReturn = db.transaction(async () => {
      // a. Insert retur
      const info = await db.prepare(`
        INSERT INTO returns (sale_id, sale_item_id, product_id, quantity, reason, refund_amount, refund_method, processed_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(sale_id, sale_item_id, saleItem.product_id, quantity, reason, refundAmount, refund_method, userId);
      const returnId = (info as any).lastInsertRowid;

      // b. Kembalikan stok
      await db.prepare('UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStockBalance, saleItem.product_id);

      // c. Catat ke stock_logs
      await db.prepare(`
        INSERT INTO stock_logs (product_id, type, quantity, balance, sale_id, notes, user_id)
        VALUES (?, 'in', ?, ?, ?, ?, ?)
      `).run(saleItem.product_id, quantity, newStockBalance, sale_id, `Retur barang INV-${sale_id}`, userId);

      return { returnId, refundAmount, newStockBalance };
    });

    const result = await processReturn();
    res.status(201).json({ status: 'success', data: result, message: 'Retur berhasil diproses' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/returns - List return
returnsRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { status, start_date, end_date } = req.query;

  try {
    let query = `
      SELECT r.*, p.name as product_name, s.invoice_number, u.username as processed_by_name
      FROM returns r
      JOIN products p ON r.product_id = p.id
      JOIN sales s ON r.sale_id = s.id
      JOIN users u ON r.processed_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }
    if (start_date && end_date) {
      query += ' AND date(r.created_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY r.created_at DESC';

    const returns = await db.prepare(query).all(...params);
    res.json({ status: 'success', data: returns, message: 'Daftar retur berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/returns/:id - Detail return
returnsRouter.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const detail = await db.prepare(`
      SELECT r.*, p.name as product_name, p.sku as product_sku, s.invoice_number, s.customer_name, u.username as processed_by_name
      FROM returns r
      JOIN products p ON r.product_id = p.id
      JOIN sales s ON r.sale_id = s.id
      JOIN users u ON r.processed_by = u.id
      WHERE r.id = ?
    `).get(id);

    if (!detail) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Data retur tidak ditemukan' });
      return;
    }

    res.json({ status: 'success', data: detail, message: 'Detail retur berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

