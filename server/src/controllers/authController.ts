import { Request, Response } from 'express';
import config from '../config';
import { sendResponse } from '../utils/response';

export class AuthController {
  /**
   * POST /api/reception/login
   * Validates receptionist credentials (PIN).
   */
  login(req: Request, res: Response): void {
    const { pin } = req.body;

    if (!pin || pin !== config.receptionistPin) {
      sendResponse(res, 401, false, 'Invalid Access PIN.', null);
      return;
    }

    sendResponse(res, 200, true, 'Access granted.', {
      token: config.receptionistPin, // Return the verified PIN to be used as header value
    });
  }

  /**
   * Keep verifyPin for backward compatibility/internal router fallback
   */
  verifyPin(req: Request, res: Response): void {
    this.login(req, res);
  }
}

export const authController = new AuthController();
export default authController;
