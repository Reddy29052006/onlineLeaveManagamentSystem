import rateLimit from 'express-rate-limit';

export function createRateLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMITED', message, details: [] },
      });
    },
  });
}

// Disabled under automated tests to keep suites deterministic.
const isTest = process.env.NODE_ENV === 'test';

export const loginLimiter = isTest
  ? (req, res, next) => next()
  : createRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: process.env.NODE_ENV === 'production' ? 10 : 200,
      message: 'Too many login attempts. Please wait a few minutes and try again.',
    });

export const apiLimiter = isTest
  ? (req, res, next) => next()
  : createRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      message: 'Too many requests from this client. Please slow down and try again later.',
    });

