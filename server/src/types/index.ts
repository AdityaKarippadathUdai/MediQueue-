import { Request } from 'express';

// ─────────────────────────────────────────────
// Patient Domain Types
// ─────────────────────────────────────────────

export type PatientStatus = 'waiting' | 'active' | 'completed' | 'no-show';
export type PatientPriority = 'normal' | 'urgent';

/**
 * The shape returned by the API for any patient object.
 * Designed to match the existing frontend contract exactly.
 */
export interface PatientResponse {
  _id: string;
  id: string;      // alias of _id for legacy frontend compatibility
  name: string;
  token: number;
  status: PatientStatus;
  purpose: string;
  priority: PatientPriority;
  joinedAt: string;        // ISO 8601 string
  calledAt?: string;       // ISO 8601 string, set when status becomes 'active'
  completedAt?: string;    // ISO 8601 string, set when status becomes 'completed'
  estimatedWaitTime?: number; // minutes
  assignedRoom?: string;
}

// ─────────────────────────────────────────────
// Queue Status Response Types
// ─────────────────────────────────────────────

export interface QueueStatusResponse {
  currentToken: number | string;
  waitingCount: number;
  activeCount: number;
  completedCount: number;
  noShowCount: number;
  averageConsultationTime: number;
  isQueueOpen: boolean;
  date: string;
}

// ─────────────────────────────────────────────
// Statistics Response Types
// ─────────────────────────────────────────────

export interface StatisticsResponse {
  totalPatientsToday: number;
  completedPatientsToday: number;
  noShowPatientsToday: number;
  averageActualConsultationTime: number;
  peakQueueLength: number;
  date: string;
}

// ─────────────────────────────────────────────
// PIN Authentication
// ─────────────────────────────────────────────

export interface PinVerifyRequest {
  pin: string;
}

export interface PinVerifyResponse {
  success: boolean;
  message: string;
}

// ─────────────────────────────────────────────
// Request Payload Types
// ─────────────────────────────────────────────

export interface AddPatientPayload {
  name: string;
  purpose?: string;
  phone?: string;
  priority?: PatientPriority;
}

export interface UpdatePatientStatusPayload {
  status: PatientStatus;
  assignedRoom?: string;
}

export interface CallNextPatientPayload {
  room?: string;
}

export interface UpdateAverageTimePayload {
  averageConsultationTime: number;
}

// ─────────────────────────────────────────────
// Socket.IO Event Payloads
// ─────────────────────────────────────────────

export interface SocketQueueUpdatedPayload {
  patients: PatientResponse[];
}

export interface SocketTokenUpdatedPayload {
  token: number;
  displayToken: string; // e.g. "QC-42"
}

export interface SocketAverageTimeUpdatedPayload {
  averageConsultationTime: number;
}

export interface SocketPatientAddedPayload {
  patient: PatientResponse;
}

export interface SocketPatientCompletedPayload {
  patient: PatientResponse;
}

export type SocketEvent =
  | 'queueUpdated'
  | 'currentTokenUpdated'
  | 'averageTimeUpdated'
  | 'patientAdded'
  | 'patientCompleted'
  | 'queueStatusChanged'; // Emitted when isQueueOpen toggles
