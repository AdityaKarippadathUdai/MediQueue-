import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const MAX_REQUESTS = 150; // Limit each IP to 150 requests per window

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipCache = new Map<string, RateLimitRecord>();

/**
 * Custom memory-based sliding-window rate limiter middleware.
 * Returns HTTP 429 in the standardized response format when limits are exceeded.
 */
export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  // Exclude health check from rate limiting to prevent false negatives from health-probers
  if (req.path === '/health' || req.originalUrl === '/api/health') {
    return next();
  }

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let record = ipCache.get(ip);

  // If no record exists or the window has expired, reset/create new record
  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
    ipCache.set(ip, record);
    return next();
  }

  record.count++;

  if (record.count > MAX_REQUESTS) {
    console.warn(`[RateLimit] Blocked request from IP ${ip} (exceeded ${MAX_REQUESTS} requests)`);
    sendResponse(
      res,
      429,
      false,
      'Too many requests. Please try again after 15 minutes.',
      null
    );
    return;
  }

  next();
};

export default rateLimiter;
