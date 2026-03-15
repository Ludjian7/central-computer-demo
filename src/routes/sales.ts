import { Router, Response } from 'express';
import { prisma } from '../db/index.js';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.js';

export const salesRouter = Router();

// GET /api/sales - Daftar transaksi
salesRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { start_date, end_date, status, payment_method } = req.query as any;

  try {
    const where: any = {};

    if (start_date && end_date) {
      where.createdAt = {
        gte: new Date(`${start_date}T00:00:00.000Z`),
        lte: new Date(`${end_date}T23:59:59.999Z`)
      };
    }

    if (status) {
      where.paymentStatus = status;
    }

    if (payment_method) {
      where.paymentMethod = payment_method;
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        user: { select: { username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format for frontend
    const formattedSales = sales.map(s => ({
      ...s,
      cashier_name: s.user.username
    }));

    res.json({ status: 'success', data: formattedSales, message: 'Daftar transaksi berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/sales - Buat transaksi baru (Checkout POS)
salesRouter.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const payload = req.body;
  const userId = req.user?.id;

  if (!payload.customer_name || !payload.payment_method || !payload.items || !Array.isArray(payload.items) || payload.items.length === 0 || !userId) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Data transaksi tidak lengkap' });
    return;
  }

  try {
    // 0. Cek shift aktif (Wajib di POS)
    const activeShift = await prisma.cashShift.findFirst({
      where: { userId, status: 'open' }
    });

    if (!activeShift) {
      res.status(400).json({ status: 'error', code: 'SHIFT_REQUIRED', message: 'Anda harus membuka shift kasir terlebih dahulu' });
      return;
    }

    const shiftId = activeShift.id;

    // Use Prisma transaction for checkout
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate Invoice Number (INV-YYYYMMDD-XXXX)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;
      
      const lastSale = await tx.sale.findFirst({
        where: { invoiceNumber: { startsWith: `INV-${dateStr}-` } },
        orderBy: { id: 'desc' }
      });
      
      let seq = 1;
      if (lastSale) {
        const parts = lastSale.invoiceNumber.split('-');
        seq = parseInt(parts[parts.length - 1], 10) + 1;
      }
      const invoiceNumber = `INV-${dateStr}-${seq.toString().padStart(4, '0')}`;

      // 2. Calculate totals and prepare items
      let subtotal = 0;
      let totalDiscount = parseInt(payload.discount || 0);
      let tax = parseInt(payload.tax || 0);

      const processedItems = [];

      for (const item of payload.items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0) {
          throw new Error('Item produk tidak valid');
        }

        const product = await tx.product.findUnique({ 
          where: { id: parseInt(item.product_id), isActive: true } 
        });

        if (!product) {
          throw new Error(`Produk dengan ID ${item.product_id} tidak ditemukan atau tidak aktif`);
        }

        if (product.type === 'physical' && product.quantity < item.quantity) {
          throw new Error(`Stok tidak mencukupi untuk produk ${product.name}. Sisa stok: ${product.quantity}`);
        }

        const itemDiscount = parseInt(item.discount || 0);
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
          userId: userId,
          discountId: payload.discount_id ? parseInt(payload.discount_id) : null,
          shiftId: shiftId
        }
      });

      // 4. Insert Items & Update Stock
      for (const item of processedItems) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: parseInt(item.product_id),
            quantity: parseInt(item.quantity),
            price: parseInt(item.price),
            discount: parseInt(item.discount || 0),
            subtotal: parseInt(item.itemSubtotal),
            productName: item.product_name,
            productSku: item.product_sku,
            unitCost: parseInt(item.unit_cost),
            serviceSchedule: item.type === 'service' ? (item.service_schedule ? new Date(item.service_schedule) : null) : null,
            serviceStatus: item.type === 'service' ? (item.service_status || 'scheduled') : null,
            serviceTechnician: item.type === 'service' ? (item.service_technician ? parseInt(item.service_technician) : null) : null,
            notes: item.notes || null
          }
        });

        if (item.type === 'physical') {
          const newBalance = item.current_quantity - item.quantity;
          await tx.product.update({
            where: { id: parseInt(item.product_id) },
            data: { quantity: newBalance }
          });

          await tx.stockLog.create({
            data: {
              productId: parseInt(item.product_id),
              type: 'out',
              quantity: parseInt(item.quantity),
              balance: newBalance,
              saleId: sale.id,
              notes: `Penjualan ${invoiceNumber}`,
              userId: userId
            }
          });
        }
      }

      // 5. Update discount used_count if exists
      if (payload.discount_id) {
        await tx.discount.update({
          where: { id: parseInt(payload.discount_id) },
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
  const { start_date, end_date, status, payment_method } = req.query as any;

  try {
    const where: any = {};
    if (start_date && end_date) {
      where.createdAt = {
        gte: new Date(`${start_date}T00:00:00.000Z`),
        lte: new Date(`${end_date}T23:59:59.999Z`)
      };
    }
    if (status) where.paymentStatus = status;
    if (payment_method) where.paymentMethod = payment_method;

    const sales = await prisma.sale.findMany({
      where,
      include: {
        user: { select: { username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (sales.length === 0) {
      const headers = ['No Invoice', 'Tanggal', 'Nama Pelanggan', 'No. HP', 'Metode Bayar', 'Subtotal', 'Pajak', 'Diskon', 'Total', 'Status Pembayaran', 'Kasir', 'Catatan'];
      const csv = headers.join(',') + '\n';
      const filename = `laporan_penjualan_${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send('\uFEFF' + csv);
      return;
    }

    const headers = ['No Invoice', 'Tanggal', 'Nama Pelanggan', 'No. HP', 'Metode Bayar', 'Subtotal', 'Pajak', 'Diskon', 'Total', 'Status Pembayaran', 'Kasir', 'Catatan'];
    const csvRows = [headers.join(',')];

    for (const s of sales) {
      const row = [
        s.invoiceNumber,
        s.createdAt.toISOString(),
        s.customerName,
        s.customerPhone || '',
        s.paymentMethod,
        s.subtotal,
        s.tax,
        s.discount,
        s.total,
        s.paymentStatus,
        s.user.username,
        s.notes || ''
      ].map(val => {
        const escaped = String(val).replace(/"/g, '""');
        return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
      });
      csvRows.push(row.join(','));
    }

    const csv = csvRows.join('\n');
    const filename = `laporan_penjualan_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('CSV Export Error:', error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Gagal mengekspor data' });
  }
});

// GET /api/sales/:id - Detail transaksi & Invoice
salesRouter.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { username: true } },
        items: {
          include: {
            technician: { select: { username: true } }
          }
        }
      }
    });

    if (!sale) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Transaksi tidak ditemukan' });
      return;
    }

    // Format for frontend
    const formattedSale = {
      ...sale,
      cashier_name: sale.user.username,
      items: sale.items.map(item => ({
        ...item,
        technician_name: item.technician?.username || null
      }))
    };

    res.json({ 
      status: 'success', 
      data: formattedSale, 
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
    await prisma.sale.update({
      where: { id: parseInt(id) },
      data: { paymentStatus: payment_status }
    });

    res.json({ status: 'success', data: null, message: 'Status pembayaran berhasil diupdate' });
  } catch (error) {
    console.error(error);
    if ((error as any).code === 'P2025') {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Transaksi tidak ditemukan' });
    } else {
      res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
    }
  }
});


