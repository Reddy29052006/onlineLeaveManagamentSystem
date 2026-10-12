import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { issueCsrfToken, verifyCsrf } from './middleware/csrf.js';
import { sanitizeInput } from './middleware/sanitizeInput.js';
import { apiLimiter } from './middleware/rateLimiters.js';

const app = express();

app.disable('x-powered-by');

// Trust the reverse proxy (Vite dev proxy / production load balancer) so the
// client IP and rate limiting work correctly.
app.set('trust proxy', env.trustProxy);

const allowedOrigins = env.clientOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// NoSQL operator injection & prototype pollution prevention
app.use(sanitizeInput);

const sessionStore = MongoStore.create({
  mongoUrl: env.mongodbUri,
  dbName: env.mongodbDbName,
  collectionName: 'sessions',
  ttl: env.sessionTtlHours * 60 * 60,
  autoRemove: 'native',
});

app.use(
  session({
    name: env.sessionCookieName,
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: env.cookieSecure,
      sameSite: env.cookieSameSite,
      maxAge: env.sessionTtlMs,
    },
  })
);

app.use(issueCsrfToken);
app.use(verifyCsrf);

if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Global API rate limiting
app.use('/api/v1', apiLimiter, apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
