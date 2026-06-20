import { Request, Response, NextFunction } from 'express';
import queueService from '../services/queueService';
import { sendResponse } from '../utils/response';

export class QueueController {
  async getQueueStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await queueService.getQueueStatus();
      sendResponse(res, 200, true, 'Queue status retrieved successfully.', status);
    } catch (err) {
      next(err);
    }
  }

  async callNextPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const room = req.body?.room;
      const patient = await queueService.callNextPatient(room);
      sendResponse(res, 200, true, 'Next patient called successfully.', patient);
    } catch (err) {
      next(err);
    }
  }

  async updateAverageTime(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await queueService.updateAverageTime(req.body.averageConsultationTime);
      sendResponse(res, 200, true, 'Average consultation time updated successfully.', result);
    } catch (err) {
      next(err);
    }
  }

  async setQueueOpen(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await queueService.setQueueOpen(req.body.isQueueOpen);
      sendResponse(res, 200, true, `Queue ${req.body.isQueueOpen ? 'opened' : 'closed'} successfully.`, result);
    } catch (err) {
      next(err);
    }
  }

  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await queueService.getDashboardStatistics();
      sendResponse(res, 200, true, 'Dashboard statistics retrieved successfully.', stats);
    } catch (err) {
      next(err);
    }
  }

  async calculateWaitTime(req: Request, res: Response, next: NextFunction) {
    try {
      const priority = (req.query.priority as any) === 'urgent' ? 'urgent' : 'normal';
      const waitTime = await queueService.calculateWaitTime(priority);
      sendResponse(res, 200, true, 'Estimated wait time calculated successfully.', {
        estimatedWaitTime: waitTime,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const queueController = new QueueController();
export default queueController;
