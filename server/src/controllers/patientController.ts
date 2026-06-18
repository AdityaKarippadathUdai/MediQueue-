import { Request, Response, NextFunction } from 'express';
import patientService from '../services/patientService';

export class PatientController {
  async getPatients(req: Request, res: Response, next: NextFunction) {
    try {
      const patients = await patientService.getPatients();
      return res.status(200).json(patients);
    } catch (error) {
      next(error);
    }
  }

  async getPatientById(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await patientService.getPatientById(req.params.id);
      return res.status(200).json(patient);
    } catch (error) {
      next(error);
    }
  }

  async addPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await patientService.addPatient(req.body);
      return res.status(201).json(patient);
    } catch (error) {
      next(error);
    }
  }

  async updatePatientStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await patientService.updatePatientStatus(req.params.id, req.body);
      return res.status(200).json(patient);
    } catch (error) {
      next(error);
    }
  }

  async deletePatient(req: Request, res: Response, next: NextFunction) {
    try {
      await patientService.deletePatient(req.params.id);
      return res.status(200).json({ message: 'Patient removed successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const patientController = new PatientController();
export default patientController;
