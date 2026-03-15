import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.js';

export const productsRouter = Router();

// GET /api/products - Daftar produk aktif (semua role)
productsRouter.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { type, category, low_stock, q } = req.query;

  try {
    let query = 'SELECT * FROM products WHERE is_active = 1';
    const params: any[] = [];

    if (type === 'physical' || type === 'service') {
      query += ' AND type = ?';
      params.push(type);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (low_stock === 'true') {
      query += " AND type = 'physical' AND quantity <= min_quantity";
    }

    if (q) {
      query += ' AND (name LIKE ? OR sku LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }

    query += ' ORDER BY name ASC';

    const products = db.prepare(query).all(...params);
    res.json({ status: 'success', data: products, message: 'Daftar produk berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/products/low-stock - Produk stok menipis dengan info supplier
productsRouter.get('/low-stock', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const products = db.prepare(`
      SELECT p.*, s.name as supplier_name
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.type = 'physical' 
        AND p.quantity <= p.min_quantity 
        AND p.is_active = 1
      ORDER BY p.quantity ASC
    `).all();
    
    res.json({ status: 'success', data: products, message: 'Daftar stok menipis berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Gagal mengambil data stok menipis' });
  }
});

// POST /api/products - Tambah produk (admin)
productsRouter.post('/', authMiddleware, roleGuard(['admin']), (req: AuthRequest, res: Response) => {
  const { name, description, type, sku, barcode, price, cost, quantity, min_quantity, category, brand, location, duration_minutes, service_details, supplier_id } = req.body;

  if (!name || !type || !sku || price === undefined || !category) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Name, type, sku, price, dan category wajib diisi' });
    return;
  }

  if (type !== 'physical' && type !== 'service') {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Type harus physical atau service' });
    return;
  }

  try {
    // Cek SKU unik
    const existingSku = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
    if (existingSku) {
      res.status(400).json({ status: 'error', code: 'DUPLICATE_SKU', message: 'SKU sudah digunakan' });
      return;
    }

    const stmt = db.prepare(`
      INSERT INTO products (name, description, type, sku, barcode, price, cost, quantity, min_quantity, category, brand, location, duration_minutes, service_details, supplier_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      name, description || null, type, sku, barcode || null, price, cost || 0,
      type === 'physical' ? (quantity || 0) : 0,
      type === 'physical' ? (min_quantity || 2) : 2,
      category, brand || null, location || null,
      type === 'service' ? (duration_minutes || null) : null,
      type === 'service' ? (service_details || null) : null,
      supplier_id || null
    );

    res.status(201).json({ status: 'success', data: { id: info.lastInsertRowid }, message: 'Produk berhasil ditambahkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/products/:id - Detail produk
productsRouter.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(id);
    if (!product) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Produk tidak ditemukan' });
      return;
    }
    res.json({ status: 'success', data: product, message: 'Detail produk berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// PUT /api/products/:id - Update produk (admin)
productsRouter.put('/:id', authMiddleware, roleGuard(['admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, type, barcode, price, cost, quantity, min_quantity, category, brand, location, duration_minutes, service_details, supplier_id } = req.body;

  if (!name || !type || price === undefined || !category) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Name, type, price, dan category wajib diisi' });
    return;
  }

  try {
    const stmt = db.prepare(`
      UPDATE products 
      SET name = ?, description = ?, type = ?, barcode = ?, price = ?, cost = ?, quantity = ?, min_quantity = ?, category = ?, brand = ?, location = ?, duration_minutes = ?, service_details = ?, supplier_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_active = 1
    `);

    const info = stmt.run(
      name, description || null, type, barcode || null, price, cost || 0,
      type === 'physical' ? (quantity || 0) : 0,
      type === 'physical' ? (min_quantity || 2) : 2,
      category, brand || null, location || null,
      type === 'service' ? (duration_minutes || null) : null,
      type === 'service' ? (service_details || null) : null,
      supplier_id || null,
      id
    );

    if (info.changes === 0) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Produk tidak ditemukan' });
      return;
    }

    res.json({ status: 'success', data: null, message: 'Produk berhasil diupdate' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// PATCH /api/products/:id/deactivate - Nonaktifkan (admin)
productsRouter.patch('/:id/deactivate', authMiddleware, roleGuard(['admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    // Cek apakah ada sale_items dengan service_status in_progress atau scheduled
    const activeServices = db.prepare(`
      SELECT COUNT(*) as count FROM sale_items 
      WHERE product_id = ? AND service_status IN ('scheduled', 'in_progress')
    `).get(id) as { count: number };

    if (activeServices.count > 0) {
      res.status(400).json({ 
        status: 'error', 
        code: 'BAD_REQUEST', 
        message: 'Tidak bisa menonaktifkan produk/layanan karena masih ada servis yang sedang berjalan atau dijadwalkan' 
      });
      return;
    }

    const info = db.prepare('UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    
    if (info.changes === 0) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Produk tidak ditemukan' });
      return;
    }

    res.json({ status: 'success', data: null, message: 'Produk berhasil dinonaktifkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/products/:id/restock - Tambah stok (admin)
productsRouter.post('/:id/restock', authMiddleware, roleGuard(['admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { quantity, supplier_id, notes } = req.body;
  const userId = req.user?.id;

  if (!quantity || quantity <= 0) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Jumlah restock harus lebih dari 0' });
    return;
  }

  try {
    const product = db.prepare('SELECT type, quantity FROM products WHERE id = ? AND is_active = 1').get(id) as any;
    
    if (!product) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Produk tidak ditemukan' });
      return;
    }

    if (product.type !== 'physical') {
      res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Hanya produk fisik yang bisa di-restock' });
      return;
    }

    const newBalance = product.quantity + quantity;

    // Gunakan transaksi untuk memastikan atomicity
    const restockTransaction = db.transaction(() => {
      // 1. Update quantity di tabel products
      db.prepare('UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newBalance, id);
      
      // 2. Insert ke stock_logs
      db.prepare(`
        INSERT INTO stock_logs (product_id, type, quantity, balance, supplier_id, notes, user_id)
        VALUES (?, 'in', ?, ?, ?, ?, ?)
      `).run(id, quantity, newBalance, supplier_id || null, notes || null, userId);
    });

    restockTransaction();

    res.json({ status: 'success', data: { balance: newBalance }, message: 'Stok berhasil ditambahkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/products/:id/stock-log - Riwayat perubahan stok
productsRouter.get('/:id/stock-log', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const logs = db.prepare(`
      SELECT sl.*, u.username, s.name as supplier_name 
      FROM stock_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      LEFT JOIN suppliers s ON sl.supplier_id = s.id
      WHERE sl.product_id = ?
      ORDER BY sl.created_at DESC
    `).all(id);

    res.json({ status: 'success', data: logs, message: 'Riwayat stok berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});
