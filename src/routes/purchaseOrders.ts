import { Router, Response } from 'express';
import { prisma } from '../db/index.js';
import { authMiddleware, AuthRequest, roleGuard } from '../middleware/auth.js';

export const purchaseOrdersRouter = Router();

// POST /api/purchase-orders - Buat PO baru
purchaseOrdersRouter.post('/', authMiddleware, roleGuard(['admin', 'owner']), async (req: AuthRequest, res: Response) => {
  const { supplier_id, expected_date, notes, items } = req.body;
  const userId = req.user?.id;

  if (!supplier_id || !items || !Array.isArray(items) || items.length === 0 || userId === undefined) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Supplier dan item barang harus diisi' });
    return;
  }

  try {
    const supplierId = parseInt(supplier_id);
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    });
    if (!supplier) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Supplier tidak ditemukan' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate PO Number (PO-YYYYMMDD-XXXX)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;
      
      const lastPO = await tx.purchaseOrder.findFirst({
        where: { poNumber: { startsWith: `PO-${dateStr}-` } },
        orderBy: { id: 'desc' }
      });
      
      let seq = 1;
      if (lastPO) {
        const parts = lastPO.poNumber.split('-');
        seq = parseInt(parts[parts.length - 1], 10) + 1;
      }
      const poNumber = `PO-${dateStr}-${seq.toString().padStart(4, '0')}`;

      // 2. Validate items and calculate total
      let totalAmount = 0;
      const validItems = [];

      for (const item of items) {
        if (!item.product_id || !item.quantity || item.quantity <= 0 || !item.unit_cost || item.unit_cost <= 0) {
          throw new Error('Data item PO tidak valid (qty/harga harus > 0)');
        }
        
        const productId = parseInt(item.product_id);
        const product = await tx.product.findUnique({
          where: { id: productId }
        });

        if (!product || product.type !== 'physical') {
          throw new Error(`Produk ID ${item.product_id} tidak valid atau bukan barang fisik`);
        }

        const subtotal = parseInt(item.quantity) * parseInt(item.unit_cost);
        totalAmount += subtotal;
        
        validItems.push({
          productId,
          quantity: parseInt(item.quantity),
          unitCost: parseInt(item.unit_cost),
          subtotal
        });
      }

      // 3. Insert PO header
      const po = await tx.purchaseOrder.create({
        data: {
          poNumber,
          supplierId,
          notes: notes || null,
          totalAmount,
          expectedDate: expected_date ? new Date(expected_date) : null,
          createdBy: userId,
          status: 'draft'
        }
      });

      // 4. Insert PO items
      for (const item of validItems) {
        await tx.purchaseOrderItem.create({
          data: {
            poId: po.id,
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            subtotal: item.subtotal
          }
        });
      }

      return { poId: po.id, poNumber, totalAmount };
    });

    res.status(201).json({ status: 'success', data: result, message: 'Purchase Order berhasil dibuat' });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: error.message || 'Terjadi kesalahan' });
  }
});

