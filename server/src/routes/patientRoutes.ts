import { Router } from 'express';
import patientController from '../controllers/patientController';
import { validate } from '../middleware/validate';
import { addPatientSchema, updatePatientStatusSchema } from '../utils/validation';

const router = Router();

router.get('/', patientController.getPatients);
router.get('/:id', patientController.getPatientById);
router.post('/', validate(addPatientSchema), patientController.addPatient);
router.put('/:id', validate(updatePatientStatusSchema), patientController.updatePatientStatus);
router.delete('/:id', patientController.deletePatient);

export default router;
