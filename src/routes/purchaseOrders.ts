import { Router, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware, AuthRequest, roleGuard } from '../middleware/auth.js';

export const purchaseOrdersRouter = Router();

// POST /api/purchase-orders - Buat PO baru
purchaseOrdersRouter.post('/', authMiddleware, roleGuard(['admin', 'owner']), (req: AuthRequest, res: Response) => {
  const { supplier_id, expected_date, notes, items } = req.body;
  const userId = req.user?.id;

  if (!supplier_id || !items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Supplier dan item barang harus diisi' });
    return;
  }

  try {
    const supplier = db.prepare('SELECT id FROM suppliers WHERE id = ?').get(supplier_id);
    if (!supplier) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Supplier tidak ditemukan' });
      return;
    }

    const processPO = db.transaction(() => {
      // 1. Generate PO Number (PO-YYYYMMDD-XXXX)
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      const lastPO = db.prepare("SELECT po_number FROM purchase_orders WHERE po_number LIKE ? ORDER BY id DESC LIMIT 1").get(`PO-${dateStr}-%`) as any;
      
      let seq = 1;
      if (lastPO) {
        const lastSeq = parseInt(lastPO.po_number.split('-')[2], 10);
        seq = lastSeq + 1;
      }
      const poNumber = `PO-${dateStr}-${seq.toString().padStart(4, '0')}`;

      // 2. Validate items and calculate total
      let totalAmount = 0;
      const validItems = [];

      for (const item of items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0 || !item.unit_cost || item.unit_cost <= 0) {
          throw new Error('Data item PO tidak valid (qty/harga harus > 0)');
        }
        
        const product = db.prepare('SELECT type FROM products WHERE id = ?').get(item.product_id) as any;
        if (!product || product.type !== 'physical') {
          throw new Error(`Produk ID ${item.product_id} tidak valid atau bukan barang fisik`);
        }

        const subtotal = item.quantity * item.unit_cost;
        totalAmount += subtotal;
        
        validItems.push({
          ...item,
          subtotal
        });
      }

      // 3. Insert PO header
      const poInsertInfo = db.prepare(`
        INSERT INTO purchase_orders (po_number, supplier_id, notes, total_amount, expected_date, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(poNumber, supplier_id, notes || null, totalAmount, expected_date || null, userId);
      const poId = poInsertInfo.lastInsertRowid;

      // 4. Insert PO items
      const insertItem = db.prepare(`
        INSERT INTO purchase_order_items (po_id, product_id, quantity, unit_cost, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const item of validItems) {
        insertItem.run(poId, item.product_id, item.quantity, item.unit_cost, item.subtotal);
      }

      return { poId, poNumber, totalAmount };
    });

    const result = processPO();
    res.status(201).json({ status: 'success', data: result, message: 'Purchase Order berhasil dibuat' });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: error.message || 'Terjadi kesalahan' });
  }
});

