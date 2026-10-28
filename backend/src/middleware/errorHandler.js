import config from '../config/index.js';
import { errorResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  // Handle Zod validation errors cleanly with 400 Bad Request
  if (err.name === 'ZodError' || err.constructor?.name === 'ZodError') {
    const errorMsg = err.errors?.map((e) => e.message).join(', ') || 'Validation error';
    return errorResponse(res, errorMsg, 400, 'VALIDATION_ERROR', err.errors);
  }

  // Log error message safely
  logger.error(`Unhandled Error: ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    stack: config.isProduction ? undefined : err.stack,
  });

  const statusCode = err.statusCode || err.status || 500;
  const message = config.isProduction && statusCode === 500
    ? 'An unexpected internal error occurred. Please contact support.'
    : err.message || 'Internal Server Error';

  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const details = err.details || null;

  return errorResponse(res, message, statusCode, code, details);
}
