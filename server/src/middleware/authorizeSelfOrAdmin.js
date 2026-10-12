import { AppError } from '../utils/AppError.js';

/**
 * Allow administrators, or the user whose id matches the given route param.
 * Must run after `authenticate`.
 */
export function authorizeSelfOrAdmin(paramName = 'id') {
  return function selfOrAdminGuard(req, res, next) {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHENTICATED'));
    }

    if (req.user.role === 'admin') {
      return next();
    }

    if (String(req.user._id) === String(req.params[paramName])) {
      return next();
    }

    return next(
      new AppError('You do not have permission to view this resource', 403, 'FORBIDDEN')
    );
  };
}
