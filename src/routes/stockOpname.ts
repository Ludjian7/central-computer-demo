import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.js';

export const stockOpnameRouter = Router();

// GET /api/stock-opname - Daftar riwayat opname
stockOpnameRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.prepare(`
      SELECT so.*, u.username as creator_name 
      FROM stock_opname so
      LEFT JOIN users u ON so.created_by = u.id
      ORDER BY so.created_at DESC
    `).all();
    res.json({ status: 'success', data: list, message: 'Daftar opname berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/stock-opname - Buat opname baru (Snapshot stok sistem)
stockOpnameRouter.post('/', authMiddleware, roleGuard(['admin', 'owner']), async (req: AuthRequest, res: Response) => {
  const { notes, opname_date } = req.body;
  const userId = req.user?.id;

  try {
    const result = db.transaction(() => {
      // 1. Insert header
      const header = await db.prepare(`
        INSERT INTO stock_opname (opname_date, notes, created_by, status)
        VALUES (?, ?, ?, 'draft')
      `).run(opname_date || new Date().toISOString().split('T')[0], notes || null, userId);

      const opnameId = header.lastInsertRowid;

      // 2. Snapshot all physical products
      const products = await db.prepare("SELECT id, quantity FROM products WHERE type = 'physical' AND is_active = 1").all() as any[];
      
      const insertItem = await db.prepare(`
        INSERT INTO stock_opname_items (opname_id, product_id, system_qty, physical_qty, difference)
        VALUES (?, ?, ?, NULL, NULL)
      `);

      for (const p of products) {
        insertItem.run(opnameId, p.id, p.quantity);
      }

      return opnameId;
    })();

    res.status(201).json({ status: 'success', data: { id: result }, message: 'Draft opname berhasil dibuat (snapshot stok selesai)' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Gagal membuat draft opname' });
  }
});

// GET /api/stock-opname/:id - Detail opname & items
stockOpnameRouter.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const header = await db.prepare(`
      SELECT so.*, u.username as creator_name 
      FROM stock_opname so
      LEFT JOIN users u ON so.created_by = u.id
      WHERE so.id = ?
    `).get(id) as any;

    if (!header) {
      return res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Data opname tidak ditemukan' });
    }

    const items = await db.prepare(`
      SELECT soi.*, p.name as product_name, p.sku as product_sku, p.category
      FROM stock_opname_items soi
      JOIN products p ON soi.product_id = p.id
      WHERE soi.opname_id = ?
    `).all(id);

    res.json({ status: 'success', data: { ...header, items }, message: 'Detail opname berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// PATCH /api/stock-opname/:id/item - Update physical_qty per item
stockOpnameRouter.patch('/:id/item', authMiddleware, roleGuard(['admin', 'owner']), async (req: AuthRequest, res: Response) => {
  const { id: opnameId } = req.params;
  const { product_id, physical_qty, notes } = req.body;

  try {
    const opname = await db.prepare("SELECT status FROM stock_opname WHERE id = ?").get(opnameId) as any;
    if (!opname) {
      return res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Opname tidak ditemukan' });
    }
    if (opname.status === 'completed') {
      return res.status(400).json({ status: 'error', code: 'FORBIDDEN', message: 'Opname yang sudah selesai tidak bisa diubah' });
    }

    const item = await db.prepare("SELECT system_qty FROM stock_opname_items WHERE opname_id = ? AND product_id = ?").get(opnameId, product_id) as any;
    if (!item) {
      return res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Item tidak ditemukan dalam opname ini' });
    }

    const difference = physical_qty - item.system_qty;

    await db.prepare(`
      UPDATE stock_opname_items 
      SET physical_qty = ?, difference = ?, adjustment_notes = ?
      WHERE opname_id = ? AND product_id = ?
    `).run(physical_qty, difference, notes || null, opnameId, product_id);

    res.json({ status: 'success', data: { difference }, message: 'Berhasil update stok fisik' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Gagal update item opname' });
  }
});

// POST /api/stock-opname/:id/complete - Finalize opname (Apply adjustments)
stockOpnameRouter.post('/:id/complete', authMiddleware, roleGuard(['admin', 'owner']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    db.transaction(() => {
      const opname = await db.prepare("SELECT status FROM stock_opname WHERE id = ?").get(id) as any;
      if (!opname || opname.status === 'completed') {
        throw new Error('Opname tidak ditemukan atau sudah selesai');
      }

      const items = await db.prepare("SELECT * FROM stock_opname_items WHERE opname_id = ? AND physical_qty IS NOT NULL").all(id) as any[];

      for (const item of items) {
        if (item.difference === 0) continue;

        // Apply adjustment to products
        await db.prepare("UPDATE products SET quantity = physical_qty, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .run(item.physical_qty, item.product_id);

        // Log adjustment
        await db.prepare(`
          INSERT INTO stock_logs (product_id, type, quantity, balance, notes, user_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          item.product_id,
          item.difference > 0 ? 'in' : 'out',
          Math.abs(item.difference),
          item.physical_qty,
          `Adjustment Opname #${id}: ${item.adjustment_notes || 'No notes'}`,
          userId
        );
      }

      await db.prepare("UPDATE stock_opname SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    })();

    res.json({ status: 'success', data: null, message: 'Stock Opname berhasil diselesaikan dan stok telah disesuaikan' });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ status: 'error', code: 'FAILED', message: error.message || 'Gagal menyelesaikan opname' });
  }
});

