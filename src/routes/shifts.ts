import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.js';

export const shiftsRouter = Router();

// GET /api/shifts/current - Cek shift aktif user saat ini
shiftsRouter.get('/current', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const shift = await db.prepare(`
      SELECT * FROM cash_shifts 
      WHERE user_id = ? AND status = 'open' 
      ORDER BY opened_at DESC LIMIT 1
    `).get(userId);
    
    res.json({ status: 'success', data: shift || null, message: 'Status shift berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/shifts/open - Buka shift
shiftsRouter.post('/open', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { opening_cash, notes } = req.body;

  if (opening_cash === undefined) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Modal awal wajib diisi' });
    return;
  }

  try {
    // Cek apakah sudah ada shift yang terbuka
    const openShift = await db.prepare("SELECT id FROM cash_shifts WHERE user_id = ? AND status = 'open'").get(userId);
    if (openShift) {
      res.status(400).json({ status: 'error', code: 'ALREADY_OPEN', message: 'Anda masih memiliki shift yang terbuka' });
      return;
    }

    const info = await db.prepare(`
      INSERT INTO cash_shifts (user_id, opening_cash, notes, status)
      VALUES (?, ?, ?, 'open')
    `).run(userId, opening_cash, notes || null);

    res.status(201).json({ status: 'success', data: { id: (info as any).lastInsertRowid }, message: 'Shift berhasil dibuka' });
  } catch (error: any) {
    console.error('Shift Open Error:', error.message || error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/shifts/close - Tutup shift
shiftsRouter.post('/close', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { closing_cash, notes } = req.body;

  if (closing_cash === undefined) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Uang akhir wajib diisi' });
    return;
  }

  try {
    const shift = await db.prepare("SELECT * FROM cash_shifts WHERE user_id = ? AND status = 'open'").get(userId) as any;
    if (!shift) {
      res.status(400).json({ status: 'error', code: 'NOT_FOUND', message: 'Tidak ada shift yang sedang terbuka' });
      return;
    }

    // Hitung system_cash: opening_cash + total sales dengan payment_method = 'cash' dalam shift ini
    const salesSummary = await db.prepare(`
      SELECT COALESCE(SUM(total), 0) as cash_total 
      FROM sales 
      WHERE shift_id = ? AND payment_method = 'cash' AND payment_status IN ('paid', 'partial')
    `).get(shift.id) as any;

    const systemCash = shift.opening_cash + salesSummary.cash_total;

    await db.prepare(`
      UPDATE cash_shifts 
      SET closed_at = CURRENT_TIMESTAMP, closing_cash = ?, system_cash = ?, notes = ?, status = 'closed'
      WHERE id = ?
    `).run(closing_cash, systemCash, notes || shift.notes, shift.id);

    res.json({ status: 'success', data: { system_cash: systemCash }, message: 'Shift berhasil ditutup' });
  } catch (error: any) {
    console.error('Shift Close Error:', error.message || error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/shifts - Riwayat shift (admin/owner)
shiftsRouter.get('/', authMiddleware, roleGuard(['admin', 'owner']), async (req: AuthRequest, res: Response) => {
  try {
    const shifts = await db.prepare(`
      SELECT cs.*, u.username as cashier_name 
      FROM cash_shifts cs
      JOIN users u ON cs.user_id = u.id
      ORDER BY cs.opened_at DESC
    `).all();
    res.json({ status: 'success', data: shifts, message: 'Riwayat shift berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/shifts/:id/report - Detail laporan shift
shiftsRouter.get('/:id/report', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const shift = await db.prepare(`
      SELECT cs.*, u.username as cashier_name 
      FROM cash_shifts cs
      JOIN users u ON cs.user_id = u.id
      WHERE cs.id = ?
    `).get(id) as any;

    if (!shift) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Shift tidak ditemukan' });
      return;
    }

    const summary = await db.prepare(`
      SELECT 
        payment_method,
        COUNT(id) as transactions,
        SUM(total) as revenue
      FROM sales
      WHERE shift_id = ? AND payment_status IN ('paid', 'partial')
      GROUP BY payment_method
    `).all(id) as any[];

    const transactions = await db.prepare(`
      SELECT id, invoice_number, total, payment_method, created_at 
      FROM sales 
      WHERE shift_id = ? 
      ORDER BY created_at DESC
    `).all(id);

    res.json({
      status: 'success',
      data: {
        shift,
        summary,
        transactions
      },
      message: 'Laporan shift berhasil diambil'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

