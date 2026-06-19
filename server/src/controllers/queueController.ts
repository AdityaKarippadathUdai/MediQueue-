import { Request, Response, NextFunction } from 'express';
import queueService from '../services/queueService';

export class QueueController {
  async getQueueStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await queueService.getQueueStatus();
      res.status(200).json(status);
    } catch (err) {
      next(err);
    }
  }

  async callNextPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const room = req.body?.room;
      const patient = await queueService.callNextPatient(room);
      res.status(200).json(patient);
    } catch (err) {
      next(err);
    }
  }

  async updateAverageTime(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await queueService.updateAverageTime(req.body.averageConsultationTime);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async setQueueOpen(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await queueService.setQueueOpen(req.body.isQueueOpen);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await queueService.getStatistics();
      res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  }
}

export const queueController = new QueueController();
export default queueController;
