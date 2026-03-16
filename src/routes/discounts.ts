import { Router, Response } from 'express';
import { prisma } from '../db/index.js';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.js';

export const discountsRouter = Router();

// GET /api/discounts - List semua promo (admin/owner)
discountsRouter.get('/', authMiddleware, roleGuard(['admin', 'owner']), async (req: AuthRequest, res: Response) => {
  try {
    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ status: 'success', data: discounts, message: 'Daftar promo berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/discounts - Buat promo baru (admin/owner)
discountsRouter.post('/', authMiddleware, roleGuard(['admin', 'owner']), async (req: AuthRequest, res: Response) => {
  const { code, name, type, value, min_purchase, max_discount, usage_limit, valid_from, valid_until } = req.body;
  const userId = req.user?.id;

  if (!code || !name || !type || value === undefined || !valid_from || !valid_until || userId === undefined) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Data promo tidak lengkap' });
    return;
  }

  try {
    const discount = await prisma.discount.create({
      data: {
        code: code.toUpperCase(),
        name,
        type,
        value: parseInt(value),
        minPurchase: parseInt(min_purchase || 0),
        maxDiscount: max_discount ? parseInt(max_discount) : null,
        usageLimit: usage_limit ? parseInt(usage_limit) : null,
        validFrom: new Date(valid_from),
        validUntil: new Date(valid_until),
        createdBy: userId
      }
    });

    res.status(201).json({ status: 'success', data: { id: discount.id }, message: 'Promo berhasil dibuat' });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ status: 'error', code: 'DUPLICATE_CODE', message: 'Kode promo sudah ada' });
      return;
    }
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// PATCH /api/discounts/:id/toggle - Toggle aktif/nonaktif
discountsRouter.patch('/:id/toggle', authMiddleware, roleGuard(['admin', 'owner']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const discountId = parseInt(id);
    const existing = await prisma.discount.findUnique({
      where: { id: discountId },
      select: { isActive: true }
    });

    if (!existing) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Promo tidak ditemukan' });
      return;
    }

    const updated = await prisma.discount.update({
      where: { id: discountId },
      data: { isActive: !existing.isActive }
    });

    res.json({ status: 'success', data: { is_active: updated.isActive }, message: 'Status promo berhasil diubah' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/discounts/validate - Validasi voucher di POS
discountsRouter.post('/validate', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { code, subtotal } = req.body;

  if (!code || subtotal === undefined) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Kode and subtotal wajib diisi' });
    return;
  }

  try {
    const now = new Date();
    const discount = await prisma.discount.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now }
      }
    });

    if (!discount) {
      res.status(400).json({ status: 'error', code: 'INVALID_VOUCHER', message: 'Voucher tidak valid atau sudah kadaluarsa' });
      return;
    }

    if (subtotal < discount.minPurchase) {
      res.status(400).json({ 
        status: 'error', 
        code: 'MIN_PURCHASE_NOT_MET', 
        message: `Minimal belanja untuk promo ini adalah Rp ${(discount.minPurchase || 0).toLocaleString('id-ID')}` 
      });
      return;
    }

    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      res.status(400).json({ status: 'error', code: 'USAGE_LIMIT_EXCEEDED', message: 'Kuota pemakaian voucher telah habis' });
      return;
    }

    let discountAmount = 0;
    if (discount.type === 'percent') {
      discountAmount = (subtotal * discount.value) / 100;
      if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
        discountAmount = discount.maxDiscount;
      }
    } else {
      discountAmount = discount.value;
    }

    res.json({
      status: 'success',
      data: {
        id: discount.id,
        code: discount.code,
        name: discount.name,
        discount_amount: discountAmount
      },
      message: 'Voucher berhasil diterapkan'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});


