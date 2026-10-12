import { AppError } from '../utils/AppError.js';

/**
 * Restrict a route to one or more roles. Must run after `authenticate`.
 */
export function authorizeRole(...allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHENTICATED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action',
          403,
          'FORBIDDEN'
        )
      );
    }

    return next();
  };
}
