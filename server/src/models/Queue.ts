import { Schema, model, Document, Types } from 'mongoose';

export interface IPatient {
  _id?: Types.ObjectId;
  name: string;
  tokenNumber: number;
  status: 'waiting' | 'calling' | 'completed' | 'no-show';
  phone: string;
  priority: 'normal' | 'urgent';
  joinedAt: Date;
  calledAt?: Date;
  assignedRoom?: string;
}

export const PatientSchema = new Schema<IPatient>({
  name: { type: String, required: true, trim: true },
  tokenNumber: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['waiting', 'calling', 'completed', 'no-show'], 
    default: 'waiting' 
  },
  phone: { type: String, default: '000-000-0000' },
  priority: { 
    type: String, 
    enum: ['normal', 'urgent'], 
    default: 'normal' 
  },
  joinedAt: { type: Date, default: Date.now },
  calledAt: { type: Date },
  assignedRoom: { type: String }
});

export interface IQueue extends Document {
  departmentCode: string;
  departmentName: string;
  date: string; // Format: YYYY-MM-DD
  currentToken: number;
  lastIssuedToken: number;
  averageConsultationTime: number;
  patients: Types.DocumentArray<IPatient & Document>;
}

const QueueSchema = new Schema<IQueue>({
  departmentCode: { type: String, required: true, default: 'GEN', index: true },
  departmentName: { type: String, required: true, default: 'General Medicine' },
  date: { type: String, required: true, index: true },
  currentToken: { type: Number, default: 0 },
  lastIssuedToken: { type: Number, default: 0 },
  averageConsultationTime: { type: Number, default: 15 },
  patients: [PatientSchema]
}, { 
  timestamps: true 
});

// Ensure a single queue document per day for a specific department
QueueSchema.index({ date: 1, departmentCode: 1 }, { unique: true });

export const Queue = model<IQueue>('Queue', QueueSchema);
