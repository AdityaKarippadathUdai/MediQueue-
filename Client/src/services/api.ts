import axios from 'axios';

// Get backend URL from environment variables
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';

// Create a reusable Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

api.interceptors.request.use((config) => {
  const pin = localStorage.getItem("reception_pin");

  if (pin) {
    config.headers["x-access-pin"] = pin;
  }

  return config;
});

// Interfaces representing the shapes returned from the backend
export interface ApiPatientResponse {
  _id: string;
  name: string;
  token: number | string;
  status: 'waiting' | 'active' | 'calling' | 'completed' | 'no-show';
  purpose?: string;
  priority?: 'normal' | 'urgent';
  joinedAt?: string;
  calledAt?: string;
  assignedRoom?: string;
}

export interface ApiQueueStatus {
  currentToken: number | string;
  waitingCount: number;
  completedCount: number;
  averageConsultationTime: number;
}

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data: T;
}

const unwrap = <T>(body: T | ApiEnvelope<T>): T => {
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as ApiEnvelope<T>).data;
  }

  return body as T;
};

/**
 * 1. addPatient - POST /api/patients
 */
export async function addPatient(patientData: {
  name: string;
  purpose?: string;
  priority?: 'normal' | 'urgent';
}): Promise<ApiPatientResponse> {
  const response = await api.post<ApiPatientResponse | ApiEnvelope<ApiPatientResponse>>('/api/patients', patientData);
  return unwrap(response.data);
}

/**
 * 2. getPatients - GET /api/patients
 */
export async function getPatients(): Promise<ApiPatientResponse[]> {
  const response = await api.get<ApiPatientResponse[] | ApiEnvelope<ApiPatientResponse[]>>('/api/patients');
  return unwrap(response.data);
}

/**
 * 2b. getPatient - GET /api/patients/:token
 */
export async function getPatient(tokenOrId: string): Promise<ApiPatientResponse> {
  const response = await api.get<ApiPatientResponse | ApiEnvelope<ApiPatientResponse>>(`/api/patients/${tokenOrId}`);
  return unwrap(response.data);
}

/**
 * 3. callNextPatient - POST /api/queue/next
 */
export async function callNextPatient(room?: string): Promise<ApiPatientResponse> {
  const response = await api.post<ApiPatientResponse | ApiEnvelope<ApiPatientResponse>>('/api/queue/next', { room });
  return unwrap(response.data);
}

/**
 * 4. updateAverageTime - PUT /api/queue/average-time
 */
export async function updateAverageTime(minutes: number): Promise<{ averageConsultationTime: number }> {
  const response = await api.put<{ averageConsultationTime: number } | ApiEnvelope<{ averageConsultationTime: number }>>('/api/queue/average-time', {
    averageConsultationTime: minutes,
  });
  return unwrap(response.data);
}

/**
 * 5. getQueueStatus - GET /api/queue/status
 */
export async function getQueueStatus(): Promise<ApiQueueStatus> {
  const response = await api.get<ApiQueueStatus | ApiEnvelope<ApiQueueStatus>>('/api/queue/status');
  return unwrap(response.data);
}

/**
 * Helper: updatePatientStatus - PUT /api/patients/:id
 */
export async function updatePatientStatus(
  id: string,
  payload: { status: string; assignedRoom?: string }
): Promise<ApiPatientResponse> {
  const response = await api.put<ApiPatientResponse | ApiEnvelope<ApiPatientResponse>>(`/api/patients/${id}`, payload);
  return unwrap(response.data);
}

/**
 * Helper: deletePatient - DELETE /api/patients/:id
 */
export async function deletePatient(id: string): Promise<void> {
  await api.delete(`/api/patients/${id}`);
}
