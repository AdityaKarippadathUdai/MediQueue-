import { Router } from 'express';
import patientController from '../controllers/patientController';
import pinAuthMiddleware from '../middleware/pinAuth';
import { validate } from '../middleware/validate';
import { addPatientSchema, updatePatientStatusSchema, patientIdSchema } from '../utils/validation';

const router = Router();

// Public — anyone can view the queue
router.get('/', patientController.getPatients.bind(patientController));
router.get('/:id', validate(patientIdSchema), patientController.getPatientById.bind(patientController));

// Receptionist-only — requires PIN header
router.post('/', validate(addPatientSchema), patientController.addPatient.bind(patientController));
router.put('/:id', pinAuthMiddleware, validate(updatePatientStatusSchema), patientController.updatePatientStatus.bind(patientController));
router.delete('/:id', pinAuthMiddleware, validate(patientIdSchema), patientController.deletePatient.bind(patientController));

export default router;
