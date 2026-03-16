import { Router, Response } from 'express';
import { prisma } from '../db/index.js';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.js';

export const shiftsRouter = Router();

// GET /api/shifts/current - Cek shift aktif user saat ini
shiftsRouter.get('/current', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ status: 'error', message: 'Unauthorized' });
    return;
  }

  try {
    const shift = await prisma.cashShift.findFirst({
      where: { 
        userId,
        status: 'open' 
      },
      orderBy: { openedAt: 'desc' }
    });
    
    const formattedShift = shift ? {
      ...shift,
      user_id: shift.userId,
      opened_at: shift.openedAt,
      closed_at: shift.closedAt,
      opening_cash: shift.openingCash,
      closing_cash: shift.closingCash,
      system_cash: shift.systemCash
    } : null;

    res.json({ status: 'success', data: formattedShift, message: 'Status shift berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/shifts/open - Buka shift
shiftsRouter.post('/open', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { opening_cash, notes } = req.body;

  if (opening_cash === undefined || userId === undefined) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Modal awal wajib diisi' });
    return;
  }

  try {
    // Cek apakah sudah ada shift yang terbuka
    const openShift = await prisma.cashShift.findFirst({
      where: { userId, status: 'open' }
    });

    if (openShift) {
      res.status(400).json({ status: 'error', code: 'ALREADY_OPEN', message: 'Anda masih memiliki shift yang terbuka' });
      return;
    }

    const shift = await prisma.cashShift.create({
      data: {
        userId,
        openingCash: opening_cash,
        notes: notes || null,
        status: 'open'
      }
    });

    res.status(201).json({ status: 'success', data: { id: shift.id }, message: 'Shift berhasil dibuka' });
  } catch (error: any) {
    console.error('Shift Open Error:', error.message || error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/shifts/close - Tutup shift
shiftsRouter.post('/close', authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { closing_cash, notes } = req.body;

  if (closing_cash === undefined || userId === undefined) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Uang akhir wajib diisi' });
    return;
  }

  try {
    const shift = await prisma.cashShift.findFirst({
      where: { userId, status: 'open' }
    });

    if (!shift) {
      res.status(400).json({ status: 'error', code: 'NOT_FOUND', message: 'Tidak ada shift yang sedang terbuka' });
      return;
    }

    // Hitung system_cash: opening_cash + total sales dengan payment_method = 'cash' dalam shift ini
    const salesSummary = await prisma.sale.aggregate({
      _sum: { total: true },
      where: {
        shiftId: shift.id,
        paymentMethod: 'cash',
        paymentStatus: { in: ['paid', 'partial'] }
      }
    });

    const cashTotal = salesSummary._sum.total || 0;
    const systemCash = shift.openingCash + cashTotal;

    await prisma.cashShift.update({
      where: { id: shift.id },
      data: {
        closedAt: new Date(),
        closingCash: closing_cash,
        systemCash: systemCash,
        notes: notes || shift.notes,
        status: 'closed'
      }
    });

    res.json({ status: 'success', data: { system_cash: systemCash }, message: 'Shift berhasil ditutup' });
  } catch (error: any) {
    console.error('Shift Close Error:', error.message || error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/shifts - Riwayat shift (admin/owner)
shiftsRouter.get('/', authMiddleware, roleGuard(['admin', 'owner']), async (req: AuthRequest, res: Response) => {
  try {
    const shifts = await prisma.cashShift.findMany({
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: { openedAt: 'desc' }
    });

    // Format for frontend compatibility
    const formattedShifts = shifts.map(s => ({
      ...s,
      user_id: s.userId,
      opened_at: s.openedAt,
      closed_at: s.closedAt,
      opening_cash: s.openingCash,
      closing_cash: s.closingCash,
      system_cash: s.systemCash,
      cashier_name: s.user.username
    }));

    res.json({ status: 'success', data: formattedShifts, message: 'Riwayat shift berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/shifts/:id/report - Detail laporan shift
shiftsRouter.get('/:id/report', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const shiftId = parseInt(id);
    const shift = await prisma.cashShift.findUnique({
      where: { id: shiftId },
      include: {
        user: { select: { username: true } }
      }
    });

    if (!shift) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Shift tidak ditemukan' });
      return;
    }

    // Manual sum for summary to match previous format
    const summaryRaw = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      _count: { id: true },
      _sum: { total: true },
      where: {
        shiftId: shiftId,
        paymentStatus: { in: ['paid', 'partial'] }
      }
    });

    const summary = summaryRaw.map(s => ({
      payment_method: s.paymentMethod,
      transactions: s._count.id,
      revenue: s._sum.total || 0
    }));

    const transactions = await prisma.sale.findMany({
      where: { shiftId: shiftId },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        paymentMethod: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      status: 'success',
      data: {
        shift: { 
          ...shift, 
          user_id: shift.userId,
          opened_at: shift.openedAt,
          closed_at: shift.closedAt,
          opening_cash: shift.openingCash,
          closing_cash: shift.closingCash,
          system_cash: shift.systemCash,
          cashier_name: shift.user.username 
        },
        summary,
        transactions: transactions.map(t => ({
          ...t,
          invoice_number: t.invoiceNumber,
          payment_method: t.paymentMethod,
          created_at: t.createdAt
        }))
      },
      message: 'Laporan shift berhasil diambil'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});


