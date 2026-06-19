import { Router } from 'express';
import authController from '../controllers/authController';
import { validate } from '../middleware/validate';
import { verifyPinSchema } from '../utils/validation';

const router = Router();

// POST /api/auth/verify-pin — verify receptionist PIN
router.post('/verify-pin', validate(verifyPinSchema), authController.verifyPin.bind(authController));

export default router;
