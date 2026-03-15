import { Router, Response } from 'express';
import { prisma } from '../db/index.js';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.js';

export const servicesRouter = Router();

// GET /api/services - Daftar layanan/servis
servicesRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { status, technician_id, start_date, end_date } = req.query as any;

  try {
    const where: any = {
      product: { type: 'service' }
    };

    if (status) where.serviceStatus = status;
    if (technician_id) where.serviceTechnician = parseInt(technician_id);
    if (start_date && end_date) {
      where.serviceSchedule = {
        gte: new Date(`${start_date}T00:00:00.000Z`),
        lte: new Date(`${end_date}T23:59:59.999Z`)
      };
    }

    const services = await prisma.saleItem.findMany({
      where,
      include: {
        sale: { select: { invoiceNumber: true, customerName: true, customerPhone: true } },
        technician: { select: { username: true } }
      },
      orderBy: { serviceSchedule: 'asc' }
    });

    // Format for frontend
    const formattedServices = services.map(si => ({
      ...si,
      invoice_number: si.sale.invoiceNumber,
      customer_name: si.sale.customerName,
      customer_phone: si.sale.customerPhone,
      technician_name: si.technician?.username || null
    }));

    res.json({ status: 'success', data: formattedServices, message: 'Daftar layanan berhasil diambil' });
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
    const serviceId = parseInt(id);
    const serviceItem = await prisma.saleItem.findUnique({
      where: { id: serviceId },
      select: { serviceTechnician: true }
    });
    
    if (!serviceItem) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Layanan tidak ditemukan' });
      return;
    }

    if (user?.role !== 'admin' && user?.role !== 'owner' && serviceItem.serviceTechnician !== user?.id) {
      res.status(403).json({ 
        status: 'error', 
        code: 'FORBIDDEN', 
        message: 'Anda tidak memiliki akses untuk mengubah status layanan ini' 
      });
      return;
    }

    await prisma.saleItem.update({
      where: { id: serviceId },
      data: { serviceStatus: status }
    });
    
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
    const techId = parseInt(technician_id);
    const serviceId = parseInt(id);

    // Verifikasi teknisi ada dan aktif
    const tech = await prisma.user.findFirst({
      where: { id: techId, isActive: true }
    });
    if (!tech) {
      res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Teknisi tidak ditemukan atau tidak aktif' });
      return;
    }

    await prisma.saleItem.update({
      where: { id: serviceId },
      data: { serviceTechnician: techId }
    });

    res.json({ status: 'success', data: null, message: 'Teknisi berhasil ditugaskan' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Layanan tidak ditemukan' });
      return;
    }
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});


