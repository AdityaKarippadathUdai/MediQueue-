import { Request } from 'express';

export interface UserPayload {
  userId: string;
  username: string;
  role: string;
  room: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export interface PatientResponse {
  _id: string;
  id: string;
  name: string;
  token: number;
  status: 'waiting' | 'calling' | 'completed' | 'no-show';
  purpose: string;
  priority: 'normal' | 'urgent';
  joinedAt: string;
  calledAt?: string;
  assignedRoom?: string;
}
