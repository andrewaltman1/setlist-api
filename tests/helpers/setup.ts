// Set test environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

import jwt from 'jsonwebtoken';

export const generateTestToken = (payload = { id: 1, email: 'test@example.com' }) => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });
};

export const expiredToken = jwt.sign(
  { id: 1, email: 'test@example.com' },
  'test-secret',
  { expiresIn: '-1h' },
);
