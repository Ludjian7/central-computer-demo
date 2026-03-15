import { Router, Response } from 'express';
import { prisma } from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

export const returnsRouter = Router();

// POST /api/returns - Buat retur baru
returnsRouter.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { sale_id, sale_item_id, quantity, reason, refund_method } = req.body;
  const userId = req.user?.id;

  if (!sale_id || !sale_item_id || !quantity || !reason || !refund_method || userId === undefined) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Semua field wajib diisi' });
    return;
  }

  try {
    const saleId = parseInt(sale_id);
    const saleItemId = parseInt(sale_item_id);
    const qty = parseInt(quantity);

    // 1. Validasi sale_item
    const saleItem = await prisma.saleItem.findUnique({
      where: { id: saleItemId },
      include: {
        sale: { select: { paymentStatus: true, invoiceNumber: true } },
        product: { select: { id: true, type: true, quantity: true } }
      }
    });

    if (!saleItem || saleItem.saleId !== saleId) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Item transaksi tidak ditemukan' });
      return;
    }

    if (saleItem.sale.paymentStatus !== 'paid' && saleItem.sale.paymentStatus !== 'partial') {
      res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Hanya transaksi yang sudah dibayar yang bisa diretur' });
      return;
    }

    if (qty > saleItem.quantity) {
      res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Quantity retur tidak bisa melebihi quantity pembelian' });
      return;
    }

    if (saleItem.product.type !== 'physical') {
      res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Produk non-fisik (jasa) tidak bisa diretur stoknya' });
      return;
    }

    // Hitung refund amount: (harga - diskon) * qty
    const refundAmount = (saleItem.price - (saleItem.discount || 0)) * qty;
    const newStockBalance = saleItem.product.quantity + qty;

    // Lakukan retur dalam transaksi
    const result = await prisma.$transaction(async (tx) => {
      // a. Insert retur
      const ret = await tx.return.create({
        data: {
          saleId,
          saleItemId,
          productId: saleItem.product.id,
          quantity: qty,
          reason,
          refundAmount,
          refundMethod: refund_method,
          processedBy: userId
        }
      });

      // b. Kembalikan stok
      await tx.product.update({
        where: { id: saleItem.product.id },
        data: { quantity: newStockBalance }
      });

      // c. Catat ke stock_logs
      await tx.stockLog.create({
        data: {
          productId: saleItem.product.id,
          type: 'in',
          quantity: qty,
          balance: newStockBalance,
          saleId: saleId,
          notes: `Retur barang ${saleItem.sale.invoiceNumber}`,
          userId: userId
        }
      });

      return { returnId: ret.id, refundAmount, newStockBalance };
    });

    res.status(201).json({ status: 'success', data: result, message: 'Retur berhasil diproses' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/returns - List return
returnsRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { status, start_date, end_date } = req.query as any;

  try {
    const where: any = {};
    if (status) where.status = status;
    if (start_date && end_date) {
      where.createdAt = {
        gte: new Date(`${start_date}T00:00:00.000Z`),
        lte: new Date(`${end_date}T23:59:59.999Z`)
      };
    }

    const returns = await prisma.return.findMany({
      where,
      include: {
        product: { select: { name: true } },
        sale: { select: { invoiceNumber: true } },
        processor: { select: { username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format for frontend
    const formattedReturns = returns.map(r => ({
      ...r,
      product_name: r.product.name,
      invoice_number: r.sale.invoiceNumber,
      processed_by_name: r.processor.username
    }));

    res.json({ status: 'success', data: formattedReturns, message: 'Daftar retur berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/returns/:id - Detail return
returnsRouter.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const ret = await prisma.return.findUnique({
      where: { id: parseInt(id) },
      include: {
        product: { select: { name: true, sku: true } },
        sale: { select: { invoiceNumber: true, customerName: true } },
        processor: { select: { username: true } }
      }
    });

    if (!ret) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Data retur tidak ditemukan' });
      return;
    }

    // Format for frontend
    const formattedDetail = {
      ...ret,
      product_name: ret.product.name,
      product_sku: ret.product.sku,
      invoice_number: ret.sale.invoiceNumber,
      customer_name: ret.sale.customerName,
      processed_by_name: ret.processor.username
    };

    res.json({ status: 'success', data: formattedDetail, message: 'Detail retur berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});


