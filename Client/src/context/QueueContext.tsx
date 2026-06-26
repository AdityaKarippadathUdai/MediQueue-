import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {Patient, PatientStatus, PriorityLevel, ReceptionistUser} from '../types';
import * as apiService from '../services/api';
import {QueueSocketRoom, SocketStatus, useSocket} from '../hooks/useSocket';

export interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface QueueContextType {
  socketStatus: SocketStatus;
  isConnected: boolean;
  joinSocketRoom: (room: QueueSocketRoom) => void;

  patients: Patient[];
  averageWaitTime: number | null;
  queue: Patient[];
  currentToken: string | null;
  waitingCount: number;
  completedCount: number;
  averageConsultationTime: number | null;
  loading: boolean;
  error: string | null;

  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'error') => void;
  removeToast: (id: string) => void;
  receptionist: ReceptionistUser | null;
  loginAsReceptionist: (username: string, name: string, room: string) => boolean;
  logoutReceptionist: () => void;

  fetchQueueStatus: () => Promise<void>;
  fetchPatients: () => Promise<void>;
  addPatient: (name: string, purpose: string, priority: PriorityLevel) => Promise<Patient>;
  callPatient: (id: string, room: string) => Promise<Patient>;
  callNextPatient: (room?: string) => Promise<Patient | null>;
  completePatient: (id: string) => Promise<void>;
  noShowPatient: (id: string) => Promise<void>;
  removePatient: (id: string) => Promise<void>;
  updateAverageConsultationTime: (minutes: number) => Promise<void>;
  updateAverageTime: (minutes: number) => Promise<void>;
  refreshData: () => Promise<void>;

  isOnline: boolean;
  setOnlineStatus: (status: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

type QueueStatusPayload = Partial<apiService.ApiQueueStatus> & {
  activeCount?: number;
  noShowCount?: number;
  isQueueOpen?: boolean;
};

const normalizeStatus = (status: string | undefined): PatientStatus => {
  if (status === 'active' || status === 'calling') return 'calling';
  if (status === 'completed') return 'completed';
  if (status === 'no-show') return 'no-show';
  return 'waiting';
};

const normalizeToken = (token: unknown): string | null => {
  if (token === undefined || token === null || token === '') return null;
  const tokenText = String(token);
  return tokenText.startsWith('QC-') ? tokenText : `QC-${tokenText}`;
};

const extractPatients = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.patients)) return obj.patients;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.results)) return obj.results;
  }
  return [];
};

const extractPatient = (payload: unknown): unknown | null => {
  if (!payload || typeof payload !== 'object') return payload ?? null;
  const obj = payload as Record<string, unknown>;
  if (obj.patient) return obj.patient;
  if (obj.data && !Array.isArray(obj.data)) return obj.data;
  return payload;
};

export const transformToPatient = (apiPt: unknown): Patient => {
  let pt = apiPt as any;
  if (pt && typeof pt === 'object') {
    if (pt.patient && typeof pt.patient === 'object') {
      pt = pt.patient;
    } else if (pt.data && typeof pt.data === 'object' && !Array.isArray(pt.data)) {
      pt = pt.data;
    }
  }

  const idVal = pt?._id || pt?.id || Math.random().toString(36).substring(2, 9);
  const tokenVal = pt?.token !== undefined ? pt.token : 100;
  const ticketNumber = typeof tokenVal === 'number' ? `QC-${tokenVal}` : String(tokenVal);

  return {
    id: idVal,
    ticketNumber: ticketNumber.startsWith('QC-') ? ticketNumber : `QC-${ticketNumber}`,
    name: pt?.name || 'Unknown Patient',
    purpose: pt?.purpose || 'General Consultation',
    status: normalizeStatus(pt?.status),
    joinedAt: pt?.joinedAt || new Date().toISOString(),
    calledAt: pt?.calledAt,
    estimatedWaitMinutes: pt?.estimatedWaitTime ?? pt?.estimatedWaitMinutes ?? (pt?.priority === 'urgent' ? 8 : 16),
    priority: pt?.priority || 'normal',
    assignedRoom: pt?.assignedRoom,
  };
};

