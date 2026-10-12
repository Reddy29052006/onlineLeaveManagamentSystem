import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      details: [],
    },
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected server error occurred.';
  let details = [];

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details || [];
  } else if (error.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_IDENTIFIER';
    message = `Invalid identifier format for ${error.path || 'parameter'}.`;
    details = [{ field: error.path, message: 'Invalid identifier format.' }];
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed.';
    details = Object.values(error.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (error.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE';
    const key = Object.keys(error.keyValue || {})[0] || 'resource';
    message = `A record with this ${key} already exists.`;
    details = [{ field: key, message: 'Duplicate value.' }];
  } else {
    console.error('[error] unhandled internal error:', error);
  }

  const body = {
    success: false,
    error: { code, message, details },
  };

  if (env.nodeEnv === 'development' && statusCode === 500) {
    body.error.stack = error.stack;
  }

  res.status(statusCode).json(body);
}
