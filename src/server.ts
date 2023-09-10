if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
import express, { Request, Response } from 'express';
import showRoutes from './routes/shows';
import songRoutes from './routes/songs';
import venueRoutes from './routes/venues';

class ExpressError extends Error {
  status: number;
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

//routes for shows

app.use('/', showRoutes);

//routes for songs

app.use('/', songRoutes);

//routes for venues

app.use('/', venueRoutes);

//test sendgrid

// const sgMail = require('@sendgrid/mail')

// sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// const msg = {
//   to: 'andrewaltman@outlook.com', // Change to your recipient
//   from: 'noreply@hoboscompanion.org', // Change to your verified sender
//   subject: 'Sending with SendGrid is Fun',
//   text: 'and easy to do anywhere, even with Node.js',
//   html: '<strong>and easy to do anywhere, even with Node.js</strong>',
// }

// sgMail
//   .send(msg)
//   .then(() => {
//     console.log('Email sent')
//   })
//   .catch((error: Error) => {
//     console.error(error)
//   })

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