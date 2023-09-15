import { Request, Response, NextFunction } from 'express';
import db from './db';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import crypto from 'crypto';
import pgSession from 'connect-pg-simple';

class User {
  id: number;
  email: string;
  firstName: string;
  attended: boolean;
  admin: boolean;
  constructor(user: { id: number, email: string, first_name: string, attended: boolean, is_admin: boolean }) {
    (this.id = user.id || null),
      (this.email = user.email),
      (this.firstName = user.first_name || user.email),
      (this.attended = user.attended || false),
      (this.admin = user.is_admin || false),
  }
}

const PGStore = pgSession(session);

const sessionConfig = {
  store: new PGStore({
    pool: db.pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET as string,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    maxAge: 1000 * 60 * 60 * 24,
  },
};

module.exports.passport = passport;

module.exports.expressSession = session(sessionConfig);
module.exports.initialize = passport.initialize();
module.exports.passportSession = passport.session();

passport.use(
  new LocalStrategy(function verify(username: string, password: string, cb: Function) {
    db.pool.query(
      'SELECT id, email, is_admin, first_name, salt, hashed_password FROM users WHERE email = $1',
      [username],
      function (err: Error, row: { rows: any[] }) {
        if (err) {
          return cb(err);
        }
        if (!row.rows[0]) {
          return cb(null, false, {
            message: 'Incorrect email/password',
          });
        }

        crypto.pbkdf2(
          password,
          row.rows[0].salt,
          310000,
          32,
          'sha256',
          function (err, hashedPassword) {
            if (err) {
              return cb(err);
            }
            if (
              !crypto.timingSafeEqual(
                row.rows[0].hashed_password,
                hashedPassword
              )
            ) {
              return cb(null, false, {
                message: 'Incorrect email/password',
              });
            }
            let user = new User(row.rows[0]);
            return cb(null, user);
          }
        );
      }
    );
  })
);

module.exports.crypto = (req: Request, res: Response, next: NextFunction) => {
  let salt = crypto.randomBytes(16);
  crypto.pbkdf2(
    req.body.password,
    salt,
    310000,
    32,
    'sha256',
    function (err, hashedPassword) {
      if (err) {
        return next(err);
      }
      db.pool.query(
        'INSERT INTO users (email, hashed_password, salt, encrypted_password, created_at, updated_at) VALUES ($1, $2, $3, $4, LOCALTIMESTAMP, LOCALTIMESTAMP)',
        [req.body.username, hashedPassword, salt, 'see hashed column'],
        function (err: Error) {
          if (err) {
            return next(err);
          }
          let user = new User(req.body);
          req.login(user, function (err) {
            if (err) {
              return next(err);
            }
            res.redirect('/');
          });
        }
      );
    }
  );
};

module.exports.authenticate = passport.authenticate('session');

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, {
      id: user.id,
      email: user.email,
      admin: user.admin,
      firstName: user.firstName,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});
