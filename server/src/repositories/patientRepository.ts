import { Patient, IPatient, PatientStatus } from '../models/Patient';
import { Types } from 'mongoose';

// ─────────────────────────────────────────────
// Input Interfaces
// ─────────────────────────────────────────────

export interface CreatePatientInput {
  name: string;
  phone?: string;
  purpose?: string;
  token: number;
  priority?: 'normal' | 'urgent';
  estimatedWaitTime?: number;
  date: string; // YYYY-MM-DD
}

export interface UpdatePatientStatusInput {
  status: PatientStatus;
  assignedRoom?: string;
}

// ─────────────────────────────────────────────
// Repository Class
// ─────────────────────────────────────────────

export class PatientRepository {
  /**
   * Create a new patient record for today's queue.
   */
  async create(input: CreatePatientInput): Promise<IPatient> {
    const patient = new Patient({
      name: input.name,
      phone: input.phone || '000-000-0000',
      purpose: input.purpose || 'General Consultation',
      token: input.token,
      priority: input.priority || 'normal',
      estimatedWaitTime: input.estimatedWaitTime ?? null,
      date: input.date,
      status: 'waiting',
      joinedAt: new Date(),
    });

    return patient.save();
  }

  /**
   * Get all patients for a specific date, ordered by token ascending.
   * This is the primary list view for Receptionist and Display screens.
   */
  async findAllForDate(date: string): Promise<IPatient[]> {
    return Patient.find({ date }).sort({ token: 1 }).lean({ virtuals: true }).exec();
  }

  /**
   * Get a single patient by their MongoDB _id.
   */
  async findById(id: string): Promise<IPatient | null> {
    return Patient.findById(new Types.ObjectId(id)).lean({ virtuals: true }).exec();
  }

  /**
   * Get all patients with a specific status for a given date.
   * Optimized with compound index: { date, status }.
   */
  async findByStatus(date: string, status: PatientStatus): Promise<IPatient[]> {
    return Patient.find({ date, status }).sort({ token: 1 }).lean({ virtuals: true }).exec();
  }

  /**
   * Get the next patient to be called.
   * Priority patients (urgent) are served first, then by lowest token number.
   * Uses compound index: { date, status, priority DESC, token ASC }.
   */
  async findNextWaiting(date: string): Promise<IPatient | null> {
    return Patient.findOne({ date, status: 'waiting' })
      .sort({ priority: -1, token: 1 }) // urgent (-1 sorts 'urgent' before 'normal')
      .lean({ virtuals: true })
      .exec();
  }

  /**
   * Get the currently active patient (the one being served right now).
   * Returns the one called most recently.
   */
  async findActivePatient(date: string): Promise<IPatient | null> {
    return Patient.findOne({ date, status: 'active' })
      .sort({ calledAt: -1 })
      .lean({ virtuals: true })
      .exec();
  }

  /**
   * Update a patient's status (and optionally their assignedRoom).
   * Returns the updated document.
   */
  async updateStatus(id: string, input: UpdatePatientStatusInput): Promise<IPatient | null> {
    const updateFields: Partial<IPatient> = {
      status: input.status,
    };

    if (input.assignedRoom) {
      updateFields.assignedRoom = input.assignedRoom;
    }

    // Set calledAt and completedAt based on the status transition
    if (input.status === 'active') {
      updateFields.calledAt = new Date();
    } else if (input.status === 'completed' || input.status === 'no-show') {
      updateFields.completedAt = new Date();
    }

    return Patient.findByIdAndUpdate(
      new Types.ObjectId(id),
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .lean({ virtuals: true })
      .exec();
  }

  /**
   * Hard-delete a patient record by id.
   * Used by receptionist to remove a mistakenly added entry.
   */
  async deleteById(id: string): Promise<boolean> {
    const result = await Patient.deleteOne({ _id: new Types.ObjectId(id) });
    return result.deletedCount === 1;
  }

  /**
   * Count patients by status for a given date.
   * Used for queue status endpoint and statistics.
   */
  async countByStatus(date: string): Promise<Record<PatientStatus, number>> {
    const counts = await Patient.aggregate([
      { $match: { date } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const result: Record<PatientStatus, number> = {
      waiting: 0,
      active: 0,
      completed: 0,
      'no-show': 0,
    };

    counts.forEach(({ _id, count }) => {
      if (_id in result) result[_id as PatientStatus] = count;
    });

    return result;
  }

  /**
   * Get all completed patients for a date with calledAt and completedAt set.
   * Used to compute actual average consultation time.
   */
  async findCompletedWithTimings(date: string): Promise<IPatient[]> {
    return Patient.find({
      date,
      status: 'completed',
      calledAt: { $ne: null },
      completedAt: { $ne: null },
    })
      .lean({ virtuals: true })
      .exec();
  }

  /**
   * Atomically place all current 'waiting' patients into 'waiting' status on reset.
   * Called at the start of a new day to archive/clear stale records.
   */
  async cancelAllWaiting(date: string): Promise<number> {
    const result = await Patient.updateMany(
      { date, status: 'waiting' },
      { $set: { status: 'no-show', completedAt: new Date() } }
    );
    return result.modifiedCount;
  }
}

export const patientRepository = new PatientRepository();
