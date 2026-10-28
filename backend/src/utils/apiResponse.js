/**
 * Formats a successful API response envelope
 */
export function successResponse(res, data, statusCode = 200, meta = {}) {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null,
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
      ...meta,
    },
  });
}

/**
 * Formats an error API response envelope
 */
export function errorResponse(res, message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  });
}
