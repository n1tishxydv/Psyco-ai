import { errorResponse } from '../utils/apiResponse.js';

/**
 * Validates request body using a Zod schema
 */
export function validateBody(schema) {
  return async (req, res, next) => {
    try {
      if (schema && schema.parseAsync) {
        req.body = await schema.parseAsync(req.body);
      }
      next();
    } catch (err) {
      if (err.errors) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return errorResponse(res, 'Request validation failed', 400, 'VALIDATION_ERROR', formattedErrors);
      }
      return errorResponse(res, 'Invalid request structure', 400, 'MALFORMED_REQUEST');
    }
  };
}

/**
 * Validates query parameters using a Zod schema
 */
export function validateQuery(schema) {
  return async (req, res, next) => {
    try {
      if (schema && schema.parseAsync) {
        req.query = await schema.parseAsync(req.query);
      }
      next();
    } catch (err) {
      if (err.errors) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return errorResponse(res, 'Query validation failed', 400, 'VALIDATION_ERROR', formattedErrors);
      }
      return errorResponse(res, 'Invalid query parameters', 400, 'MALFORMED_REQUEST');
    }
  };
}
