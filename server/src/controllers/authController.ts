import { Request, Response } from 'express';
import config from '../config';

export class AuthController {
  /**
   * POST /api/auth/verify-pin
   * Validates the receptionist PIN. The frontend stores the access grant
   * locally; this endpoint simply confirms correctness.
   */
  verifyPin(req: Request, res: Response): void {
    const { pin } = req.body;

    if (!pin || pin !== config.receptionistPin) {
      res.status(401).json({ success: false, message: 'Invalid Access PIN.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Access granted.' });
  }
}

export const authController = new AuthController();
export default authController;
