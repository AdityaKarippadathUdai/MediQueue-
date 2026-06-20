import { Request, Response, NextFunction } from 'express';
import config from '../config';
import { sendResponse } from '../utils/response';

/**
 * Middleware to authenticate receptionist requests via x-access-pin / x-auth-pin headers.
 * Formats errors and returns them in the standardized response format.
 */
export const pinAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const pinHeader = req.headers['x-access-pin'] || req.headers['x-auth-pin'] || req.headers['authorization'];
  
  if (!pinHeader) {
    sendResponse(res, 401, false, 'Authentication required. No Access PIN provided.', null);
    return;
  }

  // Clean header in case it was sent as Bearer <PIN>
  let providedPin = String(pinHeader).trim();
  if (providedPin.toLowerCase().startsWith('bearer ')) {
    providedPin = providedPin.substring(7).trim();
  }

  if (providedPin !== config.receptionistPin) {
    sendResponse(res, 403, false, 'Authentication failed. Invalid Access PIN.', null);
    return;
  }

  next();
};

export default pinAuthMiddleware;
