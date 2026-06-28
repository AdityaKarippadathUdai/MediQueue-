import { Schema, model, Types, HydratedDocument } from 'mongoose';

// ─────────────────────────────────────────────
// TypeScript Interfaces
// ─────────────────────────────────────────────

export type PatientStatus = 'waiting' | 'active' | 'completed' | 'no-show';
export type PatientPriority = 'normal' | 'urgent';

export type PatientDocument = HydratedDocument<IPatient>;

export interface IPatient {
  _id: Types.ObjectId;

  // Core identity
  name: string;
  phone: string;
  purpose: string;

  // Queue positioning
  token: number;
  priority: PatientPriority;

  // Lifecycle timestamps
  status: PatientStatus;
  joinedAt: Date;
  calledAt?: Date;
  completedAt?: Date;

  // Computed/derived
  estimatedWaitTime?: number; // minutes, set at registration
  assignedRoom?: string;

  // Daily partitioning key — enables fast "today's queue" queries
  date: string; // Format: YYYY-MM-DD

  // Virtuals
  waitDurationMinutes?: number;
  consultationDurationMinutes?: number;
}

// ─────────────────────────────────────────────
// Schema Definition
// ─────────────────────────────────────────────

const PatientSchema = new Schema<IPatient>(
  {
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters'],
    },
    phone: {
      type: String,
      trim: true,
      default: '000-000-0000',
      validate: {
        validator: (v: string) => /^[\d\s\-\+\(\)]{7,15}$/.test(v) || v === '000-000-0000',
        message: 'Invalid phone number format',
      },
    },
    purpose: {
      type: String,
      trim: true,
      default: 'General Consultation',
      maxlength: [200, 'Purpose must not exceed 200 characters'],
    },
    token: {
      type: Number,
      required: [true, 'Token number is required'],
      min: [1, 'Token must be a positive integer'],
    },
    priority: {
      type: String,
      enum: {
        values: ['normal', 'urgent'],
        message: 'Priority must be either normal or urgent',
      },
      default: 'normal',
    },
    status: {
      type: String,
      enum: {
        values: ['waiting', 'active', 'completed', 'no-show'],
        message: 'Status must be one of: waiting, active, completed, no-show',
      },
      default: 'waiting',
    },
    joinedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    calledAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    estimatedWaitTime: {
      type: Number,
      default: null,
      min: [0, 'Estimated wait time cannot be negative'],
    },
    assignedRoom: {
      type: String,
      trim: true,
      default: null,
    },
    date: {
      type: String,
      required: [true, 'Date partition key is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
      index: true,
    },
  },
  {
    timestamps: false, // We manage our own lifecycle timestamps explicitly
    versionKey: false,
  }
);

// ─────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────

// Fast active-patient lookup (called by "Now Serving" display)
PatientSchema.index({ date: 1, status: 1 });

// Fast "next waiting" lookup (called by callNextPatient)
PatientSchema.index({ date: 1, status: 1, priority: -1, token: 1 });

// Unique token per day (prevents duplicate tokens from race conditions)
PatientSchema.index({ date: 1, token: 1 }, { unique: true });

// ─────────────────────────────────────────────
// Virtuals
// ─────────────────────────────────────────────

// How long the patient has been waiting (or waited before being called)
PatientSchema.virtual('waitDurationMinutes').get(function (this: IPatient) {
  const end = this.calledAt || new Date();
  return Math.round((end.getTime() - this.joinedAt.getTime()) / 60000);
});

// How long the consultation took (only valid when completed)
PatientSchema.virtual('consultationDurationMinutes').get(function (this: IPatient) {
  if (!this.calledAt || !this.completedAt) return null;
  return Math.round((this.completedAt.getTime() - this.calledAt.getTime()) / 60000);
});

// Note: calledAt and completedAt timestamps are set explicitly in the
// PatientRepository.updateStatus() method via $set to ensure atomicity.
// A pre-save hook is intentionally omitted to avoid double-assignment.

// ─────────────────────────────────────────────
// Model Export
// ─────────────────────────────────────────────

export const Patient = model<IPatient>('Patient', PatientSchema);
export { PatientSchema };
