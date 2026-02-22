import { ZodError } from 'zod';
import type { ZodType } from 'zod';
import { BadRequestError, ValidationError } from '../utils/errors.ts';
import type { Request, Response, NextFunction } from 'express';

interface ValidationSchemas {
  query?: ZodType;
  params?: ZodType;
  body?: ZodType;
}

export const validateRequest = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.query) req.query = schemas.query.parse(req.query) as any;
      if (schemas.params) req.params = schemas.params.parse(req.params) as any;
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ');
        // Use BadRequestError for query/param validation, ValidationError for body
        next(schemas.body ? new ValidationError(message) : new BadRequestError(message));
      } else {
        next(err);
      }
    }
  };
};
