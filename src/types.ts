/**
 * Queue Care '26 - Type Definitions
 */

export type PatientStatus = 'waiting' | 'calling' | 'completed' | 'no-show';

export type PriorityLevel = 'normal' | 'urgent';

export interface Patient {
  id: string;
  ticketNumber: string;
  name: string;
  purpose: string;
  status: PatientStatus;
  joinedAt: string;
  calledAt?: string;
  estimatedWaitMinutes: number | null;
  priority: PriorityLevel;
  assignedRoom?: string;
}

export interface QueueStats {
  waitingCount: number;
  averageWaitTime: number | null; // in minutes
  currentCallingTicket: string | null;
  completedTodayCount: number;
}

export interface ReceptionistUser {
  username: string;
  name: string;
  role: 'Receptionist';
  room: string;
}

// ==========================================
// INTEGRATION INTERFACES
// ==========================================

export interface PatientData {
  _id: string;
  name: string;
  token: number;
  status: string;
  joinedAt: string;
  completedAt: string | null;
}

export interface QueueData {
  patients: Patient[];
  currentToken: string | null;
  waitingCount: number;
  completedCount: number;
  averageConsultationTime: number | null;
}

export interface QueueSettings {
  averageConsultationTime: number | null;
}

export interface ConnectionStatus {
  isConnected: boolean;
  status: 'connected' | 'connecting' | 'disconnected';
}

