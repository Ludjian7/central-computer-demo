import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.js';

export const salesRouter = Router();

// GET /api/sales - Daftar transaksi
salesRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    const sales = await db.prepare(query).all(...params);
    res.json({ status: 'success', data: sales, message: 'Daftar transaksi berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/sales - Buat transaksi baru (Checkout POS)
salesRouter.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const payload = req.body;
  const userId = req.user?.id;

  if (!payload.customer_name || !payload.payment_method || !payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Data transaksi tidak lengkap' });
    return;
  }

  try {
    // 0. Cek shift aktif (Wajib di POS)
    const activeShift = await db.prepare("SELECT id FROM cash_shifts WHERE user_id = ? AND status = 'open'").get(userId) as any;
    if (!activeShift) {
      res.status(400).json({ status: 'error', code: 'SHIFT_REQUIRED', message: 'Anda harus membuka shift kasir terlebih dahulu' });
      return;
    }

    const shiftId = activeShift.id;

    // 4. Use Prisma transaction for checkout
    const result = await (db as any).$transaction(async (tx: any) => {
      // 1. Generate Invoice Number (INV-YYYYMMDD-XXXX)
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      const lastSales = await tx.$queryRawUnsafe("SELECT invoice_number FROM sales WHERE invoice_number LIKE $1 ORDER BY id DESC LIMIT 1", `INV-${dateStr}-%`);
      const lastSale = (lastSales as any[])[0];
      
      let seq = 1;
      if (lastSale) {
        const lastSeq = parseInt(lastSale.invoice_number.split('-')[2], 10);
        seq = lastSeq + 1;
      }
      const invoiceNumber = `INV-${dateStr}-${seq.toString().padStart(4, '0')}`;

      // 2. Calculate totals and prepare items
      let subtotal = 0;
      let totalDiscount = payload.discount || 0;
      let tax = payload.tax || 0;

      const processedItems = [];

      for (const item of payload.items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0) {
          throw new Error('Item produk tidak valid');
        }

        const product = await tx.product.findFirst({ 
          where: { id: item.product_id, isActive: true } 
        });

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
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerName: payload.customer_name,
          customerPhone: payload.customer_phone || null,
          customerEmail: payload.customer_email || null,
          subtotal,
          tax,
          discount: totalDiscount,
          total,
          paymentMethod: payload.payment_method,
          paymentStatus: payload.payment_status || 'paid',
          notes: payload.notes || null,
          userId: userId!,
          discountId: payload.discount_id || null,
          shiftId: shiftId
        }
      });

      // 4. Insert Items & Update Stock
      for (const item of processedItems) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.product_id,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            subtotal: item.itemSubtotal,
            productName: item.product_name,
            productSku: item.product_sku,
            unitCost: item.unit_cost,
            serviceSchedule: item.type === 'service' ? (item.service_schedule ? new Date(item.service_schedule) : null) : null,
            serviceStatus: item.type === 'service' ? (item.service_status || 'scheduled') : null,
            serviceTechnician: item.type === 'service' ? (item.service_technician || null) : null,
            notes: item.notes || null
          }
        });

        if (item.type === 'physical') {
          const newBalance = item.current_quantity - item.quantity;
          await tx.product.update({
            where: { id: item.product_id },
            data: { quantity: newBalance }
          });

          await tx.stockLog.create({
            data: {
              productId: item.product_id,
              type: 'out',
              quantity: item.quantity,
              balance: newBalance,
              saleId: sale.id,
              notes: `Penjualan ${invoiceNumber}`,
              userId: userId!
            }
          });
        }
      }

      // 5. Update discount used_count if exists
      if (payload.discount_id) {
        await tx.discount.update({
          where: { id: payload.discount_id },
          data: { usedCount: { increment: 1 } }
        });
      }

      return { saleId: sale.id, invoiceNumber, total };
    });
    
    res.status(201).json({ status: 'success', data: result, message: 'Transaksi berhasil dibuat' });

  } catch (error: any) {
    console.error('Sales Error:', error.message || error);
    res.status(400).json({ status: 'error', code: 'TRANSACTION_FAILED', message: error.message || 'Gagal membuat transaksi' });
  }
});

// GET /api/sales/export - Export transaksi ke file CSV
salesRouter.get('/export', authMiddleware, roleGuard(['admin', 'owner']), async (req: AuthRequest, res: Response) => {
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

    const sales = await db.prepare(query).all(...params) as Record<string, any>[];

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
salesRouter.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const sale = await db.prepare(`
      SELECT s.*, u.username as cashier_name 
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(id) as any;

    if (!sale) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Transaksi tidak ditemukan' });
      return;
    }

    const items = await db.prepare(`
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
salesRouter.patch('/:id/status', authMiddleware, roleGuard(['admin', 'owner']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { payment_status } = req.body;

  if (!payment_status || !['pending', 'paid', 'partial', 'cancelled', 'refunded'].includes(payment_status)) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Status pembayaran tidak valid' });
    return;
  }

  try {
    const info = await db.prepare('UPDATE sales SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(payment_status, id);
    
    if ((info as any).changes === 0) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Transaksi tidak ditemukan' });
      return;
    }

    res.json({ status: 'success', data: null, message: 'Status pembayaran berhasil diupdate' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

