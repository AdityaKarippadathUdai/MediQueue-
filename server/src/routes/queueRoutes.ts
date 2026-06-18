import { Router } from 'express';
import queueController from '../controllers/queueController';
import { validate } from '../middleware/validate';
import { callNextPatientSchema, updateAverageTimeSchema } from '../utils/validation';

const router = Router();

router.post('/next', validate(callNextPatientSchema), queueController.callNextPatient);
router.get('/status', queueController.getQueueStatus);
router.put('/average-time', validate(updateAverageTimeSchema), queueController.updateAverageTime);

export default router;