// GET /api/purchase-orders - List
purchaseOrdersRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { status, supplier_id, start_date, end_date } = req.query as any;

  try {
    const where: any = {};
    if (status) where.status = status;
    if (supplier_id) where.supplierId = parseInt(supplier_id);
    if (start_date && end_date) {
      where.createdAt = {
        gte: new Date(`${start_date}T00:00:00.000Z`),
        lte: new Date(`${end_date}T23:59:59.999Z`)
      };
    }

    const pos = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        creator: { select: { username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format for frontend
    const formattedPOs = pos.map(p => ({
      ...p,
      supplier_name: p.supplier.name,
      created_by_name: p.creator.username
    }));

    res.json({ status: 'success', data: formattedPOs, message: 'Daftar PO berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/purchase-orders/:id - Detail PO
purchaseOrdersRouter.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(id) },
      include: {
        supplier: { select: { name: true } },
        creator: { select: { username: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true } }
          }
        }
      }
    });

    if (!po) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'PO tidak ditemukan' });
      return;
    }

    // Format for frontend
    const formattedDetails = {
      ...po,
      supplier_name: po.supplier.name,
      created_by_name: po.creator.username,
      items: po.items.map(i => ({
        ...i,
        product_name: i.product.name,
        sku: i.product.sku
      }))
    };

    res.json({ status: 'success', data: formattedDetails, message: 'Detail PO berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// PATCH /api/purchase-orders/:id/status - Update Status
purchaseOrdersRouter.patch('/:id/status', authMiddleware, roleGuard(['admin', 'owner']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['draft', 'sent', 'cancelled'].includes(status)) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Status tidak valid untuk update ini' });
    return;
  }

  try {
    const poId = parseInt(id);
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      select: { status: true }
    });

    if (!po) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'PO tidak ditemukan' });
      return;
    }

    if (po.status === 'received') {
      res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'PO yang sudah diterima tidak bisa diubah statusnya' });
      return;
    }

    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status }
    });

    res.json({ status: 'success', message: 'Status PO diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/purchase-orders/:id/receive - Goods Receipt
purchaseOrdersRouter.post('/:id/receive', authMiddleware, roleGuard(['admin', 'owner']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { received_items } = req.body; // Array of { id: po_item_id, received_qty: number }
  const userId = req.user?.id;

  if (!received_items || !Array.isArray(received_items) || received_items.length === 0 || userId === undefined) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Item penerimaan barang wajib diisi' });
    return;
  }

  try {
    const poId = parseInt(id);
    const result = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true }
      });

      if (!po) throw new Error('PO tidak ditemukan');
      if (po.status === 'cancelled' || po.status === 'received') {
        throw new Error(`Tidak bisa menerima barang untuk PO dengan status ${po.status}`);
      }

      let everythingReceived = true;
      let somethingReceived = false;

      for (const poItem of po.items) {
        const receiptInput = received_items.find((r: any) => r.id === poItem.id);
        if (receiptInput && receiptInput.received_qty > 0) {
          const addingQty = parseInt(receiptInput.received_qty);
          const newReceivedTotal = poItem.receivedQty + addingQty;

          if (newReceivedTotal > poItem.quantity) {
             throw new Error(`Toleransi penerimaan melebihi pesanan untuk Produk ID ${poItem.productId}`);
          }

          // Update PO Item
          await tx.purchaseOrderItem.update({
            where: { id: poItem.id },
            data: { receivedQty: newReceivedTotal }
          });
          
          if (newReceivedTotal < poItem.quantity) {
             everythingReceived = false;
          }

          // Update Product Stock & Cost
          const product = await tx.product.findUnique({
            where: { id: poItem.productId },
            select: { quantity: true }
          });

          if (!product) throw new Error(`Produk ID ${poItem.productId} tidak ditemukan`);

          const newStock = product.quantity + addingQty;
          
          await tx.product.update({
            where: { id: poItem.productId },
            data: { 
              quantity: newStock, 
              cost: poItem.unitCost 
            }
          });

          // Insert Stock Log
          await tx.stockLog.create({
            data: {
              productId: poItem.productId,
              type: 'in',
              quantity: addingQty,
              balance: newStock,
              notes: `Goods Receipt PO ${po.poNumber}`,
              userId: userId
            }
          });

          somethingReceived = true;
        } else {
           if (poItem.receivedQty < poItem.quantity) {
              everythingReceived = false;
           }
        }
      }

      if (!somethingReceived) throw new Error('Harus ada minimum 1 barang yang diterima');

      const finalStatus = everythingReceived ? 'received' : 'partial';

      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { 
          status: finalStatus,
          receivedDate: po.receivedDate || new Date()
        }
      });

      return { status: finalStatus };
    });

    res.json({ status: 'success', data: result, message: 'Penerimaan barang berhasil dicatat' });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: error.message || 'Gagal mencatat penerimaan barang' });
  }
});


