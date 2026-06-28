import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import errorMiddleware from './middleware/error';
import loggingMiddleware from './middleware/logging';
import rateLimiter from './middleware/rateLimiter';
import config from './config';
import { sendResponse } from './utils/response';

const app = express();

// Enable Helmet for HTTP security headers
app.use(helmet());

// Enable CORS with settings from config
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })
);

// Handle CORS preflight
app.options('*', cors());

// Register custom request logger middleware globally
app.use(loggingMiddleware);

// Register global rate-limiting middleware (excludes health check)
app.use(rateLimiter);

// Parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (publicly accessible, standardized response format)
app.get('/health', (req, res) => {
  sendResponse(res, 200, true, 'Queue Cure API is healthy and operational.', {
    status: 'OK',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Also mount health check under /api/health for routing consistency
app.get('/api/health', (req, res) => {
  sendResponse(res, 200, true, 'Queue Cure API is healthy and operational.', {
    status: 'OK',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Mount all API endpoints under /api
app.use('/api', routes);

// Fallback handler for unmapped routes (standardized response format)
app.use((req, res) => {
  sendResponse(res, 404, false, `Route ${req.method} ${req.originalUrl} not found.`, null);
});

// Register global centralized error handler
app.use(errorMiddleware);

export default app;
export { app };
