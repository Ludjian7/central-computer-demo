import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.js';

export const suppliersRouter = Router();

// GET /api/suppliers - Daftar supplier (semua role)
suppliersRouter.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const suppliers = db.prepare('SELECT * FROM suppliers WHERE is_active = 1 ORDER BY name ASC').all();
    res.json({ status: 'success', data: suppliers, message: 'Daftar supplier berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/suppliers - Tambah supplier (admin)
suppliersRouter.post('/', authMiddleware, roleGuard(['admin']), (req: AuthRequest, res: Response) => {
  const { name, contact_person, email, phone, address, city, postal_code, notes } = req.body;

  if (!name || !contact_person || !phone || !city) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Nama, contact person, phone, dan city wajib diisi' });
    return;
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO suppliers (name, contact_person, email, phone, address, city, postal_code, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, contact_person, email || null, phone, address || null, city, postal_code || null, notes || null);
    
    res.status(201).json({ 
      status: 'success', 
      data: { id: info.lastInsertRowid }, 
      message: 'Supplier berhasil ditambahkan' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/suppliers/:id - Detail + daftar produk supplier ini
suppliersRouter.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ? AND is_active = 1').get(id) as any;
    if (!supplier) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Supplier tidak ditemukan' });
      return;
    }

    const products = db.prepare('SELECT * FROM products WHERE supplier_id = ? AND is_active = 1').all(id);

    res.json({ 
      status: 'success', 
      data: { ...supplier, products }, 
      message: 'Detail supplier berhasil diambil' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// PUT /api/suppliers/:id - Update supplier (admin)
suppliersRouter.put('/:id', authMiddleware, roleGuard(['admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, contact_person, email, phone, address, city, postal_code, notes } = req.body;

  if (!name || !contact_person || !phone || !city) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Nama, contact person, phone, dan city wajib diisi' });
    return;
  }

  try {
    const stmt = db.prepare(`
      UPDATE suppliers 
      SET name = ?, contact_person = ?, email = ?, phone = ?, address = ?, city = ?, postal_code = ?, notes = ?
      WHERE id = ? AND is_active = 1
    `);
    const info = stmt.run(name, contact_person, email || null, phone, address || null, city, postal_code || null, notes || null, id);
    
    if (info.changes === 0) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Supplier tidak ditemukan' });
      return;
    }

    res.json({ status: 'success', data: null, message: 'Supplier berhasil diupdate' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// PATCH /api/suppliers/:id/deactivate - Nonaktifkan (admin)
suppliersRouter.patch('/:id/deactivate', authMiddleware, roleGuard(['admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    // Cek apakah ada produk aktif yang berelasi dengan supplier ini
    const activeProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE supplier_id = ? AND is_active = 1').get(id) as { count: number };
    
    if (activeProducts.count > 0) {
      res.status(400).json({ 
        status: 'error', 
        code: 'BAD_REQUEST', 
        message: 'Tidak bisa menonaktifkan supplier karena masih memiliki produk aktif' 
      });
      return;
    }

    const info = db.prepare('UPDATE suppliers SET is_active = 0 WHERE id = ?').run(id);
    
    if (info.changes === 0) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Supplier tidak ditemukan' });
      return;
    }

    res.json({ status: 'success', data: null, message: 'Supplier berhasil dinonaktifkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});
