import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'central-computer-secret-key';

// POST /api/auth/login
authRouter.post('/login', async (req: AuthRequest, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Username dan password wajib diisi' });
    return;
  }

  try {
    const user = await (db as any).user.findUnique({ 
      where: { username, isActive: true } 
    });
    
    if (!user) {
      res.status(401).json({ status: 'error', code: 'AUTH_FAILED', message: 'Username atau password salah' });
      return;
    }

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ status: 'error', code: 'AUTH_FAILED', message: 'Username atau password salah' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Set req.user manually so the activityLogger can capture the user_id for this login action
    req.user = { id: user.id, username: user.username, role: user.role };

    res.json({
      status: 'success',
      data: { token, user: { id: user.id, username: user.username, role: user.role, email: user.email } },
      message: 'Login berhasil'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ status: 'success', data: null, message: 'Logout berhasil' });
});

// GET /api/auth/me
authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await (db as any).user.findUnique({ 
      where: { id: req.user?.id } 
    });
    if (!user || !user.isActive) {
      res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'User tidak aktif atau tidak ditemukan' });
      return;
    }
    // Remove sensitive data
    const { passwordHash, ...safeUser } = user;
    res.json({ status: 'success', data: safeUser, message: 'Data user berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/auth/users
authRouter.get('/users', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const users = await (db as any).user.findMany({
      where: { isActive: true },
      select: { id: true, username: true, email: true, role: true, isActive: true }
    });
    res.json({ status: 'success', data: users, message: 'Data users berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// PATCH /api/auth/change-password
authRouter.patch('/change-password', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { old_password, new_password } = req.body;
  
  if (!old_password || !new_password) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Password lama dan baru wajib diisi' });
    return;
  }

  try {
    const user = await (db as any).user.findUnique({ 
      where: { id: req.user?.id },
      select: { passwordHash: true }
    });
    
    if (!user) {
      res.status(404).json({ status: 'error', code: 'NOT_FOUND', message: 'User tidak ditemukan' });
      return;
    }

    const isValid = bcrypt.compareSync(old_password, user.passwordHash);
    if (!isValid) {
      res.status(400).json({ status: 'error', code: 'INVALID_PASSWORD', message: 'Password lama salah' });
      return;
    }

    const newHash = bcrypt.hashSync(new_password, 10);
    await (db as any).user.update({
      where: { id: req.user?.id },
      data: { passwordHash: newHash }
    });

    res.json({ status: 'success', data: null, message: 'Password berhasil diubah' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});
