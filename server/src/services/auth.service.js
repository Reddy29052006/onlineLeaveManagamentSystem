import User from '../models/User.js';
import { verifyPassword, hashPassword } from '../utils/password.js';
import { AppError } from '../utils/AppError.js';

/**
 * Validate raw credentials without leaking which factor failed.
 * Returns { user } on success, or { reason } describing the failure.
 */
export async function validateCredentials({ identifier, password }) {
  const normalized = String(identifier).trim().toLowerCase();

  const user = await User.findOne({
    $or: [{ email: normalized }, { username: normalized }],
  }).select('+passwordHash');

  if (!user) {
    return { user: null, reason: 'invalid' };
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    return { user: null, reason: 'invalid' };
  }

  if (user.accountStatus !== 'active') {
    return { user: null, reason: 'inactive' };
  }

  return { user };
}

export async function updateLastLogin(userId) {
  await User.updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } });
}

export async function changePassword(user, currentPassword, newPassword) {
  const withHash = await User.findById(user._id).select('+passwordHash');

  if (!withHash) {
    throw new AppError('Authentication required', 401, 'UNAUTHENTICATED');
  }

  const matches = await verifyPassword(currentPassword, withHash.passwordHash);
  if (!matches) {
    throw new AppError(
      'Current password is incorrect',
      400,
      'INVALID_CURRENT_PASSWORD'
    );
  }

  withHash.passwordHash = await hashPassword(newPassword);
  withHash.mustChangePassword = false;
  await withHash.save();

  return withHash;
}
