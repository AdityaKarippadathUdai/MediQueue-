import { Router } from 'express';
import queueController from '../controllers/queueController';
import pinAuthMiddleware from '../middleware/pinAuth';

const router = Router();

// GET /api/dashboard/stats — retrieve queue dashboard stats (protected by receptionist PIN)
router.get('/stats', pinAuthMiddleware, queueController.getStatistics.bind(queueController));

export default router;
