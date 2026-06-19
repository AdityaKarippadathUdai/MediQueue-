import { Schema, model, Document } from 'mongoose';

// ─────────────────────────────────────────────
// TypeScript Interface
// ─────────────────────────────────────────────

export interface IQueueSettings extends Document {
  // Singleton identifier — only one settings document exists per department
  departmentCode: string;

  // Live queue state
  currentToken: number;      // The token number currently being served (shown on displays)
  lastIssuedToken: number;   // The highest token number issued today

  // Configuration
  averageConsultationTime: number; // Minutes per patient, used for EWT calculations
  isQueueOpen: boolean;            // Receptionist can open/close the queue
  currentRoom: string;             // Default room the receptionist is operating from

  // Daily reset tracking
  lastResetDate: string; // Format: YYYY-MM-DD. When this changes, tokens reset to 0.

  // Derived: updated on every state change
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// Schema Definition
// ─────────────────────────────────────────────

const QueueSettingsSchema = new Schema<IQueueSettings>(
  {
    departmentCode: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      default: 'GEN',
    },
    currentToken: {
      type: Number,
      default: 0,
      min: [0, 'Current token cannot be negative'],
    },
    lastIssuedToken: {
      type: Number,
      default: 0,
      min: [0, 'Last issued token cannot be negative'],
    },
    averageConsultationTime: {
      type: Number,
      default: 15,
      min: [1, 'Average consultation time must be at least 1 minute'],
      max: [120, 'Average consultation time must not exceed 2 hours'],
    },
    isQueueOpen: {
      type: Boolean,
      default: true,
    },
    currentRoom: {
      type: String,
      trim: true,
      default: 'Examination Room 1',
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

// departmentCode is already unique from schema definition
QueueSettingsSchema.index({ departmentCode: 1 }, { unique: true });

// ─────────────────────────────────────────────
// Static Methods
// ─────────────────────────────────────────────

// Retrieve the settings document for a given department, creating it if absent.
// Also handles the daily auto-reset when the date has changed.
QueueSettingsSchema.statics.getOrInitialize = async function (
  departmentCode: string = 'GEN',
  today: string
): Promise<IQueueSettings> {
  let settings = await this.findOne({ departmentCode });

  if (!settings) {
    settings = await this.create({
      departmentCode,
      lastResetDate: today,
    });
    return settings;
  }

  // If the date has advanced, perform the daily reset
  if (settings.lastResetDate !== today) {
    settings.currentToken = 0;
    settings.lastIssuedToken = 0;
    settings.lastResetDate = today;
    await settings.save();
  }

  return settings;
};

// ─────────────────────────────────────────────
// Model Export
// ─────────────────────────────────────────────

export interface QueueSettingsModel extends ReturnType<typeof model<IQueueSettings>> {
  getOrInitialize(departmentCode?: string, today?: string): Promise<IQueueSettings>;
}

export const QueueSettings = model<IQueueSettings>(
  'QueueSettings',
  QueueSettingsSchema
) as QueueSettingsModel;
