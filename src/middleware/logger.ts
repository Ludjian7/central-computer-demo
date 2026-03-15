import { Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import { AuthRequest } from './auth.js';

export const activityLogger = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Hanya log mutating requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const originalSend = res.send;
    
    // Override res.send to log after response is sent
    res.send = function (body): Response {
      res.send = originalSend;
      
      try {
        const userId = req.user?.id || null;
        const method = req.method;
        const endpoint = req.originalUrl;
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        
        // Jangan log password di payload
        let summary = `Payload: ${JSON.stringify(req.body)}`;
        if (endpoint.includes('/login') || endpoint.includes('/change-password') || endpoint.includes('/reset-password')) {
          summary = 'Authentication action (payload hidden)';
        }

        const stmt = db.prepare(`
          INSERT INTO activity_logs (user_id, method, endpoint, summary, ip_address)
          VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(userId, method, endpoint, summary, ipAddress);
      } catch (error: any) {
        console.error('Failed to log activity:', error.message || error);
      }

      return res.send(body);
    };
  }
  next();
};
