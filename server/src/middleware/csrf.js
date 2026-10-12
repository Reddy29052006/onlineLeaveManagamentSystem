import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Login is exempt: no session/CSRF token exists before the first sign-in.
const EXEMPT_PATHS = ['/api/v1/auth/login'];

const CSRF_COOKIE_NAME = 'csrfToken';

function csrfCookieOptions() {
  return {
    httpOnly: false,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: env.sessionTtlMs,
    path: '/',
  };
}

export function setCsrfCookie(res, token) {
  res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions());
}

export function clearCsrfCookie(res) {
  res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });
}

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Mirror the authenticated session's CSRF token into a readable cookie so the
 * browser client can echo it back in the `X-CSRF-Token` header. Anonymous
 * requests are left untouched so that no session is created for them.
 */
export function issueCsrfToken(req, res, next) {
  if (req.session && req.session.csrfToken) {
    setCsrfCookie(res, req.session.csrfToken);
  }
  return next();
}

/**
 * Double-submit verification for state-changing requests. The token must come
 * from the `X-CSRF-Token` header (never the cookie alone), which a cross-site
 * attacker cannot set.
 */
export function verifyCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const pathOnly = req.originalUrl.split('?')[0];
  if (EXEMPT_PATHS.includes(pathOnly)) return next();

  const provided = req.get('x-csrf-token');

  if (
    !req.session ||
    !req.session.csrfToken ||
    !provided ||
    provided !== req.session.csrfToken
  ) {
    return next(new AppError('Invalid or missing CSRF token', 403, 'CSRF_INVALID'));
  }

  return next();
}
