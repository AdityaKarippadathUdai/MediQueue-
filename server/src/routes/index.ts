import { Router } from 'express';
import authRoutes from './authRoutes';
import receptionRoutes from './receptionRoutes';
import patientRoutes from './patientRoutes';
import queueRoutes from './queueRoutes';
import dashboardRoutes from './dashboardRoutes';

const router = Router();

// Mount individual sub-routers under /api
router.use('/auth', authRoutes); // Backward compatibility
router.use('/reception', receptionRoutes);
router.use('/patients', patientRoutes);
router.use('/queue', queueRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
