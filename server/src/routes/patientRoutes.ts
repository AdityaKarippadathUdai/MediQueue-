import { Router } from 'express';
import patientController from '../controllers/patientController';
import pinAuthMiddleware from '../middleware/pinAuth';
import { validate } from '../middleware/validate';
import { addPatientSchema, updatePatientStatusSchema, patientIdSchema } from '../utils/validation';

const router = Router();

// Public — anyone can view the queue
router.get('/', patientController.getPatients.bind(patientController));

// Polymorphic lookup by token number or MongoDB ID (no strict hex-only check to permit integers)
router.get('/:token', patientController.getPatientByTokenOrId.bind(patientController));

// Specific status check for a patient
router.get('/:id/status', validate(patientIdSchema), patientController.getPatientStatus.bind(patientController));

// Receptionist-only — requires PIN header
router.post('/', validate(addPatientSchema), patientController.addPatient.bind(patientController));
router.put('/:id', pinAuthMiddleware, validate(updatePatientStatusSchema), patientController.updatePatientStatus.bind(patientController));
router.delete('/:id', pinAuthMiddleware, validate(patientIdSchema), patientController.deletePatient.bind(patientController));

export default router;
