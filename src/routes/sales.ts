import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.js';

export const salesRouter = Router();

// GET /api/sales - Daftar transaksi
salesRouter.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { start_date, end_date, status, payment_method } = req.query;

  try {
    let query = `
      SELECT s.*, u.username as cashier_name 
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (start_date && end_date) {
      query += ' AND date(s.created_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    if (status) {
      query += ' AND s.payment_status = ?';
      params.push(status);
    }

    if (payment_method) {
      query += ' AND s.payment_method = ?';
      params.push(payment_method);
    }

    query += ' ORDER BY s.created_at DESC';

    const sales = db.prepare(query).all(...params);
    res.json({ status: 'success', data: sales, message: 'Daftar transaksi berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/sales - Buat transaksi baru (Checkout POS)
salesRouter.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const payload = req.body;
  const userId = req.user?.id;

  if (!payload.customer_name || !payload.payment_method || !payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Data transaksi tidak lengkap' });
    return;
  }

  try {
    // 0. Cek shift aktif (Wajib di POS)
    const activeShift = db.prepare("SELECT id FROM cash_shifts WHERE user_id = ? AND status = 'open'").get(userId) as any;
    if (!activeShift) {
      res.status(400).json({ status: 'error', code: 'SHIFT_REQUIRED', message: 'Anda harus membuka shift kasir terlebih dahulu' });
      return;
    }

    const shiftId = activeShift.id;

    const createSaleTx = db.transaction((data, uId, sId) => {
      // 1. Generate Invoice Number (INV-YYYYMMDD-XXXX)
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      const lastSale = db.prepare("SELECT invoice_number FROM sales WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1").get(`INV-${dateStr}-%`) as any;
      
      let seq = 1;
      if (lastSale) {
        const lastSeq = parseInt(lastSale.invoice_number.split('-')[2], 10);
        seq = lastSeq + 1;
      }
      const invoiceNumber = `INV-${dateStr}-${seq.toString().padStart(4, '0')}`;

      // 2. Calculate totals and prepare items
      let subtotal = 0;
      let totalDiscount = data.discount || 0;
      let tax = data.tax || 0;

      const processedItems = [];

      for (const item of data.items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0) {
          throw new Error('Item produk tidak valid');
        }

        const product = db.prepare("SELECT * FROM products WHERE id = ? AND is_active = 1").get(item.product_id) as any;
        if (!product) {
          throw new Error(`Produk dengan ID ${item.product_id} tidak ditemukan atau tidak aktif`);
        }

        if (product.type === 'physical' && product.quantity < item.quantity) {
          throw new Error(`Stok tidak mencukupi untuk produk ${product.name}. Sisa stok: ${product.quantity}`);
        }

        const itemDiscount = item.discount || 0;
        const itemSubtotal = (product.price * item.quantity) - itemDiscount;
        subtotal += itemSubtotal;

        processedItems.push({
          ...item,
          product_name: product.name,
          product_sku: product.sku,
          price: product.price,
          unit_cost: product.cost || 0,
          itemSubtotal,
          type: product.type,
          current_quantity: product.quantity
        });
      }

      const total = subtotal + tax - totalDiscount;

      // 3. Insert Sale
      const saleInsert = db.prepare(`
        INSERT INTO sales (invoice_number, customer_name, customer_phone, customer_email, subtotal, tax, discount, total, payment_method, payment_status, notes, user_id, discount_id, shift_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoiceNumber, data.customer_name, data.customer_phone || null, data.customer_email || null, 
        subtotal, tax, totalDiscount, total, data.payment_method, data.payment_status || 'paid', 
        data.notes || null, uId, data.discount_id || null, sId
      );

      const saleId = saleInsert.lastInsertRowid;

      // 4. Insert Items & Update Stock
      const itemInsert = db.prepare(`
        INSERT INTO sale_items (sale_id, product_id, quantity, price, discount, subtotal, product_name, product_sku, unit_cost, service_schedule, service_status, service_technician, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const stockUpdate = db.prepare(`UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
      const stockLogInsert = db.prepare(`
        INSERT INTO stock_logs (product_id, type, quantity, balance, sale_id, notes, user_id)
        VALUES (?, 'out', ?, ?, ?, ?, ?)
      `);

      for (const item of processedItems) {
        itemInsert.run(
          saleId, item.product_id, item.quantity, item.price, item.discount || 0, item.itemSubtotal,
          item.product_name, item.product_sku, item.unit_cost,
          item.type === 'service' ? (item.service_schedule || null) : null,
          item.type === 'service' ? (item.service_status || 'scheduled') : null,
          item.type === 'service' ? (item.service_technician || null) : null,
          item.notes || null
        );

        if (item.type === 'physical') {
          const newBalance = item.current_quantity - item.quantity;
          stockUpdate.run(newBalance, item.product_id);
          stockLogInsert.run(item.product_id, item.quantity, newBalance, saleId, `Penjualan ${invoiceNumber}`, uId);
        }
      }

      // 5. Update discount used_count if exists
      if (data.discount_id) {
        db.prepare('UPDATE discounts SET used_count = used_count + 1 WHERE id = ?').run(data.discount_id);
      }

      return { saleId, invoiceNumber, total };
    });
    
    // Pass shiftId to transaction
    const result = createSaleTx(payload, userId, shiftId);
    res.status(201).json({ status: 'success', data: result, message: 'Transaksi berhasil dibuat' });

  } catch (error: any) {
    console.error('Sales Error:', error.message || error);
    res.status(400).json({ status: 'error', code: 'TRANSACTION_FAILED', message: error.message || 'Gagal membuat transaksi' });
  }
});

