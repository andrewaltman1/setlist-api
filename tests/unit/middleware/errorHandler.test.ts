import { jest } from '@jest/globals';

process.env.NODE_ENV = 'test';

import { errorHandler } from '../../../src/middleware/errorHandler.ts';
import { NotFoundError, ValidationError, UnauthorizedError, BadRequestError } from '../../../src/utils/errors.ts';
import { ZodError } from 'zod';
import type { Request, Response, NextFunction } from 'express';

function createMocks() {
  const req = {} as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as Partial<Response> as Response;
  const next = jest.fn() as any;
  return { req, res, next };
}

describe('errorHandler middleware', () => {
  // Suppress console.error during tests
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.error as any).mockRestore();
  });

  it('should handle NotFoundError with 404', () => {
    const { req, res, next } = createMocks();
    const err = new NotFoundError('Show not found');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Show not found', code: 'NOT_FOUND' },
    });
  });

  it('should handle ValidationError with 422', () => {
    const { req, res, next } = createMocks();
    const err = new ValidationError('Invalid data');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Invalid data', code: 'VALIDATION_ERROR' },
    });
  });

  it('should handle UnauthorizedError with 401', () => {
    const { req, res, next } = createMocks();
    const err = new UnauthorizedError();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
    });
  });

  it('should handle BadRequestError with 400', () => {
    const { req, res, next } = createMocks();
    const err = new BadRequestError('Bad input');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Bad input', code: 'BAD_REQUEST' },
    });
  });

  it('should handle ZodError with 400', () => {
    const { req, res, next } = createMocks();
    const err = new ZodError([
      { code: 'too_small', minimum: 1, type: 'number', inclusive: true, exact: false, message: 'Number must be greater than or equal to 1', path: ['limit'] },
    ]);

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'limit: Number must be greater than or equal to 1', code: 'BAD_REQUEST' },
    });
  });

  it('should handle generic Error with 500', () => {
    const { req, res, next } = createMocks();
    const err = new Error('Something went wrong');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' },
    });
  });
});
