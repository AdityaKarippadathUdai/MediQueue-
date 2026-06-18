import { Request, Response, NextFunction } from 'express';
import queueService from '../services/queueService';

export class QueueController {
  async callNextPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const room = req.body.room || 'Examination Room 1';
      const patient = await queueService.callNextPatient(room);
      return res.status(200).json(patient);
    } catch (error) {
      next(error);
    }
  }

  async getQueueStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await queueService.getQueueStatus();
      return res.status(200).json(status);
    } catch (error) {
      next(error);
    }
  }

  async updateAverageTime(req: Request, res: Response, next: NextFunction) {
    try {
      const minutes = req.body.averageConsultationTime;
      const result = await queueService.updateAverageTime(minutes);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const queueController = new QueueController();
export default queueController;
