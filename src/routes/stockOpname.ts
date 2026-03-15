import { Router, Response } from 'express';
import { prisma } from '../db/index.js';
import { authMiddleware, roleGuard, AuthRequest } from '../middleware/auth.js';

export const stockOpnameRouter = Router();

// GET /api/stock-opname - Daftar riwayat opname
stockOpnameRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const list = await prisma.stockOpname.findMany({
      include: {
        creator: { select: { username: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format for frontend
    const formattedList = list.map(so => ({
      ...so,
      creator_name: so.creator.username
    }));

    res.json({ status: 'success', data: formattedList, message: 'Daftar opname berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/stock-opname - Buat opname baru (Snapshot stok sistem)
stockOpnameRouter.post('/', authMiddleware, roleGuard(['admin', 'owner']), async (req: AuthRequest, res: Response) => {
  const { notes, opname_date } = req.body;
  const userId = req.user?.id;

  if (userId === undefined) {
    res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Snapshot all physical products
      const products = await tx.product.findMany({
        where: { type: 'physical', isActive: true },
        select: { id: true, quantity: true }
      });

      // 2. Insert header
      const header = await tx.stockOpname.create({
        data: {
          opnameDate: opname_date ? new Date(opname_date) : new Date(),
          notes: notes || null,
          createdBy: userId,
          status: 'draft'
        }
      });

      // 3. Insert items
      for (const p of products) {
        await tx.stockOpnameItem.create({
          data: {
            opnameId: header.id,
            productId: p.id,
            systemQty: p.quantity
          }
        });
      }

      return header.id;
    });

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
    const header = await prisma.stockOpname.findUnique({
      where: { id: parseInt(id) },
      include: {
        creator: { select: { username: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true, category: true } }
          }
        }
      }
    });

    if (!header) {
      return res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Data opname tidak ditemukan' });
    }

    // Format for frontend
    const formattedData = {
      ...header,
      creator_name: header.creator.username,
      items: header.items.map(i => ({
        ...i,
        product_name: i.product.name,
        product_sku: i.product.sku,
        category: i.product.category
      }))
    };

    res.json({ status: 'success', data: formattedData, message: 'Detail opname berhasil diambil' });
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
    const oid = parseInt(opnameId);
    const pid = parseInt(product_id);
    const pqty = parseInt(physical_qty);

    const opname = await prisma.stockOpname.findUnique({
      where: { id: oid },
      select: { status: true }
    });

    if (!opname) {
      return res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Opname tidak ditemukan' });
    }
    if (opname.status === 'completed') {
      return res.status(400).json({ status: 'error', code: 'FORBIDDEN', message: 'Opname yang sudah selesai tidak bisa diubah' });
    }

    const item = await prisma.stockOpnameItem.findFirst({
      where: { opnameId: oid, productId: pid },
      select: { id: true, systemQty: true }
    });

    if (!item) {
      return res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'Item tidak ditemukan dalam opname ini' });
    }

    const difference = pqty - item.systemQty;

    await prisma.stockOpnameItem.update({
      where: { id: item.id },
      data: {
        physicalQty: pqty,
        difference: difference,
        adjustmentNotes: notes || null
      }
    });

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

  if (userId === undefined) {
    res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }

  try {
    const oid = parseInt(id);
    await prisma.$transaction(async (tx) => {
      const opname = await tx.stockOpname.findUnique({
        where: { id: oid },
        select: { status: true }
      });

      if (!opname || opname.status === 'completed') {
        throw new Error('Opname tidak ditemukan atau sudah selesai');
      }

      const items = await tx.stockOpnameItem.findMany({
        where: { 
          opnameId: oid,
          physicalQty: { not: null }
        }
      });

      for (const item of items) {
        if (item.difference === 0) continue;

        // Apply adjustment to products
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: item.physicalQty || 0 }
        });

        // Log adjustment
        await tx.stockLog.create({
          data: {
            productId: item.productId,
            type: (item.difference || 0) > 0 ? 'in' : 'out',
            quantity: Math.abs(item.difference || 0),
            balance: item.physicalQty || 0,
            notes: `Adjustment Opname #${oid}: ${item.adjustmentNotes || 'No notes'}`,
            userId: userId
          }
        });
      }

      await tx.stockOpname.update({
        where: { id: oid },
        data: { 
          status: 'completed',
          completedAt: new Date()
        }
      });
    });

    res.json({ status: 'success', data: null, message: 'Stock Opname berhasil diselesaikan dan stok telah disesuaikan' });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ status: 'error', code: 'FAILED', message: error.message || 'Gagal menyelesaikan opname' });
  }
});