// GET /api/purchase-orders - List
purchaseOrdersRouter.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { status, supplier_id, start_date, end_date } = req.query;

  try {
    let query = `
      SELECT po.*, s.name as supplier_name, u.username as created_by_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON po.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND po.status = ?`;
      params.push(status);
    }
    if (supplier_id) {
      query += ` AND po.supplier_id = ?`;
      params.push(supplier_id);
    }
    if (start_date && end_date) {
      query += ` AND date(po.created_at) BETWEEN ? AND ?`;
      params.push(start_date, end_date);
    }

    query += ` ORDER BY po.created_at DESC`;

    const pos = db.prepare(query).all(...params);
    res.json({ status: 'success', data: pos, message: 'Daftar PO berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/purchase-orders/:id - Detail PO
purchaseOrdersRouter.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const po = db.prepare(`
      SELECT po.*, s.name as supplier_name, u.username as created_by_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON po.created_by = u.id
      WHERE po.id = ?
    `).get(id);

    if (!po) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'PO tidak ditemukan' });
      return;
    }

    const items = db.prepare(`
      SELECT poi.*, p.name as product_name, p.sku
      FROM purchase_order_items poi
      JOIN products p ON poi.product_id = p.id
      WHERE poi.po_id = ?
    `).all(id);

    res.json({ status: 'success', data: { ...po, items }, message: 'Detail PO berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// PATCH /api/purchase-orders/:id/status - Update Status (misal: draft -> sent -> cancelled)
purchaseOrdersRouter.patch('/:id/status', authMiddleware, roleGuard(['admin', 'owner']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['draft', 'sent', 'cancelled'].includes(status)) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Status tidak valid untuk update ini' });
    return;
  }

  try {
    const po = db.prepare('SELECT status FROM purchase_orders WHERE id = ?').get(id) as any;
    if (!po) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'PO tidak ditemukan' });
      return;
    }

    if (po.status === 'received') {
      res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'PO yang sudah diterima tidak bisa diubah statusnya' });
      return;
    }

    db.prepare('UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    res.json({ status: 'success', message: 'Status PO diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/purchase-orders/:id/receive - Goods Receipt
purchaseOrdersRouter.post('/:id/receive', authMiddleware, roleGuard(['admin', 'owner']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { received_items } = req.body; // Array of { id: po_item_id, received_qty: number }
  const userId = req.user?.id;

  if (!received_items || !Array.isArray(received_items) || received_items.length === 0) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Item penerimaan barang wajib diisi' });
    return;
  }

  try {
    const processReceipt = db.transaction(() => {
      const po = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(id) as any;
      if (!po) throw new Error('PO tidak ditemukan');
      if (po.status === 'cancelled' || po.status === 'received') {
        throw new Error(`Tidak bisa menerima barang untuk PO dengan status ${po.status}`);
      }

      let everythingReceived = true;
      let somethingReceived = false;

      const poItems = db.prepare('SELECT * FROM purchase_order_items WHERE po_id = ?').all(id) as any[];

      for (const poItem of poItems) {
        const receiptInput = received_items.find((r: any) => r.id === poItem.id);
        if (receiptInput && receiptInput.received_qty > 0) {
          const addingQty = receiptInput.received_qty;
          const newReceivedTotal = poItem.received_qty + addingQty;

          if (newReceivedTotal > poItem.quantity) {
             throw new Error(`Toleransi penerimaan melebihi pesanan untuk Produk ID ${poItem.product_id}`);
          }

          // Update PO Item
          db.prepare('UPDATE purchase_order_items SET received_qty = ? WHERE id = ?').run(newReceivedTotal, poItem.id);
          
          if (newReceivedTotal < poItem.quantity) {
             everythingReceived = false;
          }

          // Update Product Stock & Cost
          const currentProduct = db.prepare('SELECT quantity, cost FROM products WHERE id = ?').get(poItem.product_id) as any;
          const newStock = currentProduct.quantity + addingQty;
          // Asumsi cost baru = unit_cost terakhir. Untuk weighted average = ((old_qty * old_cost) + (new_qty * new_cost)) / (old_qty + new_qty)
          // Simplified: last price in
          db.prepare('UPDATE products SET quantity = ?, cost = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStock, poItem.unit_cost, poItem.product_id);

          // Insert Stock Log
          db.prepare(`
            INSERT INTO stock_logs (product_id, type, quantity, balance, notes, user_id)
            VALUES (?, 'in', ?, ?, ?, ?)
          `).run(poItem.product_id, addingQty, newStock, `Goods Receipt PO ${po.po_number}`, userId);

          somethingReceived = true;
        } else {
           if (poItem.received_qty < poItem.quantity) {
              everythingReceived = false;
           }
        }
      }

      if (!somethingReceived) throw new Error('Harus ada minimum 1 barang yang diterima');

      const finalStatus = everythingReceived ? 'received' : 'partial';
      const receivedDateStr = finalStatus === 'received' ? "CURRENT_TIMESTAMP" : (po.received_date ? `'${po.received_date}'` : "CURRENT_TIMESTAMP"); // Partial sets first received date too?

      // Using JS date string to keep it clean for partial vs full
      db.prepare(`
          UPDATE purchase_orders 
          SET status = ?, received_date = COALESCE(received_date, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
      `).run(finalStatus, id);

      return { status: finalStatus };
    });

    const result = processReceipt();
    res.json({ status: 'success', data: result, message: 'Penerimaan barang berhasil dicatat' });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: error.message || 'Gagal mencatat penerimaan barang' });
  }
});
