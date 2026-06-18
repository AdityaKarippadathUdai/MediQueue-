import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import errorMiddleware from './middleware/error';
import config from './config';

const app = express();

// Enable Helmet for HTTP security headers
app.use(helmet());

// Enable CORS with settings from config
app.use(
  cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// Request logging via Morgan
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
}

// Parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Mount all API endpoints under /api
app.use('/api', routes);

// Fallback handler for unmapped routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

// Register global error handler
app.use(errorMiddleware);

export default app;
export { app };
