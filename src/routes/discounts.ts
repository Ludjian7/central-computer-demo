import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.js';

export const discountsRouter = Router();

// GET /api/discounts - List semua promo (admin/owner)
discountsRouter.get('/', authMiddleware, roleGuard(['admin', 'owner']), (req: AuthRequest, res: Response) => {
  try {
    const discounts = db.prepare('SELECT * FROM discounts ORDER BY created_at DESC').all();
    res.json({ status: 'success', data: discounts, message: 'Daftar promo berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/discounts - Buat promo baru (admin/owner)
discountsRouter.post('/', authMiddleware, roleGuard(['admin', 'owner']), (req: AuthRequest, res: Response) => {
  const { code, name, type, value, min_purchase, max_discount, usage_limit, valid_from, valid_until } = req.body;
  const userId = req.user?.id;

  if (!code || !name || !type || value === undefined || !valid_from || !valid_until) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Data promo tidak lengkap' });
    return;
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO discounts (code, name, type, value, min_purchase, max_discount, usage_limit, valid_from, valid_until, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      code.toUpperCase(), name, type, value, 
      min_purchase || 0, max_discount || null, usage_limit || null, 
      valid_from, valid_until, userId
    );

    res.status(201).json({ status: 'success', data: { id: info.lastInsertRowid }, message: 'Promo berhasil dibuat' });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ status: 'error', code: 'DUPLICATE_CODE', message: 'Kode promo sudah ada' });
      return;
    }
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// PATCH /api/discounts/:id/toggle - Toggle aktif/nonaktif
discountsRouter.patch('/:id/toggle', authMiddleware, roleGuard(['admin', 'owner']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const discount = db.prepare('SELECT is_active FROM discounts WHERE id = ?').get(id) as any;
    if (!discount) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Promo tidak ditemukan' });
      return;
    }

    const newStatus = discount.is_active ? 0 : 1;
    db.prepare('UPDATE discounts SET is_active = ? WHERE id = ?').run(newStatus, id);

    res.json({ status: 'success', data: { is_active: newStatus }, message: 'Status promo berhasil diubah' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/discounts/validate - Validasi voucher di POS
discountsRouter.post('/validate', authMiddleware, (req: AuthRequest, res: Response) => {
  const { code, subtotal } = req.body;

  if (!code || subtotal === undefined) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Kode and subtotal wajib diisi' });
    return;
  }

  try {
    const now = new Date().toISOString().slice(0, 10);
    const discount = db.prepare(`
      SELECT * FROM discounts 
      WHERE code = ? AND is_active = 1 
      AND ? BETWEEN valid_from AND valid_until
    `).get(code.toUpperCase(), now) as any;

    if (!discount) {
      res.status(400).json({ status: 'error', code: 'INVALID_VOUCHER', message: 'Voucher tidak valid atau sudah kadaluarsa' });
      return;
    }

    if (subtotal < discount.min_purchase) {
      res.status(400).json({ 
        status: 'error', 
        code: 'MIN_PURCHASE_NOT_MET', 
        message: `Minimal belanja untuk promo ini adalah Rp ${discount.min_purchase.toLocaleString('id-ID')}` 
      });
      return;
    }

    if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
      res.status(400).json({ status: 'error', code: 'USAGE_LIMIT_EXCEEDED', message: 'Kuota pemakaian voucher telah habis' });
      return;
    }

    let discountAmount = 0;
    if (discount.type === 'percent') {
      discountAmount = (subtotal * discount.value) / 100;
      if (discount.max_discount && discountAmount > discount.max_discount) {
        discountAmount = discount.max_discount;
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
