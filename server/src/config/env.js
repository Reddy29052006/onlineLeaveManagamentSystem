import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(currentDir, '../../.env') });

const REQUIRED = ['MONGODB_URI', 'SESSION_SECRET'];

const missing = REQUIRED.filter((key) => {
  const value = process.env[key];
  return value === undefined || value.trim() === '';
});

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(', ')}. ` +
      'Copy server/.env.example to server/.env and fill in the values.'
  );
}

const nodeEnv = process.env.NODE_ENV || 'development';
const port = Number.parseInt(process.env.PORT || '5000', 10);
const sessionTtlHours = Number.parseInt(process.env.SESSION_TTL_HOURS || '168', 10);

if (Number.isNaN(port)) {
  throw new Error('PORT must be a valid number.');
}
if (Number.isNaN(sessionTtlHours) || sessionTtlHours <= 0) {
  throw new Error('SESSION_TTL_HOURS must be a positive number.');
}

const VALID_SAME_SITE = ['lax', 'strict', 'none'];
const cookieSameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
if (!VALID_SAME_SITE.includes(cookieSameSite)) {
  throw new Error(`COOKIE_SAMESITE must be one of: ${VALID_SAME_SITE.join(', ')}`);
}

function parseTrustProxy(raw) {
  if (raw === undefined || raw === '') return 1;
  if (raw === 'false') return false;
  if (raw === 'true') return true;
  const hops = Number.parseInt(raw, 10);
  if (!Number.isNaN(hops)) return hops;
  return raw;
}

export const env = {
  nodeEnv,
  port,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET,
  mongodbUri: process.env.MONGODB_URI,
  mongodbDbName: process.env.MONGODB_DB_NAME || 'online_leave_management',

  sessionCookieName: process.env.SESSION_COOKIE_NAME || 'olm.sid',
  sessionTtlHours,
  sessionTtlMs: sessionTtlHours * 60 * 60 * 1000,
  cookieSameSite,
  cookieSecure:
    process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === 'true'
      : nodeEnv === 'production',
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
};
