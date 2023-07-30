import 'dotenv/config'
import express, { NextFunction, Request, Response } from 'express';
import showRoutes from './routes/shows';
import songRoutes from './routes/songs';
import venueRoutes from './routes/venues';

interface ExpressError extends Error {
  status: number
}


class ExpressError extends Error {
  constructor(message: string, status: number) {
    super(message);
    this.status = status
  }
}

const app = express();
const port: number = Number(process.env.PORT) || 3000;
app.use(express.json())


//middleware to handle requests from AWS ELB health checker

app.use((req, res, next) => {
  if (req.headers['user-agent'] === 'ELB-HealthChecker/2.0') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use((req, res, next) => {
  console.log(req.method, req.query);
  next();
});

//routes for shows

app.use('/', showRoutes);

//routes for songs

app.use('/', songRoutes);

//routes for venues

app.use('/', venueRoutes);

// catch 404

app.use('*', (req, res, next) => {
  const error = new ExpressError('Page Not Found', 404);
  next(error);
});

// global error handler

app.use((err: ExpressError, req: Request, res: Response) => {
  console.log(err.status);
  res.status(err.status).json(err.message);
});

// server port

const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

export default server;