import { Response } from 'express';

/**
 * Standardized API response formatter.
 * Ensures all HTTP responses match the contract: { success: boolean, message: string, data: any }
 */
export const sendResponse = (
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data: any = null
): Response => {
  return res.status(statusCode).json({
    success,
    message,
    data,
  });
};

export default sendResponse;
