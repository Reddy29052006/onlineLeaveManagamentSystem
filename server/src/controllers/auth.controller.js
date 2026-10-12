import {
  validateCredentials,
  updateLastLogin,
  changePassword as changePasswordService,
} from '../services/auth.service.js';
import { getPublicUser } from '../models/User.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { setCsrfCookie, clearCsrfCookie, generateCsrfToken } from '../middleware/csrf.js';

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

export async function login(req, res, next) {
  try {
    const { identifier, password } = req.body || {};

    if (!identifier || !password) {
      throw new AppError(
        'Email/username and password are required',
        400,
        'VALIDATION_ERROR'
      );
    }

    const result = await validateCredentials({ identifier, password });

    if (!result.user) {
      if (result.reason === 'inactive') {
        throw new AppError(
          'This account is inactive. Contact the administrator.',
          403,
          'ACCOUNT_INACTIVE'
        );
      }
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const { user } = result;

    // Rotate the session identifier to prevent session fixation.
    await regenerateSession(req);
    req.session.userId = user._id.toString();
    req.session.role = user.role;

    const csrfToken = generateCsrfToken();
    req.session.csrfToken = csrfToken;
    await saveSession(req);
    setCsrfCookie(res, csrfToken);

    updateLastLogin(user._id).catch(() => {});

    return res.json({
      success: true,
      data: { user: getPublicUser(user) },
      message: 'Signed in successfully',
    });
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res) {
  return res.json({
    success: true,
    data: { user: getPublicUser(req.user) },
    message: 'OK',
  });
}

export async function logout(req, res, next) {
  try {
    await new Promise((resolve, reject) => {
      req.session.destroy((error) => (error ? reject(error) : resolve()));
    });
    res.clearCookie(env.sessionCookieName, { path: '/' });
    clearCsrfCookie(res);
    return res.json({ success: true, data: null, message: 'Signed out successfully' });
  } catch (error) {
    return next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      throw new AppError(
        'currentPassword and newPassword are required',
        400,
        'VALIDATION_ERROR'
      );
    }

    if (String(newPassword).length < 8) {
      throw new AppError(
        'New password must be at least 8 characters long',
        400,
        'VALIDATION_ERROR'
      );
    }

    if (newPassword === currentPassword) {
      throw new AppError(
        'New password must be different from the current password',
        400,
        'VALIDATION_ERROR'
      );
    }

    const updated = await changePasswordService(
      req.user,
      currentPassword,
      newPassword
    );

    return res.json({
      success: true,
      data: { user: getPublicUser(updated) },
      message: 'Password changed successfully',
    });
  } catch (error) {
    return next(error);
  }
}
