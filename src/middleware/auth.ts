import jwt from 'jsonwebtoken';
import { config } from '../config/index.ts';
import { UnauthorizedError } from '../utils/errors.ts';
import type { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string; [key: string]: any };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid authorization header'));
  }

  const token = authHeader.substring(7); // Remove 'Bearer '
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded as Express.Request['user'];
    next();
  } catch (err) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};
