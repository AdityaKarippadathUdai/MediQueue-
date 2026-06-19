import { Request, Response, NextFunction } from 'express';
import patientService from '../services/patientService';

export class PatientController {
  async getPatients(req: Request, res: Response, next: NextFunction) {
    try {
      const patients = await patientService.getPatients();
      res.status(200).json(patients);
    } catch (err) {
      next(err);
    }
  }

  async getPatientById(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await patientService.getPatientById(req.params.id);
      res.status(200).json(patient);
    } catch (err) {
      next(err);
    }
  }

  async addPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await patientService.addPatient(req.body);
      res.status(201).json(patient);
    } catch (err) {
      next(err);
    }
  }

  async updatePatientStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await patientService.updatePatientStatus(req.params.id, req.body);
      res.status(200).json(patient);
    } catch (err) {
      next(err);
    }
  }

  async deletePatient(req: Request, res: Response, next: NextFunction) {
    try {
      await patientService.deletePatient(req.params.id);
      res.status(200).json({ message: 'Patient removed from queue successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

export const patientController = new PatientController();
export default patientController;