// GET /api/sales/export - Export transaksi ke file CSV
salesRouter.get('/export', authMiddleware, roleGuard(['admin', 'owner']), (req: AuthRequest, res: Response) => {
  const { start_date, end_date, status, payment_method } = req.query;

  try {
    let query = `
      SELECT 
        s.invoice_number AS "No Invoice",
        datetime(s.created_at, '+7 hours') AS "Tanggal",
        s.customer_name AS "Nama Pelanggan",
        s.customer_phone AS "No. HP",
        s.payment_method AS "Metode Bayar",
        s.subtotal AS "Subtotal",
        s.tax AS "Pajak",
        s.discount AS "Diskon",
        s.total AS "Total",
        s.payment_status AS "Status Pembayaran",
        u.username AS "Kasir",
        s.notes AS "Catatan"
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (start_date && end_date) {
      query += ' AND date(s.created_at) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    if (status) {
      query += ' AND s.payment_status = ?';
      params.push(status);
    }
    if (payment_method) {
      query += ' AND s.payment_method = ?';
      params.push(payment_method);
    }

    query += ' ORDER BY s.created_at DESC';

    const sales = db.prepare(query).all(...params) as Record<string, any>[];

    // Build CSV
    if (sales.length === 0) {
      // Return CSV with headers only if no data
      const headers = ['No Invoice', 'Tanggal', 'Nama Pelanggan', 'No. HP', 'Metode Bayar', 'Subtotal', 'Pajak', 'Diskon', 'Total', 'Status Pembayaran', 'Kasir', 'Catatan'];
      const csv = headers.join(',') + '\n';
      const filename = `laporan_penjualan_${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send('\uFEFF' + csv); // BOM for proper Excel UTF-8 support
      return;
    }

    const headers = Object.keys(sales[0]);
    const csvRows = [
      headers.join(','),
      ...sales.map(row =>
        headers.map(col => {
          const val = row[col] ?? '';
          // Escape commas, newlines and quotes in cells
          const escaped = String(val).replace(/"/g, '""');
          return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
        }).join(',')
      )
    ];

    const csv = csvRows.join('\n');
    const filename = `laporan_penjualan_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM prefix for Excel UTF-8
  } catch (error) {
    console.error('CSV Export Error:', error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Gagal mengekspor data' });
  }
});

// GET /api/sales/:id - Detail transaksi & Invoice
salesRouter.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const sale = db.prepare(`
      SELECT s.*, u.username as cashier_name 
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(id) as any;

    if (!sale) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Transaksi tidak ditemukan' });
      return;
    }

    const items = db.prepare(`
      SELECT si.*, u.username as technician_name
      FROM sale_items si
      LEFT JOIN users u ON si.service_technician = u.id
      WHERE si.sale_id = ?
    `).all(id);

    res.json({ 
      status: 'success', 
      data: { ...sale, items }, 
      message: 'Detail transaksi berhasil diambil' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// PATCH /api/sales/:id/status - Update status pembayaran
salesRouter.patch('/:id/status', authMiddleware, roleGuard(['admin', 'owner']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { payment_status } = req.body;

  if (!payment_status || !['pending', 'paid', 'partial', 'cancelled', 'refunded'].includes(payment_status)) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Status pembayaran tidak valid' });
    return;
  }

  try {
    const info = db.prepare('UPDATE sales SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(payment_status, id);
    
    if (info.changes === 0) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Transaksi tidak ditemukan' });
      return;
    }

    res.json({ status: 'success', data: null, message: 'Status pembayaran berhasil diupdate' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});
