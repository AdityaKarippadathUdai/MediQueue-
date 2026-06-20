import { Request, Response, NextFunction } from 'express';

/**
 * Custom request logger middleware.
 * Outputs HTTP details: METHOD PATH STATUS_CODE - RESPONSE_TIMEms - CLIENT_IP
 */
export const loggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - IP: ${ip}`);
  });
  next();
};

export default loggingMiddleware;
