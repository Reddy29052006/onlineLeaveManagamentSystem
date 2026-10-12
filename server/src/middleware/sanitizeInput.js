import { AppError } from '../utils/AppError.js';

function containsDangerousKeys(obj) {
  if (!obj || typeof obj !== 'object') return false;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      return true;
    }
    if (typeof obj[key] === 'object' && obj[key] !== null && containsDangerousKeys(obj[key])) {
      return true;
    }
  }
  return false;
}

/**
 * Middleware to prevent NoSQL operator injection and prototype pollution.
 * Rejects requests with any body/query/params key containing '$' or '.'.
 */
export function sanitizeInput(req, res, next) {
  if (
    containsDangerousKeys(req.body) ||
    containsDangerousKeys(req.query) ||
    containsDangerousKeys(req.params)
  ) {
    return next(
      new AppError(
        'Prohibited character or operator detected in request data.',
        400,
        'INVALID_INPUT'
      )
    );
  }
  next();
}
