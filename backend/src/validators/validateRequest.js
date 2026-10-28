import { errorResponse } from '../utils/apiResponse.js';

export function validateRequest(schema) {
  return async (req, res, next) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
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
