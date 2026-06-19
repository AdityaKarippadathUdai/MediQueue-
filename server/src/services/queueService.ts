import { patientRepository } from '../repositories/patientRepository';
import { queueSettingsRepository } from '../repositories/queueSettingsRepository';
import { clinicStatisticsRepository } from '../repositories/clinicStatisticsRepository';
import { emitToAll } from '../sockets/io';
import { CustomError } from '../middleware/error';
import { toPatientResponse } from './patientService';
import { QueueStatusResponse, StatisticsResponse, PatientResponse } from '../types';

const TODAY = (): string => new Date().toISOString().split('T')[0];
const DEPT = 'GEN';

export class QueueService {
  /**
   * GET /api/queue/status
   * Returns current token, waiting/active/completed counts, and average consultation time.
   */
  async getQueueStatus(): Promise<QueueStatusResponse> {
    const today = TODAY();

    const [settings, counts] = await Promise.all([
      queueSettingsRepository.getOrInitialize(DEPT, today),
      patientRepository.countByStatus(today),
    ]);

    return {
      currentToken: settings.currentToken > 0 ? settings.currentToken : '',
      waitingCount: counts.waiting,
      activeCount: counts.active,
      completedCount: counts.completed,
      noShowCount: counts['no-show'],
      averageConsultationTime: settings.averageConsultationTime,
      isQueueOpen: settings.isQueueOpen,
      date: today,
    };
  }

  /**
   * POST /api/queue/next
   * Call the next patient in queue (urgent-first, then FIFO by token).
   * Atomically transitions the patient to 'active', updates currentToken,
   * and broadcasts to all connected clients.
   */
  async callNextPatient(room?: string): Promise<PatientResponse> {
    const today = TODAY();
    const settings = await queueSettingsRepository.getOrInitialize(DEPT, today);

    if (!settings.isQueueOpen) {
      const err: CustomError = new Error('Queue is currently closed.');
      err.statusCode = 403;
      throw err;
    }

    const nextPatient = await patientRepository.findNextWaiting(today);
    if (!nextPatient) {
      const err: CustomError = new Error('No patients waiting in queue');
      err.statusCode = 404;
      throw err;
    }

    const patientId = String((nextPatient as any)._id ?? (nextPatient as any).id ?? '');

    const updated = await patientRepository.updateStatus(patientId, {
      status: 'active',
      assignedRoom: room ?? settings.currentRoom,
    });

    if (!updated) {
      const err: CustomError = new Error('Failed to call next patient');
      err.statusCode = 500;
      throw err;
    }

    // Update currentToken in settings
    await queueSettingsRepository.setCurrentToken(DEPT, updated.token);

    const response = toPatientResponse(updated);

    // Broadcast to displays and patient devices
    emitToAll('currentTokenUpdated', {
      token: updated.token,
      displayToken: `QC-${updated.token}`,
    });
    const allPatients = (await patientRepository.findAllForDate(today)).map(toPatientResponse);
    emitToAll('queueUpdated', { patients: allPatients });

    return response;
  }

  /**
   * PUT /api/queue/average-time
   * Update the target average consultation time (affects EWT calculations).
   */
  async updateAverageTime(minutes: number): Promise<{ averageConsultationTime: number }> {
    await queueSettingsRepository.updateAverageConsultationTime(DEPT, minutes);
    emitToAll('averageTimeUpdated', { averageConsultationTime: minutes });
    return { averageConsultationTime: minutes };
  }

  /**
   * PUT /api/queue/open
   * Open or close the queue. When closed, patient registration is blocked.
   */
  async setQueueOpen(isOpen: boolean): Promise<{ isQueueOpen: boolean }> {
    await queueSettingsRepository.setQueueOpen(DEPT, isOpen);
    emitToAll('queueStatusChanged', { isQueueOpen: isOpen });
    return { isQueueOpen: isOpen };
  }

  /**
   * GET /api/queue/statistics
   * Return today's clinic performance statistics.
   */
  async getStatistics(): Promise<StatisticsResponse> {
    const today = TODAY();
    const stats = await clinicStatisticsRepository.getOrInitializeForToday(DEPT, today);

    return {
      totalPatientsToday: stats.totalPatientsToday,
      completedPatientsToday: stats.completedPatientsToday,
      noShowPatientsToday: stats.noShowPatientsToday,
      averageActualConsultationTime: stats.averageActualConsultationTime,
      peakQueueLength: stats.peakQueueLength,
      date: today,
    };
  }
}

export const queueService = new QueueService();
export default queueService;
