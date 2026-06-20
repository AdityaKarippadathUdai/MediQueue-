import { Router } from 'express';
import queueController from '../controllers/queueController';
import pinAuthMiddleware from '../middleware/pinAuth';
import { validate } from '../middleware/validate';
import {
  callNextPatientSchema,
  updateAverageTimeSchema,
  setQueueOpenSchema,
} from '../utils/validation';

const router = Router();

// Public — any connected client can see status / wait times
router.get('/status', queueController.getQueueStatus.bind(queueController));
router.get('/statistics', queueController.getStatistics.bind(queueController));
router.get('/wait-time', queueController.calculateWaitTime.bind(queueController));

// Receptionist-only — requires PIN header
router.post('/next', pinAuthMiddleware, validate(callNextPatientSchema), queueController.callNextPatient.bind(queueController));
router.put('/average-time', pinAuthMiddleware, validate(updateAverageTimeSchema), queueController.updateAverageTime.bind(queueController));
router.put('/open', pinAuthMiddleware, validate(setQueueOpenSchema), queueController.setQueueOpen.bind(queueController));

export default router;
