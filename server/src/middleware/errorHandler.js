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
  const isOperational = error instanceof AppError;
  const statusCode = isOperational ? error.statusCode : 500;
  const code = isOperational ? error.code : 'INTERNAL_ERROR';
  const message = isOperational
    ? error.message
    : 'An unexpected server error occurred.';
  const details = isOperational ? error.details : [];

  if (!isOperational) {
    console.error('[error] unhandled:', error);
  }

  const body = {
    success: false,
    error: { code, message, details },
  };

  if (!isOperational && env.nodeEnv === 'development') {
    body.error.stack = error.stack;
  }

  res.status(statusCode).json(body);
}
