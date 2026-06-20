import { patientRepository } from '../repositories/patientRepository';
import { queueSettingsRepository } from '../repositories/queueSettingsRepository';
import { clinicStatisticsRepository } from '../repositories/clinicStatisticsRepository';
import { emitToAll, emitToRoom, emitToPatient } from '../sockets/io';
import { CustomError } from '../middleware/error';
import { Patient, IPatient, PatientStatus, PatientPriority } from '../models/Patient';
import { QueueSettings } from '../models/QueueSettings';
import { ClinicStatistics } from '../models/ClinicStatistics';
import { QueueStatusResponse, StatisticsResponse, PatientResponse } from '../types';
import mongoose from 'mongoose';

const TODAY = (): string => new Date().toISOString().split('T')[0];
const DEPT = 'GEN';

/**
 * Map a Mongoose IPatient document to the API response shape.
 * Maintains the _id/id dual-field contract that the frontend expects.
 */
export const toPatientResponse = (p: IPatient): PatientResponse => {
  const id = String((p as any)._id ?? (p as any).id ?? '');
  return {
    _id: id,
    id,
    name: p.name,
    token: p.token,
    status: p.status,
    purpose: p.purpose ?? 'General Consultation',
    priority: p.priority,
    joinedAt: p.joinedAt instanceof Date ? p.joinedAt.toISOString() : String(p.joinedAt),
    calledAt: p.calledAt ? (p.calledAt instanceof Date ? p.calledAt.toISOString() : String(p.calledAt)) : undefined,
    completedAt: p.completedAt ? (p.completedAt instanceof Date ? p.completedAt.toISOString() : String(p.completedAt)) : undefined,
    estimatedWaitTime: p.estimatedWaitTime ?? undefined,
    assignedRoom: p.assignedRoom ?? undefined,
  };
};

/**
 * Helper to execute database operations within a MongoDB session transaction.
 * Detects if replica sets are not supported (e.g., local standalone MongoDB) and
 * falls back to non-transactional execution to prevent failures.
 */