export const QueueProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {socket, status: socketStatus, isConnected, joinRoom} = useSocket();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [averageWaitTime, setAverageWaitTime] = useState<number | null>(null);
  const [waitingCount, setWaitingCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const initialFetchStarted = useRef(false);

  const queue = patients;
  const averageConsultationTime = averageWaitTime;

  const [receptionist, setReceptionist] = useState<ReceptionistUser | null>(() => {
    const saved = localStorage.getItem('qc_receptionist');
    return saved ? JSON.parse(saved) : null;
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('qc_dark_mode');
    return saved === 'true';
  });

  const deriveQueueStats = useCallback((nextPatients: Patient[]) => {
    setWaitingCount(nextPatients.filter((patient) => patient.status === 'waiting').length);
    setCompletedCount(nextPatients.filter((patient) => patient.status === 'completed').length);
  }, []);

  const applyPatients = useCallback((payload: unknown) => {
    const mappedPatients = extractPatients(payload).map(transformToPatient);
    setPatients(mappedPatients);
    deriveQueueStats(mappedPatients);

    setCurrentToken((existingToken) => {
      if (existingToken) return existingToken;
      const activePatient = mappedPatients.find((patient) => patient.status === 'calling');
      return activePatient?.ticketNumber ?? null;
    });
  }, [deriveQueueStats]);

  const mergePatient = useCallback((payload: unknown) => {
    const rawPatient = extractPatient(payload);
    if (!rawPatient) return null;

    const nextPatient = transformToPatient(rawPatient);
    setPatients((previousPatients) => {
      const exists = previousPatients.some((patient) => patient.id === nextPatient.id);
      const nextPatients = exists
        ? previousPatients.map((patient) => patient.id === nextPatient.id ? nextPatient : patient)
        : [...previousPatients, nextPatient].sort((a, b) => Number(a.ticketNumber.replace('QC-', '')) - Number(b.ticketNumber.replace('QC-', '')));
      deriveQueueStats(nextPatients);
      return nextPatients;
    });

    if (nextPatient.status === 'calling') {
      setCurrentToken(nextPatient.ticketNumber);
    }

    return nextPatient;
  }, [deriveQueueStats]);

  const applyQueueStatus = useCallback((status: QueueStatusPayload | null | undefined) => {
    if (!status) return;

    if (typeof status.averageConsultationTime === 'number') {
      setAverageWaitTime(status.averageConsultationTime);
    }
    if (typeof status.waitingCount === 'number') {
      setWaitingCount(status.waitingCount);
    }
    if (typeof status.completedCount === 'number') {
      setCompletedCount(status.completedCount);
    }
    if ('currentToken' in status) {
      setCurrentToken(normalizeToken(status.currentToken));
    }
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, {id, message, type}]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const loginAsReceptionist = (username: string, name: string, room: string): boolean => {
    const user: ReceptionistUser = {
      username,
      name,
      role: 'Receptionist',
      room,
    };
    setReceptionist(user);
    localStorage.setItem('qc_receptionist', JSON.stringify(user));
    showToast(`Welcome back to Reception Desk, ${name}!`, 'success');
    return true;
  };

  const logoutReceptionist = () => {
    setReceptionist(null);
    localStorage.removeItem('qc_receptionist');
    showToast('Logged out of staff receptionist dashboard.', 'success');
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('qc_dark_mode', String(darkMode));
  }, [darkMode]);

  const fetchPatients = useCallback(async () => {
    const apiPatients = await apiService.getPatients();
    applyPatients(apiPatients);
    setIsOnline(true);
  }, [applyPatients]);

  const fetchQueueStatus = useCallback(async () => {
    const status = await apiService.getQueueStatus();
    applyQueueStatus(status);
    setIsOnline(true);
  }, [applyQueueStatus]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [apiPatients, status] = await Promise.all([
        apiService.getPatients(),
        apiService.getQueueStatus(),
      ]);
      applyPatients(apiPatients);
      applyQueueStatus(status);
      setIsOnline(true);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Unable to load queue data.';
      setError(message);
      setIsOnline(false);
      console.error('Initial queue synchronization failed:', message);
    } finally {
      setLoading(false);
    }
  }, [applyPatients, applyQueueStatus]);

  useEffect(() => {
    if (initialFetchStarted.current) return;
    initialFetchStarted.current = true;
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!socket) return;

    const handleQueueUpdated = (payload: unknown) => {
      applyPatients(payload);
      setIsOnline(true);
    };

    const handlePatientAdded = (payload: unknown) => {
      mergePatient(payload);
      setIsOnline(true);
    };

    const handlePatientCompleted = (payload: unknown) => {
      mergePatient(payload);
      setIsOnline(true);
    };

    const handleCurrentTokenUpdated = (payload: any) => {
      const token = payload && typeof payload === 'object'
        ? payload.displayToken ?? payload.currentToken ?? payload.token
        : payload;
      const normalizedToken = normalizeToken(token);
      setCurrentToken(normalizedToken);

      if (normalizedToken) {
        setPatients((previousPatients) => previousPatients.map((patient) => (
          patient.ticketNumber === normalizedToken
            ? {...patient, status: 'calling'}
            : patient
        )));
      }
      setIsOnline(true);
    };

    const handleAverageTimeUpdated = (payload: any) => {
      if (typeof payload === 'number') {
        setAverageWaitTime(payload);
      } else if (payload && typeof payload.averageConsultationTime === 'number') {
        setAverageWaitTime(payload.averageConsultationTime);
      }
      setIsOnline(true);
    };

    socket.on('queueUpdated', handleQueueUpdated);
    socket.on('patientAdded', handlePatientAdded);
    socket.on('patientCompleted', handlePatientCompleted);
    socket.on('currentTokenUpdated', handleCurrentTokenUpdated);
    socket.on('averageTimeUpdated', handleAverageTimeUpdated);

    return () => {
      socket.off('queueUpdated', handleQueueUpdated);
      socket.off('patientAdded', handlePatientAdded);
      socket.off('patientCompleted', handlePatientCompleted);
      socket.off('currentTokenUpdated', handleCurrentTokenUpdated);
      socket.off('averageTimeUpdated', handleAverageTimeUpdated);
    };
  }, [applyPatients, mergePatient, socket]);

  const addPatient = async (name: string, purpose: string, priority: PriorityLevel): Promise<Patient> => {
    setLoading(true);
    try {
      const apiPt = await apiService.addPatient({name, purpose, priority});
      const converted = mergePatient(apiPt) ?? transformToPatient(apiPt);
      showToast(`Patient "${name}" checked in successfully!`, 'success');
      return converted;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error checking in patient.';
      showToast(msg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const callPatient = async (id: string, room: string): Promise<Patient> => {
    setLoading(true);
    try {
      const apiPt = await apiService.updatePatientStatus(id, {status: 'active', assignedRoom: room});
      const converted = mergePatient(apiPt) ?? transformToPatient(apiPt);
      setCurrentToken(converted.ticketNumber);
      showToast(`Announcing Ticket ${converted.ticketNumber} to ${room}`, 'success');
      return converted;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error calling patient.';
      showToast(msg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const callNextPatient = async (room?: string): Promise<Patient | null> => {
    setLoading(true);
    setError(null);
    try {
      const activeRoom = room || receptionist?.room || 'Examination Room 1';
      const apiPt = await apiService.callNextPatient(activeRoom);
      if (!apiPt) {
        showToast('Standby queue is currently empty.', 'error');
        return null;
      }
      const converted = mergePatient(apiPt) ?? transformToPatient(apiPt);
      setCurrentToken(converted.ticketNumber);
      showToast(`Announced Next Ticket: ${converted.ticketNumber}`, 'success');
      return converted;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'No next patient waiting.';
      setError(msg);
      showToast(msg, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const completePatient = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      if (!socket) {
        throw new Error('Socket.IO connection not established');
      }
      
      return new Promise((resolve, reject) => {
        socket.emit('completePatient', { patientId: id }, (response: any) => {
          if (response?.success) {
            mergePatient(response.patient);
            showToast('Patient session completed successfully.', 'success');
            setLoading(false);
            resolve();
          } else {
            const msg = response?.message || 'Error marking patient session complete.';
            setError(msg);
            showToast(msg, 'error');
            setLoading(false);
            reject(new Error(msg));
          }
        });
      });
    } catch (err: any) {
      const msg = err.message || 'Error marking patient session complete.';
      setError(msg);
      showToast(msg, 'error');
      setLoading(false);
      throw err;
    }
  };

  const noShowPatient = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      if (!socket) {
        throw new Error('Socket.IO connection not established');
      }
      
      return new Promise((resolve, reject) => {
        socket.emit('noShowPatient', { patientId: id }, (response: any) => {
          if (response?.success) {
            mergePatient(response.patient);
            showToast('Patient marked as absent/no-show.', 'success');
            setLoading(false);
            resolve();
          } else {
            const msg = response?.message || 'Error marking no-show status.';
            setError(msg);
            showToast(msg, 'error');
            setLoading(false);
            reject(new Error(msg));
          }
        });
      });
    } catch (err: any) {
      const msg = err.message || 'Error marking no-show status.';
      setError(msg);
      showToast(msg, 'error');
      setLoading(false);
      throw err;
    }
  };

  const removePatient = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      if (!socket) {
        throw new Error('Socket.IO connection not established');
      }
      
      return new Promise((resolve, reject) => {
        socket.emit('removePatient', { patientId: id }, (response: any) => {
          if (response?.success) {
            setPatients((previousPatients) => {
              const nextPatients = previousPatients.filter((patient) => patient.id !== id);
              deriveQueueStats(nextPatients);
              return nextPatients;
            });
            showToast('Patient registration cancelled successfully.', 'success');
            setLoading(false);
            resolve();
          } else {
            const msg = response?.message || 'Error removing patient from list.';
            setError(msg);
            showToast(msg, 'error');
            setLoading(false);
            reject(new Error(msg));
          }
        });
      });
    } catch (err: any) {
      const msg = err.message || 'Error removing patient from list.';
      setError(msg);
      showToast(msg, 'error');
      setLoading(false);
      throw err;
    }
  };

  const updateAverageTime = async (minutes: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.updateAverageTime(minutes);
      setAverageWaitTime(result.averageConsultationTime);
      showToast(`Target average consultation set to ${minutes}m.`, 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error updating average time.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateAverageConsultationTime = updateAverageTime;

  return (
    <QueueContext.Provider
      value={{
        socketStatus,
        isConnected,
        joinSocketRoom: joinRoom,
        patients,
        averageWaitTime,
        queue,
        currentToken,
        waitingCount,
        completedCount,
        averageConsultationTime,
        loading,
        error,
        toasts,
        showToast,
        removeToast,
        receptionist,
        loginAsReceptionist,
        logoutReceptionist,
        fetchQueueStatus,
        fetchPatients,
        addPatient,
        callPatient,
        callNextPatient,
        completePatient,
        noShowPatient,
        removePatient,
        updateAverageConsultationTime,
        updateAverageTime,
        refreshData,
        isOnline,
        setOnlineStatus: setIsOnline,
        darkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (context === undefined) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
