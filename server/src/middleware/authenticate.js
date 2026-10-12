import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';

/**
 * Resolve the signed-in user from the session on every request so that
 * deactivated or deleted accounts lose access immediately.
 */
export async function authenticate(req, res, next) {
  try {
    const userId = req.session ? req.session.userId : undefined;

    if (!userId) {
      throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
    }

    const user = await User.findById(userId);

    if (!user) {
      req.session.destroy(() => {});
      throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
    }

    if (user.accountStatus !== 'active') {
      req.session.destroy(() => {});
      throw new AppError(
        'This account is inactive. Contact the administrator.',
        403,
        'ACCOUNT_INACTIVE'
      );
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}
