import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'central-computer-secret-key';

// POST /api/auth/login
authRouter.post('/login', (req: AuthRequest, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Username dan password wajib diisi' });
    return;
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username) as any;
    
    if (!user) {
      res.status(401).json({ status: 'error', code: 'AUTH_FAILED', message: 'Username atau password salah' });
      return;
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
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
  // Karena JWT stateless, logout ditangani di sisi klien dengan menghapus token.
  // Endpoint ini disediakan untuk konsistensi API dan logging.
  res.json({ status: 'success', data: null, message: 'Logout berhasil' });
});

// GET /api/auth/me
authRouter.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare('SELECT id, username, email, role, is_active, created_at FROM users WHERE id = ?').get(req.user?.id) as any;
    if (!user || !user.is_active) {
      res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'User tidak aktif atau tidak ditemukan' });
      return;
    }
    res.json({ status: 'success', data: user, message: 'Data user berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// GET /api/auth/users
authRouter.get('/users', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const users = db.prepare('SELECT id, username, email, role, is_active FROM users WHERE is_active = 1').all();
    res.json({ status: 'success', data: users, message: 'Data users berhasil diambil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});

// PATCH /api/auth/change-password
authRouter.patch('/change-password', authMiddleware, (req: AuthRequest, res: Response) => {
  const { old_password, new_password } = req.body;
  
  if (!old_password || !new_password) {
    res.status(400).json({ status: 'error', code: 'BAD_REQUEST', message: 'Password lama dan baru wajib diisi' });
    return;
  }

  try {
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user?.id) as any;
    
    const isValid = bcrypt.compareSync(old_password, user.password_hash);
    if (!isValid) {
      res.status(400).json({ status: 'error', code: 'INVALID_PASSWORD', message: 'Password lama salah' });
      return;
    }

    const newHash = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, req.user?.id);

    res.json({ status: 'success', data: null, message: 'Password berhasil diubah' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', code: 'SERVER_ERROR', message: 'Terjadi kesalahan server' });
  }
});
