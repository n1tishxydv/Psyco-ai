import { logger } from '../utils/logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;

    // Do not log request body for clinical or auth routes to prevent accidental sensitive data capture
    logger.info(`${method} ${originalUrl} ${statusCode} - ${duration}ms [${ip}]`);
  });

  next();
}
