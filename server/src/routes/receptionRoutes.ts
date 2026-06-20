import { Router } from 'express';
import authController from '../controllers/authController';
import { validate } from '../middleware/validate';
import { verifyPinSchema } from '../utils/validation';

const router = Router();

// POST /api/reception/login — receptionist authentication via access PIN
router.post('/login', validate(verifyPinSchema), authController.login.bind(authController));

export default router;
