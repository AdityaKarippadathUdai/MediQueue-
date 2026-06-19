import { patientRepository } from '../repositories/patientRepository';
import { queueSettingsRepository } from '../repositories/queueSettingsRepository';
import { clinicStatisticsRepository } from '../repositories/clinicStatisticsRepository';
import { emitToAll } from '../sockets/io';
import { CustomError } from '../middleware/error';
import { IPatient } from '../models/Patient';
import { PatientResponse, PatientStatus } from '../types';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// PatientService
// ─────────────────────────────────────────────

export class PatientService {
  /**
   * Get all patients for today, ordered by token number.
   */
  async getPatients(): Promise<PatientResponse[]> {
    const patients = await patientRepository.findAllForDate(TODAY());
    return patients.map(toPatientResponse);
  }

  /**
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
   * Register a new patient into today's queue.
   * - Atomically issues the next token number.
   * - Calculates estimated wait time based on waiting count × average consultation time.
   * - Emits Socket.IO events to all connected clients.
   */
  async addPatient(payload: {
    name: string;
    purpose?: string;
    phone?: string;
    priority?: 'normal' | 'urgent';
  }): Promise<PatientResponse> {
    const today = TODAY();

    // Ensure queue is open
    const settings = await queueSettingsRepository.getOrInitialize(DEPT, today);
    if (!settings.isQueueOpen) {
      const err: CustomError = new Error('Queue is currently closed. Please check back later.');
      err.statusCode = 403;
      throw err;
    }

    // Atomic token generation (prevents race-condition duplicate tokens)
    const token = await queueSettingsRepository.issueNextToken(DEPT, today);

    // Calculate estimated wait time: waitingPatients × averageConsultationTime
    const counts = await patientRepository.countByStatus(today);
    const waitingCount = counts.waiting;
    const estimatedWaitTime =
      payload.priority === 'urgent'
        ? Math.max(1, Math.round(settings.averageConsultationTime * 0.5)) // urgent gets halved estimate
        : (waitingCount + 1) * settings.averageConsultationTime;

    const newPatient = await patientRepository.create({
      name: payload.name,
      phone: payload.phone,
      purpose: payload.purpose,
      token,
      priority: payload.priority || 'normal',
      estimatedWaitTime,
      date: today,
    });

    const response = toPatientResponse(newPatient);

    // Update statistics
    await clinicStatisticsRepository.incrementTotal(DEPT, today);
    await clinicStatisticsRepository.updatePeakQueueLength(DEPT, today, waitingCount + 1);

    // Broadcast to all connected clients
    const allPatients = await this.getPatients();
    emitToAll('patientAdded', { patient: response });
    emitToAll('queueUpdated', { patients: allPatients });

    return response;
  }

  /**
   * Update a patient's status (calling, completed, no-show).
   * - Sets the appropriate lifecycle timestamps.
   * - Records statistics for completed patients.
   * - Emits Socket.IO broadcasts.
   */
  async updatePatientStatus(
    id: string,
    payload: { status: string; assignedRoom?: string }
  ): Promise<PatientResponse> {
    const today = TODAY();

    const existing = await patientRepository.findById(id);
    if (!existing) {
      const err: CustomError = new Error('Patient not found');
      err.statusCode = 404;
      throw err;
    }

    const status = payload.status as PatientStatus;

    const updated = await patientRepository.updateStatus(id, {
      status,
      assignedRoom: payload.assignedRoom,
    });

    if (!updated) {
      const err: CustomError = new Error('Failed to update patient status');
      err.statusCode = 500;
      throw err;
    }

    const response = toPatientResponse(updated);

    // Side effects based on the new status
    if (status === 'active') {
      // Update currentToken in settings
      await queueSettingsRepository.setCurrentToken(DEPT, updated.token);
      emitToAll('currentTokenUpdated', {
        token: updated.token,
        displayToken: `QC-${updated.token}`,
      });
    } else if (status === 'completed') {
      // Calculate actual consultation duration
      const calledAt = updated.calledAt ? new Date(updated.calledAt).getTime() : 0;
      const completedAt = updated.completedAt ? new Date(updated.completedAt).getTime() : Date.now();
      const consultationMinutes = calledAt
        ? Math.max(1, Math.round((completedAt - calledAt) / 60000))
        : 0;

      if (consultationMinutes > 0) {
        const stats = await clinicStatisticsRepository.recordCompletion(DEPT, today, consultationMinutes);
        // Keep settings average consultation time in sync with actual measurements
        await queueSettingsRepository.updateAverageConsultationTime(
          DEPT,
          stats.averageActualConsultationTime || 15
        );
      }
      emitToAll('patientCompleted', { patient: response });
    } else if (status === 'no-show') {
      await clinicStatisticsRepository.recordNoShow(DEPT, today);
    }

    // Always broadcast the full updated queue
    const allPatients = await this.getPatients();
    emitToAll('queueUpdated', { patients: allPatients });

    return response;
  }

  /**
   * Remove a patient from the queue (receptionist correction).
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
  }
}

export const patientService = new PatientService();
export default patientService;
