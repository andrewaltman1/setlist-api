import express from 'express';
import v1Router from './routes/v1/index.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import { AppError } from './utils/errors.ts';

const app = express();
app.use(express.json());

// ELB health check
app.use((req, res, next) => {
  if (req.headers['user-agent'] === 'ELB-HealthChecker/2.0') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API routes
app.use('/v1', v1Router);

// 404 catch-all
app.use('*splat', (req, res, next) => {
  next(new AppError('Not Found', 404, 'NOT_FOUND'));
});

// Global error handler
app.use(errorHandler);

export default app;
