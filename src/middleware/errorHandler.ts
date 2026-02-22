import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.ts';
import { config } from '../config/index.ts';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    const message = err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    return res.status(400).json({
      error: { message, code: 'BAD_REQUEST' },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code },
    });
  }

  // Unexpected error
  const message = config.nodeEnv === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(500).json({
    error: { message, code: 'INTERNAL_ERROR' },
  });
};
