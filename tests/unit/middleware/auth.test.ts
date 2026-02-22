import { jest } from '@jest/globals';

// Set env before any other imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

// Dynamic imports to ensure env is set first
const { requireAuth } = await import('../../../src/middleware/auth.ts');
const { UnauthorizedError } = await import('../../../src/utils/errors.ts');
const { generateTestToken, expiredToken } = await import('../../helpers/setup.ts');

import type { Request, Response, NextFunction } from 'express';

function createMocks() {
  const req = {
    headers: {},
  } as Partial<Request> as Request;

  const res = {} as Response;

  const next = jest.fn() as any;

  return { req, res, next };
}

describe('requireAuth middleware', () => {
  it('should call next() and set req.user with a valid token', () => {
    const { req, res, next } = createMocks();
    const token = generateTestToken({ id: 1, email: 'test@example.com' });
    req.headers.authorization = `Bearer ${token}`;

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeDefined();
    expect(req.user!.id).toBe(1);
    expect(req.user!.email).toBe('test@example.com');
  });

  it('should call next with UnauthorizedError when no Authorization header', () => {
    const { req, res, next } = createMocks();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('should call next with UnauthorizedError when header lacks Bearer prefix', () => {
    const { req, res, next } = createMocks();
    req.headers.authorization = 'Basic sometoken';

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('should call next with UnauthorizedError for invalid token signature', () => {
    const { req, res, next } = createMocks();
    req.headers.authorization = 'Bearer invalid.token.here';

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('should call next with UnauthorizedError for expired token', () => {
    const { req, res, next } = createMocks();
    req.headers.authorization = `Bearer ${expiredToken}`;

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });
});
