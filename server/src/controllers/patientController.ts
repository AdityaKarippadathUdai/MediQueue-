import { Request, Response, NextFunction } from 'express';
import queueService from '../services/queueService';
import { sendResponse } from '../utils/response';

export class PatientController {
  /**
   * GET /api/patients
   * Retrieve all patients in today's queue.
   */
  async getPatients(req: Request, res: Response, next: NextFunction) {
    try {
      const patients = await queueService.getPatients();
      sendResponse(res, 200, true, 'Patients list retrieved successfully.', patients);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/patients/:token (Polymorphic token/ID lookup)
   * Fetches a patient. Param can be a 24-character ObjectId or daily token number.
   */
  async getPatientByTokenOrId(req: Request, res: Response, next: NextFunction) {
    try {
      const param = req.params.token || req.params.id;
      let patient = null;

      // Check if it's a 24-character MongoDB ObjectId
      if (/^[a-f\d]{24}$/i.test(param)) {
        patient = await queueService.getPatientById(param);
      } else {
        const tokenNum = parseInt(param, 10);
        if (!isNaN(tokenNum)) {
          const patients = await queueService.getPatients();
          patient = patients.find((p) => p.token === tokenNum) || null;
        }
      }

      if (!patient) {
        sendResponse(res, 404, false, `Patient not found with identifier "${param}".`, null);
        return;
      }

      sendResponse(res, 200, true, 'Patient details retrieved successfully.', patient);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Keep getPatientById for compatibility if directly routed
   */
  async getPatientById(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await queueService.getPatientById(req.params.id);
      sendResponse(res, 200, true, 'Patient details retrieved successfully.', patient);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/patients
   * Register a new patient in today's queue.
   */
  async addPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await queueService.addPatient(req.body);
      sendResponse(res, 201, true, 'Patient registered successfully.', patient);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/patients/:id
   * Update a patient's status (active, completed, no-show).
   */
  async updatePatientStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const patient = await queueService.updatePatientStatus(req.params.id, req.body);
      sendResponse(res, 200, true, 'Patient status updated successfully.', patient);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/patients/:id
   * Remove a patient from today's queue (correction).
   */
  async deletePatient(req: Request, res: Response, next: NextFunction) {
    try {
      await queueService.deletePatient(req.params.id);
      sendResponse(res, 200, true, 'Patient removed from queue successfully.', null);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/patients/:id/status
   * Fetch current queue position and remaining wait time.
   */
  async getPatientStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const statusInfo = await queueService.getPatientStatus(req.params.id);
      sendResponse(res, 200, true, 'Patient queue status retrieved successfully.', statusInfo);
    } catch (err) {
      next(err);
    }
  }
}

export const patientController = new PatientController();
export default patientController;
