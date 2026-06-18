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
  estimatedWaitMinutes: number;
  priority: PriorityLevel;
  assignedRoom?: string;
}

export interface QueueStats {
  waitingCount: number;
  averageWaitTime: number; // in minutes
  currentCallingTicket: string | null;
  completedTodayCount: number;
}

export interface ReceptionistUser {
  username: string;
  name: string;
  role: 'Receptionist';
  room: string;
}
