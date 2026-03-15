import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.js';

export const servicesRouter = Router();

// GET /api/services - Daftar layanan/servis
servicesRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { status, technician_id, start_date, end_date } = req.query;

  try {
    let query = `
      SELECT si.id, si.sale_id, si.product_name, si.service_schedule, si.service_status, si.notes, si.service_technician,
             s.invoice_number, s.customer_name, s.customer_phone,
             u.username as technician_name
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      LEFT JOIN users u ON si.service_technician = u.id
      WHERE p.type = 'service'
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND si.service_status = ?';
      params.push(status);
    }
    if (technician_id) {
      query += ' AND si.service_technician = ?';
      params.push(technician_id);
    }
    if (start_date && end_date) {
      query += ' AND date(si.service_schedule) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    query += ' ORDER BY si.service_schedule ASC';

    const services = await db.prepare(query).all(...params);
    res.json({ status: 'success', data: services, message: 'Daftar layanan berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// PATCH /api/services/:id/status - Update status layanan
servicesRouter.patch('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = req.user;

  if (!status || !['scheduled', 'in_progress', 'completed', 'cancelled'].includes(status)) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Status tidak valid' });
    return;
  }

  try {
    // Cek apakah user adalah admin/owner ATAU teknisi yang ditugaskan
    const serviceItem = await db.prepare('SELECT service_technician FROM sale_items WHERE id = ?').get(id) as any;
    
    if (!serviceItem) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Layanan tidak ditemukan' });
      return;
    }

    if (user?.role !== 'admin' && user?.role !== 'owner' && serviceItem.service_technician !== user?.id) {
      res.status(403).json({ 
        status: 'error', 
        code: 'FORBIDDEN', 
        message: 'Anda tidak memiliki akses untuk mengubah status layanan ini' 
      });
      return;
    }

    const info = await db.prepare('UPDATE sale_items SET service_status = ? WHERE id = ?').run(status, id);
    
    res.json({ status: 'success', data: null, message: 'Status layanan berhasil diupdate' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// PATCH /api/services/:id/technician - Assign technician
servicesRouter.patch('/:id/technician', authMiddleware, roleGuard(['admin', 'owner']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { technician_id } = req.body;

  if (!technician_id) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'ID Teknisi wajib diisi' });
    return;
  }

  try {
    // Verifikasi teknisi ada dan aktif
    const tech = await db.prepare('SELECT id FROM users WHERE id = ? AND is_active = 1').get(technician_id);
    if (!tech) {
      res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Teknisi tidak ditemukan atau tidak aktif' });
      return;
    }

    const info = await db.prepare('UPDATE sale_items SET service_technician = ? WHERE id = ?').run(technician_id, id);
    
    if ((info as any).changes === 0) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Layanan tidak ditemukan' });
      return;
    }

    res.json({ status: 'success', data: null, message: 'Teknisi berhasil ditugaskan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

