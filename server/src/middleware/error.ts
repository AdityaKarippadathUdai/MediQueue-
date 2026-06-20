import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response';

export interface CustomError extends Error {
  statusCode?: number;
}

/**
 * Centralized error handler middleware.
 * Catches all routing/controller failures and returns a standard error JSON structure.
 */
export const errorMiddleware = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(
    `[Error Middleware] Failure on [${req.method} ${req.originalUrl}]:`,
    err.stack || err.message
  );

  const errorData =
    process.env.NODE_ENV === 'development'
      ? { stack: err.stack }
      : null;

  return sendResponse(res, statusCode, false, message, errorData);
};

export default errorMiddleware;
