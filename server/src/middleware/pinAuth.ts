import { Request, Response, NextFunction } from 'express';
import config from '../config';

export const pinAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const pinHeader = req.headers['x-access-pin'] || req.headers['x-auth-pin'] || req.headers['authorization'];
  
  if (!pinHeader) {
    return res.status(401).json({ message: 'Authentication required. No Access PIN provided.' });
  }

  // Clean the header in case it was sent as Bearer <PIN>
  let providedPin = String(pinHeader).trim();
  if (providedPin.toLowerCase().startsWith('bearer ')) {
    providedPin = providedPin.substring(7).trim();
  }

  if (providedPin !== config.receptionistPin) {
    return res.status(403).json({ message: 'Authentication failed. Invalid Access PIN.' });
  }

  next();
};

export default pinAuthMiddleware;
