import { Schema, model, Document, Model } from 'mongoose';

// ─────────────────────────────────────────────
// TypeScript Interface
// ─────────────────────────────────────────────

export interface IClinicStatistics extends Document {
  // Singleton key — one stats document per department per day
  departmentCode: string;
  date: string; // Format: YYYY-MM-DD

  // Daily running totals
  totalPatientsToday: number;
  completedPatientsToday: number;
  noShowPatientsToday: number;
  cancelledPatientsToday: number;

  // Wait time analytics
  averageActualConsultationTime: number; // Rolling average in minutes, derived from completions
  totalConsultationMinutes: number;       // Sum of all consultation times (for rolling avg calc)
  peakQueueLength: number;               // Highest observed waiting count during the day

  // Reset boundary
  lastResetDate: string; // Format: YYYY-MM-DD
}

// ─────────────────────────────────────────────
// Schema Definition
// ─────────────────────────────────────────────

const ClinicStatisticsSchema = new Schema<IClinicStatistics>(
  {
    departmentCode: {
      type: String,
      required: [true, 'Department code is required'],
      uppercase: true,
      trim: true,
      default: 'GEN',
    },
    date: {
      type: String,
      required: [true, 'Statistics date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    totalPatientsToday: {
      type: Number,
      default: 0,
      min: [0, 'Total patients cannot be negative'],
    },
    completedPatientsToday: {
      type: Number,
      default: 0,
      min: [0, 'Completed patients cannot be negative'],
    },
    noShowPatientsToday: {
      type: Number,
      default: 0,
      min: [0, 'No-show count cannot be negative'],
    },
    cancelledPatientsToday: {
      type: Number,
      default: 0,
      min: [0, 'Cancelled count cannot be negative'],
    },
    averageActualConsultationTime: {
      type: Number,
      default: 0,
      min: [0, 'Average consultation time cannot be negative'],
    },
    totalConsultationMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Total consultation minutes cannot be negative'],
    },
    peakQueueLength: {
      type: Number,
      default: 0,
      min: [0, 'Peak queue length cannot be negative'],
    },
    lastResetDate: {
      type: String,
      required: [true, 'Last reset date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
  },
  {
    timestamps: true, // createdAt, updatedAt managed automatically
    versionKey: false,
  }
);

// ─────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────

// Primary lookup: today's stats for a department
ClinicStatisticsSchema.index({ date: 1, departmentCode: 1 }, { unique: true });

// Historical stats queries (e.g., last 30 days)
ClinicStatisticsSchema.index({ departmentCode: 1, date: -1 });

// ─────────────────────────────────────────────
// Static Methods
// ─────────────────────────────────────────────

ClinicStatisticsSchema.statics.getOrInitializeForToday = async function (
  departmentCode: string = 'GEN',
  today: string
): Promise<IClinicStatistics> {
  const stats = await this.findOneAndUpdate(
    { date: today, departmentCode },
    { $setOnInsert: { date: today, departmentCode, lastResetDate: today } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return stats;
};

// Recalculate rolling average consultation time after a new completion
ClinicStatisticsSchema.statics.recordCompletion = async function (
  departmentCode: string,
  today: string,
  consultationMinutes: number
): Promise<IClinicStatistics> {
  const stats = await this.findOneAndUpdate(
    { date: today, departmentCode },
    {
      $inc: {
        completedPatientsToday: 1,
        totalConsultationMinutes: consultationMinutes,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // Update the rolling average in a second atomic step
  stats.averageActualConsultationTime =
    stats.completedPatientsToday > 0
      ? Math.round(stats.totalConsultationMinutes / stats.completedPatientsToday)
      : 0;

  return stats.save();
};

// ─────────────────────────────────────────────
// Model Export
// ─────────────────────────────────────────────

export interface ClinicStatisticsModel extends Model<IClinicStatistics> {
  getOrInitializeForToday(departmentCode?: string, today?: string): Promise<IClinicStatistics>;
  recordCompletion(
    departmentCode: string,
    today: string,
    consultationMinutes: number
  ): Promise<IClinicStatistics>;
}

export const ClinicStatistics = model<IClinicStatistics>(
  'ClinicStatistics',
  ClinicStatisticsSchema
) as ClinicStatisticsModel;
