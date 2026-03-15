import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'central-computer-secret-key';

export interface AuthUser {
  id: number;
  username: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'Token tidak ditemukan' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ status: 'error', code: 'INVALID_TOKEN', message: 'Token tidak valid atau kadaluarsa' });
    return;
  }
};

export const roleGuard = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: 'Akses ditolak' });
      return;
    }
    next();
  };
};