async function runWithTransaction<T>(
  fn: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result!;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (
      errorMsg.includes('Replica Set') ||
      errorMsg.includes('Transaction numbers are only allowed') ||
      (error as any).codeName === 'IllegalOperation'
    ) {
      console.warn(
        '[QueueService] Transactions are not supported by this MongoDB server configuration. Falling back to non-transactional operations.'
      );
      return fn(undefined as any);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

export class QueueService {
  /**
   * GET /api/patients
   * Get all patients for today, ordered by token number.
   */
  async getPatients(): Promise<PatientResponse[]> {
    const patients = await patientRepository.findAllForDate(TODAY());
    return patients.map(toPatientResponse);
  }

  /**
   * GET /api/patients/:id
   * Get a single patient by ID.
   */
  async getPatientById(id: string): Promise<PatientResponse> {
    const patient = await patientRepository.findById(id);
    if (!patient) {
      const err: CustomError = new Error('Patient not found');
      err.statusCode = 404;
      throw err;
    }
    return toPatientResponse(patient);
  }

  /**
   * Recalculates and broadcasts status updates to all currently waiting patients in their individual rooms.
   * This is triggered whenever the queue shifts (patient added, called, completed, or deleted).
   */
  async broadcastPatientStatusUpdates(): Promise<void> {
    try {
      const today = TODAY();
      // Fetch all patients currently waiting
      const waitingPatients = await Patient.find({ date: today, status: 'waiting' }).exec();
      const settings = await queueSettingsRepository.getOrInitialize(DEPT, today);

      // Sort patients: urgent priority first, then token ASC.
      const sortedPatients = [...waitingPatients].sort((a, b) => {
        if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
        if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
        return a.token - b.token;
      });

      // Emit new status details to each waiting patient's personal room
      sortedPatients.forEach((patient, index) => {
        const queuePosition = index + 1;
        const estimatedWaitTimeRemaining = queuePosition * settings.averageConsultationTime;
        const patientId = String(patient._id);

        emitToPatient(patientId, 'patientStatusUpdated', {
          patient: toPatientResponse(patient),
          queuePosition,
          estimatedWaitTimeRemaining,
          currentToken: settings.currentToken > 0 ? settings.currentToken : '',
        });
      });
    } catch (err) {
      console.error('[QueueService] Failed to broadcast patient status updates:', err);
    }
  }

  /**
   * POST /api/patients (Register a Patient)
   * - Validates that the queue is open.
   * - Atomically issues the next token number.
   * - Calculates estimated wait time.
   * - Inserts the patient and increments clinic statistics.
   * Runs in a transaction with local fallback.
   */
  async addPatient(payload: {
    name: string;
    purpose?: string;
    phone?: string;
    priority?: 'normal' | 'urgent';
  }): Promise<PatientResponse> {
    const today = TODAY();

    return runWithTransaction(async (session) => {
      // 1. Check if the queue is open
      const settings = await queueSettingsRepository.getOrInitialize(DEPT, today);
      if (!settings.isQueueOpen) {
        const err: CustomError = new Error('Queue is currently closed. Please check back later.');
        err.statusCode = 403;
        throw err;
      }

      // 2. Atomically increment last issued token inside transaction
      const settingsWithToken = await QueueSettings.findOneAndUpdate(
        { departmentCode: DEPT },
        { $inc: { lastIssuedToken: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true, session }
      ).exec();

      if (!settingsWithToken) {
        const err: CustomError = new Error('Failed to generate token');
        err.statusCode = 500;
        throw err;
      }

      const token = settingsWithToken.lastIssuedToken;

      // 3. Count waiting patients to calculate estimated wait time
      const waitingCount = await Patient.countDocuments({ date: today, status: 'waiting' })
        .session(session)
        .exec();

      const estimatedWaitTime =
        payload.priority === 'urgent'
          ? Math.max(1, Math.round(settings.averageConsultationTime * 0.5)) // urgent gets halved estimate
          : (waitingCount + 1) * settings.averageConsultationTime;

      // 4. Create patient record
      const newPatient = new Patient({
        name: payload.name,
        phone: payload.phone || '000-000-0000',
        purpose: payload.purpose || 'General Consultation',
        token,
        priority: payload.priority || 'normal',
        estimatedWaitTime,
        date: today,
        status: 'waiting',
        joinedAt: new Date(),
      });
      await newPatient.save({ session });

      // 5. Update statistics
      await ClinicStatistics.findOneAndUpdate(
        { date: today, departmentCode: DEPT },
        { $inc: { totalPatientsToday: 1 } },
        { upsert: true, setDefaultsOnInsert: true, session }
      ).exec();

      await ClinicStatistics.findOneAndUpdate(
        { date: today, departmentCode: DEPT, peakQueueLength: { $lt: waitingCount + 1 } },
        { $set: { peakQueueLength: waitingCount + 1 } },
        { session }
      ).exec();

      return toPatientResponse(newPatient);
    }).then(async (response) => {
      // Broadcast events after transaction commits successfully
      const allPatients = await this.getPatients();
      emitToAll('patientAdded', { patient: response });
      emitToAll('queueUpdated', { patients: allPatients });

      // Trigger status position refresh for other waiting patients
      await this.broadcastPatientStatusUpdates();

      // Push updated stats specifically to receptionist dashboard
      const stats = await this.getDashboardStatistics();
      emitToRoom('reception', 'dashboardStatsUpdated', stats);

      return response;
    });
  }

  /**
   * POST /api/queue/next
   * Call the next patient in queue (urgent-first, then FIFO by token).
   * Atomically transitions the patient to 'active', updates currentToken,
   * and broadcasts to all connected clients.
   * Handles optimistic concurrency retries to support multiple receptionists calling next.
   */
  async callNextPatient(room?: string): Promise<PatientResponse> {
    const today = TODAY();

    return runWithTransaction(async (session) => {
      const settings = await queueSettingsRepository.getOrInitialize(DEPT, today);

      if (!settings.isQueueOpen) {
        const err: CustomError = new Error('Queue is currently closed.');
        err.statusCode = 403;
        throw err;
      }

      // Optimistic concurrency control retry loop
      let nextPatient = null;
      let updatedPatient = null;
      let retries = 0;
      const maxRetries = 5;

      while (!updatedPatient && retries < maxRetries) {
        // Query next waiting patient
        nextPatient = await Patient.findOne({ date: today, status: 'waiting' })
          .sort({ priority: -1, token: 1 }) // Urgent priority first (-1), then token number ascending (1)
          .session(session)
          .exec();

        if (!nextPatient) {
          const err: CustomError = new Error('No patients waiting in queue');
          err.statusCode = 404;
          throw err;
        }

        // Attempt to atomically update status to 'active' ONLY if it is still 'waiting'
        updatedPatient = await Patient.findOneAndUpdate(
          { _id: nextPatient._id, status: 'waiting' },
          {
            $set: {
              status: 'active',
              calledAt: new Date(),
              assignedRoom: room ?? settings.currentRoom,
            },
          },
          { new: true, session }
        ).exec();

        retries++;
      }

      if (!updatedPatient) {
        const err: CustomError = new Error(
          'Failed to call next patient due to concurrent updates. Please try again.'
        );
        err.statusCode = 409;
        throw err;
      }

      // Update currentToken in settings
      await QueueSettings.findOneAndUpdate(
        { departmentCode: DEPT },
        { $set: { currentToken: updatedPatient.token } },
        { session }
      ).exec();

      return toPatientResponse(updatedPatient);
    }).then(async (response) => {
      // Broadcast to displays and patient devices after transaction commits
      emitToAll('currentTokenUpdated', {
        token: response.token,
        displayToken: `QC-${response.token}`,
      });
      const allPatients = await this.getPatients();
      emitToAll('queueUpdated', { patients: allPatients });

      // Trigger status position refresh for other waiting patients
      await this.broadcastPatientStatusUpdates();

      // Push updated stats specifically to receptionist dashboard
      const stats = await this.getDashboardStatistics();
      emitToRoom('reception', 'dashboardStatsUpdated', stats);

      return response;
    });
  }

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
   * Calculate Estimated Wait Time for a priority tier
   */
  async calculateWaitTime(priority: PatientPriority, departmentCode: string = DEPT): Promise<number> {
    const today = TODAY();
    const settings = await queueSettingsRepository.getOrInitialize(departmentCode, today);
    const counts = await patientRepository.countByStatus(today);
    const waitingCount = counts.waiting;

    if (priority === 'urgent') {
      return Math.max(1, Math.round(settings.averageConsultationTime * 0.5));
    } else {
      return (waitingCount + 1) * settings.averageConsultationTime;
    }
  }

  /**
   * GET /api/patients/:id/status
   * Get patient queue status, position, and remaining wait time.
   */
  async getPatientStatus(patientId: string): Promise<{
    patient: PatientResponse;
    queuePosition: number;
    estimatedWaitTimeRemaining: number;
    currentToken: number | string;
  }> {
    const today = TODAY();
    const patient = await Patient.findById(patientId).exec();

    if (!patient) {
      const err: CustomError = new Error('Patient not found');
      err.statusCode = 404;
      throw err;
    }

    const settings = await queueSettingsRepository.getOrInitialize(DEPT, today);

    // If patient is not waiting, position is 0
    if (patient.status !== 'waiting') {
      return {
        patient: toPatientResponse(patient),
        queuePosition: 0,
        estimatedWaitTimeRemaining: 0,
        currentToken: settings.currentToken > 0 ? settings.currentToken : '',
      };
    }

    // Recalculate queue position dynamically:
    // - Urgent patients with a lower token number are ahead of urgent patients.
    // - Urgent patients are always ahead of normal patients.
    // - Normal patients with a lower token number are ahead of normal patients.
    const queryConditions: any[] = [];
    if (patient.priority === 'urgent') {
      queryConditions.push({
        priority: 'urgent',
        token: { $lt: patient.token },
      });
    } else {
      queryConditions.push(
        { priority: 'urgent' },
        { priority: 'normal', token: { $lt: patient.token } }
      );
    }

    const aheadCount = await Patient.countDocuments({
      date: patient.date,
      status: 'waiting',
      $or: queryConditions,
    });

    const queuePosition = aheadCount + 1;
    const estimatedWaitTimeRemaining = queuePosition * settings.averageConsultationTime;

    return {
      patient: toPatientResponse(patient),
      queuePosition,
      estimatedWaitTimeRemaining,
      currentToken: settings.currentToken > 0 ? settings.currentToken : '',
    };
  }

  /**
   * GET /api/queue/statistics (Dashboard stats)
   * Return today's statistics snapshot + historical stats list.
   */
  async getDashboardStatistics(departmentCode: string = DEPT): Promise<{
    today: StatisticsResponse;
    historical: any[];
  }> {
    const today = TODAY();
    const stats = await clinicStatisticsRepository.getOrInitializeForToday(departmentCode, today);

    // Fetch past 7 days of historical statistics (excluding today)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fromDate = sevenDaysAgo.toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const toDate = yesterday.toISOString().split('T')[0];

    const historicalRecords = await clinicStatisticsRepository.getRange(departmentCode, fromDate, toDate);

    const formattedHistorical = historicalRecords.map((r) => ({
      date: r.date,
      totalPatients: r.totalPatientsToday,
      completedPatients: r.completedPatientsToday,
      noShowPatients: r.noShowPatientsToday,
      averageConsultationTime: r.averageActualConsultationTime,
      peakQueueLength: r.peakQueueLength,
    }));

    return {
      today: {
        totalPatientsToday: stats.totalPatientsToday,
        completedPatientsToday: stats.completedPatientsToday,
        noShowPatientsToday: stats.noShowPatientsToday,
        averageActualConsultationTime: stats.averageActualConsultationTime,
        peakQueueLength: stats.peakQueueLength,
        date: today,
      },
      historical: formattedHistorical,
    };
  }

  /**
   * PUT /api/patients/:id (Update Status)
   * Atomic state transitions for patients. Recalculates statistics and settings if completed.
   */
  async updatePatientStatus(
    id: string,
    payload: { status: string; assignedRoom?: string }
  ): Promise<PatientResponse> {
    const today = TODAY();
    const status = payload.status as PatientStatus;

    return runWithTransaction(async (session) => {
      const existing = await Patient.findById(id).session(session).exec();
      if (!existing) {
        const err: CustomError = new Error('Patient not found');
        err.statusCode = 404;
        throw err;
      }

      if (existing.status === status) {
        return toPatientResponse(existing);
      }

      const updateFields: any = { status };
      if (payload.assignedRoom) {
        updateFields.assignedRoom = payload.assignedRoom;
      }

      if (status === 'active') {
        updateFields.calledAt = new Date();
      } else if (status === 'completed' || status === 'no-show') {
        updateFields.completedAt = new Date();
      }

      const updated = await Patient.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true, runValidators: true, session }
      ).exec();

      if (!updated) {
        const err: CustomError = new Error('Failed to update patient status');
        err.statusCode = 500;
        throw err;
      }

      // Handle status specific side effects inside transaction
      if (status === 'active') {
        await QueueSettings.findOneAndUpdate(
          { departmentCode: DEPT },
          { $set: { currentToken: updated.token } },
          { session }
        ).exec();
      } else if (status === 'completed') {
        const calledAt = updated.calledAt ? new Date(updated.calledAt).getTime() : 0;
        const completedAt = updated.completedAt ? new Date(updated.completedAt).getTime() : Date.now();
        const consultationMinutes = calledAt
          ? Math.max(1, Math.round((completedAt - calledAt) / 60000))
          : 0;

        if (consultationMinutes > 0) {
          const stats = await ClinicStatistics.findOneAndUpdate(
            { date: today, departmentCode: DEPT },
            {
              $inc: {
                completedPatientsToday: 1,
                totalConsultationMinutes: consultationMinutes,
              },
            },
            { new: true, upsert: true, setDefaultsOnInsert: true, session }
          ).exec();

          if (stats) {
            const newAvg =
              stats.completedPatientsToday > 0
                ? Math.round(stats.totalConsultationMinutes / stats.completedPatientsToday)
                : 15;

            await ClinicStatistics.findOneAndUpdate(
              { date: today, departmentCode: DEPT },
              { $set: { averageActualConsultationTime: newAvg } },
              { session }
            ).exec();

            await QueueSettings.findOneAndUpdate(
              { departmentCode: DEPT },
              { $set: { averageConsultationTime: newAvg } },
              { session }
            ).exec();
          }
        }
      } else if (status === 'no-show') {
        await ClinicStatistics.findOneAndUpdate(
          { date: today, departmentCode: DEPT },
          { $inc: { noShowPatientsToday: 1 } },
          { upsert: true, setDefaultsOnInsert: true, session }
        ).exec();
      }

      return toPatientResponse(updated);
    }).then(async (response) => {
      // Broadcast updates
      if (status === 'active') {
        emitToAll('currentTokenUpdated', {
          token: response.token,
          displayToken: `QC-${response.token}`,
        });
      } else if (status === 'completed') {
        emitToAll('patientCompleted', { patient: response });
      }

      const allPatients = await this.getPatients();
      emitToAll('queueUpdated', { patients: allPatients });

      // Trigger status position refresh for other waiting patients
      await this.broadcastPatientStatusUpdates();

      // Push updated stats specifically to receptionist dashboard
      const stats = await this.getDashboardStatistics();
      emitToRoom('reception', 'dashboardStatsUpdated', stats);

      return response;
    });
  }

  /**
   * DELETE /api/patients/:id
   * Remove patient from the queue (receptionist correction).
   */
  async deletePatient(id: string): Promise<void> {
    const deleted = await patientRepository.deleteById(id);
    if (!deleted) {
      const err: CustomError = new Error('Patient not found');
      err.statusCode = 404;
      throw err;
    }
    const allPatients = await this.getPatients();
    emitToAll('queueUpdated', { patients: allPatients });

    // Trigger status position refresh for other waiting patients
    await this.broadcastPatientStatusUpdates();

    // Push updated stats specifically to receptionist dashboard
    const stats = await this.getDashboardStatistics();
    emitToRoom('reception', 'dashboardStatsUpdated', stats);
  }

  /**
   * PUT /api/queue/average-time
   * Update target average consultation time manually.
   */
  async updateAverageTime(minutes: number): Promise<{ averageConsultationTime: number }> {
    await queueSettingsRepository.updateAverageConsultationTime(DEPT, minutes);
    emitToAll('averageTimeUpdated', { averageConsultationTime: minutes });

    // Trigger status position refresh since average consultation time shifted
    await this.broadcastPatientStatusUpdates();

    return { averageConsultationTime: minutes };
  }

  /**
   * PUT /api/queue/open
   * Toggle queue status (open/closed).
   */
  async setQueueOpen(isOpen: boolean): Promise<{ isQueueOpen: boolean }> {
    await queueSettingsRepository.setQueueOpen(DEPT, isOpen);
    emitToAll('queueStatusChanged', { isQueueOpen: isOpen });
    return { isQueueOpen: isOpen };
  }
}

export const queueService = new QueueService();
export default queueService;
