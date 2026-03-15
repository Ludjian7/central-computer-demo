import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.js';

export const productsRouter = Router();

// GET /api/products - Daftar produk aktif (semua role)
productsRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { type, category, low_stock, q } = req.query;

  try {
    const where: any = { isActive: true };

    if (type === 'physical' || type === 'service') {
      where.type = type;
    }

    if (category) {
      where.category = category as string;
    }

    if (low_stock === 'true') {
      where.type = 'physical';
      where.quantity = { lte: { name: 'minQuantity' } }; // This is complex in prisma, better use raw for this one or refine
    }

    // Since the original has complex logic, let's use Prisma findMany for simple filters
    // and fallback to raw if needed. For now, let's refactor to standard Prisma for better reliability.
    
    let products;
    if (low_stock === 'true' || q) {
      // Fallback to raw for complex search/comparisons for speed in migration
      let query = 'SELECT * FROM products WHERE is_active = true';
      const params: any[] = [];
      let paramCount = 1;

      if (type === 'physical' || type === 'service') {
        query += ` AND type = $${paramCount++}`;
        params.push(type);
      }

      if (category) {
        query += ` AND category = $${paramCount++}`;
        params.push(category);
      }

      if (low_stock === 'true') {
        query += " AND type = 'physical' AND quantity <= min_quantity";
      }

      if (q) {
        query += ` AND (name ILIKE $${paramCount} OR sku ILIKE $${paramCount})`;
        params.push(`%${q}%`);
      }

      query += ' ORDER BY name ASC';
      products = await (db as any).$queryRawUnsafe(query, ...params);
    } else {
      products = await (db as any).product.findMany({
        where,
        orderBy: { name: 'asc' }
      });
    }

    res.json({ status: 'success', data: products, message: 'Daftar produk berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/products/low-stock - Produk stok menipis dengan info supplier
productsRouter.get('/low-stock', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const products = await (db as any).$queryRawUnsafe(`
      SELECT p.*, s.name as supplier_name
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.type = 'physical' 
        AND p.quantity <= p.min_quantity 
        AND p.is_active = true
      ORDER BY p.quantity ASC
    `);
    
    res.json({ status: 'success', data: products, message: 'Daftar stok menipis berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Gagal mengambil data stok menipis' });
  }
});

// POST /api/products - Tambah produk (admin)
productsRouter.post('/', authMiddleware, roleGuard(['admin']), async (req: AuthRequest, res: Response) => {
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
    const existingSku = await (db as any).product.findUnique({ where: { sku } });
    if (existingSku) {
      res.status(400).json({ status: 'error', code: 'DUPLICATE_SKU', message: 'SKU sudah digunakan' });
      return;
    }

    const product = await (db as any).product.create({
      data: {
        name,
        description: description || null,
        type,
        sku,
        barcode: barcode || null,
        price: Number(price),
        cost: Number(cost || 0),
        quantity: type === 'physical' ? Number(quantity || 0) : 0,
        minQuantity: type === 'physical' ? Number(min_quantity || 2) : 2,
        category,
        brand: brand || null,
        location: location || null,
        durationMinutes: type === 'service' ? Number(duration_minutes || null) : null,
        serviceDetails: type === 'service' ? (service_details || null) : null,
        supplierId: supplier_id || null
      }
    });

    res.status(201).json({ status: 'success', data: { id: product.id }, message: 'Produk berhasil ditambahkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/products/:id - Detail produk
productsRouter.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const product = await (db as any).product.findFirst({ 
      where: { id: parseInt(id), isActive: true } 
    });
    
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
productsRouter.put('/:id', authMiddleware, roleGuard(['admin']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, type, barcode, price, cost, quantity, min_quantity, category, brand, location, duration_minutes, service_details, supplier_id } = req.body;

  if (!name || !type || price === undefined || !category) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Name, type, price, dan category wajib diisi' });
    return;
  }

  try {
    const product = await (db as any).product.updateMany({
      where: { id: parseInt(id), isActive: true },
      data: {
        name,
        description: description || null,
        type,
        barcode: barcode || null,
        price: Number(price),
        cost: Number(cost || 0),
        quantity: type === 'physical' ? Number(quantity || 0) : 0,
        minQuantity: type === 'physical' ? Number(min_quantity || 2) : 2,
        category,
        brand: brand || null,
        location: location || null,
        durationMinutes: type === 'service' ? Number(duration_minutes || null) : null,
        serviceDetails: type === 'service' ? (service_details || null) : null,
        supplierId: supplier_id || null
      }
    });

    if (product.count === 0) {
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
productsRouter.patch('/:id/deactivate', authMiddleware, roleGuard(['admin']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    // Cek apakah ada sale_items dengan service_status in_progress atau scheduled
    const activeServicesCount = await (db as any).saleItem.count({
      where: {
        productId: parseInt(id),
        serviceStatus: { in: ['scheduled', 'in_progress'] }
      }
    });

    if (activeServicesCount > 0) {
      res.status(400).json({ 
        status: 'error', 
        code: 'BAD_REQUEST', 
        message: 'Tidak bisa menonaktifkan produk/layanan karena masih ada servis yang sedang berjalan atau dijadwalkan' 
      });
      return;
    }

    const info = await (db as any).product.updateMany({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });
    
    if (info.count === 0) {
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
productsRouter.post('/:id/restock', authMiddleware, roleGuard(['admin']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { quantity, supplier_id, notes } = req.body;
  const userId = req.user?.id;

  if (!quantity || quantity <= 0) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Jumlah restock harus lebih dari 0' });
    return;
  }

  try {
    const product = await (db as any).product.findFirst({
      where: { id: parseInt(id), isActive: true },
      select: { type: true, quantity: true }
    });
    
    if (!product) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Produk tidak ditemukan' });
      return;
    }

    if (product.type !== 'physical') {
      res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Hanya produk fisik yang bisa di-restock' });
      return;
    }

    const newBalance = product.quantity + quantity;

    // Use Prisma transaction
    await (db as any).$transaction(async (tx: any) => {
      // 1. Update quantity di tabel products
      await tx.product.update({
        where: { id: parseInt(id) },
        data: { quantity: newBalance }
      });
      
      // 2. Insert ke stock_logs
      await tx.stockLog.create({
        data: {
          productId: parseInt(id),
          type: 'in',
          quantity,
          balance: newBalance,
          supplierId: supplier_id || null,
          notes: notes || null,
          userId: userId!
        }
      });
    });

    res.json({ status: 'success', data: { balance: newBalance }, message: 'Stok berhasil ditambahkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/products/:id/stock-log - Riwayat perubahan stok
productsRouter.get('/:id/stock-log', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const logs = await (db as any).$queryRawUnsafe(`
      SELECT sl.*, u.username, s.name as supplier_name 
      FROM stock_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      LEFT JOIN suppliers s ON sl.supplier_id = s.id
      WHERE sl.product_id = $1
      ORDER BY sl.created_at DESC
    `, parseInt(id));

    res.json({ status: 'success', data: logs, message: 'Riwayat stok berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});
