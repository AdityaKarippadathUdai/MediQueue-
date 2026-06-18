import { Router } from 'express';
import authRoutes from './authRoutes';
import patientRoutes from './patientRoutes';
import queueRoutes from './queueRoutes';

const router = Router();

// Mount individual sub-routers
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/queue', queueRoutes);

export default router;
