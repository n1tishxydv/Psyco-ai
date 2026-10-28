import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { standardRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';
import { errorResponse } from './utils/apiResponse.js';

const app = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: config.isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// Cross-Origin Resource Sharing
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (origin === config.frontendUrl || !config.isProduction) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request Logging (Sanitized, no clinical or auth payloads)
app.use(requestLogger);

// Global Rate Limiting
app.use(standardRateLimiter);

// API Routes Mounted at Configured Prefix (/api/v1)
app.use(config.apiPrefix, apiRoutes);

// Catch-all 404 Handler for undefined routes
app.use((req, res) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
