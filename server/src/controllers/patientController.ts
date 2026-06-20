import { Request, Response, NextFunction } from 'express';
import queueService from '../services/queueService';
import { PatientPriority } from '../models/Patient';

export class PatientController {
  async getPatients(req: Request, res: Response, next: NextFunction) {
    try {
      const patients = await queueService.getPatients();
      res.status(200).json(patients);
    } catch (err) {
      next(err);
    }
  }

  async getPatientById(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await queueService.getPatientById(req.params.id);
      res.status(200).json(patient);
    } catch (err) {
      next(err);
    }
  }

  async addPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await queueService.addPatient(req.body);
      res.status(201).json(patient);
    } catch (err) {
      next(err);
    }
  }

  async updatePatientStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await queueService.updatePatientStatus(req.params.id, req.body);
      res.status(200).json(patient);
    } catch (err) {
      next(err);
    }
  }

  async deletePatient(req: Request, res: Response, next: NextFunction) {
    try {
      await queueService.deletePatient(req.params.id);
      res.status(200).json({ message: 'Patient removed from queue successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async getPatientStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const statusInfo = await queueService.getPatientStatus(req.params.id);
      res.status(200).json(statusInfo);
    } catch (err) {
      next(err);
    }
  }
}

export const patientController = new PatientController();
export default patientController;
