import { Router, Response } from 'express';
import { prisma } from '../db/index.js';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.js';

export const suppliersRouter = Router();

// GET /api/suppliers - Daftar supplier (semua role)
suppliersRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json({ status: 'success', data: suppliers, message: 'Daftar supplier berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/suppliers - Tambah supplier (admin)
suppliersRouter.post('/', authMiddleware, roleGuard(['admin']), async (req: AuthRequest, res: Response) => {
  const { name, contact_person, email, phone, address, city, postal_code, notes } = req.body;

  if (!name || !contact_person || !phone || !city) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Nama, contact person, phone, dan city wajib diisi' });
    return;
  }

  try {
    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson: contact_person,
        email: email || null,
        phone,
        address: address || null,
        city,
        postalCode: postal_code || null,
        notes: notes || null
      }
    });
    
    res.status(201).json({ 
      status: 'success', 
      data: { id: supplier.id }, 
      message: 'Supplier berhasil ditambahkan' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/suppliers/:id - Detail + daftar produk supplier ini
suppliersRouter.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const supplier = await prisma.supplier.findFirst({
      where: { id: parseInt(id), isActive: true },
      include: {
        products: {
          where: { isActive: true }
        }
      }
    });

    if (!supplier) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Supplier tidak ditemukan' });
      return;
    }

    res.json({ 
      status: 'success', 
      data: supplier, 
      message: 'Detail supplier berhasil diambil' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// PUT /api/suppliers/:id - Update supplier (admin)
suppliersRouter.put('/:id', authMiddleware, roleGuard(['admin']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, contact_person, email, phone, address, city, postal_code, notes } = req.body;

  if (!name || !contact_person || !phone || !city) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Nama, contact person, phone, dan city wajib diisi' });
    return;
  }

  try {
    const supplier = await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: {
        name,
        contactPerson: contact_person,
        email: email || null,
        phone,
        address: address || null,
        city,
        postalCode: postal_code || null,
        notes: notes || null
      }
    });

    res.json({ status: 'success', data: null, message: 'Supplier berhasil diupdate' });
  } catch (error) {
    console.error(error);
    if ((error as any).code === 'P2025') {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Supplier tidak ditemukan' });
    } else {
      res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
    }
  }
});

// PATCH /api/suppliers/:id/deactivate - Nonaktifkan (admin)
suppliersRouter.patch('/:id/deactivate', authMiddleware, roleGuard(['admin']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const supplierId = parseInt(id);
    // Cek apakah ada produk aktif yang berelasi dengan supplier ini
    const activeProductsCount = await prisma.product.count({
      where: { supplierId, isActive: true }
    });
    
    if (activeProductsCount > 0) {
      res.status(400).json({ 
        status: 'error', 
        code: 'BAD_REQUEST', 
        message: 'Tidak bisa menonaktifkan supplier karena masih memiliki produk aktif' 
      });
      return;
    }

    await prisma.supplier.update({
      where: { id: supplierId },
      data: { isActive: false }
    });

    res.json({ status: 'success', data: null, message: 'Supplier berhasil dinonaktifkan' });
  } catch (error) {
    console.error(error);
    if ((error as any).code === 'P2025') {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Supplier tidak ditemukan' });
    } else {
      res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
    }
  }
});

