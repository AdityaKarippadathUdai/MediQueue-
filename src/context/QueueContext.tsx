import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Patient, PatientStatus, PriorityLevel, ReceptionistUser } from '../types';
import * as apiService from '../services/api';

export interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface QueueContextType {
  patients: Patient[];
  currentToken: string;
  averageWaitTime: number;
  waitingCount: number;
  completedCount: number;
  loading: boolean;
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'error') => void;
  removeToast: (id: string) => void;
  receptionist: ReceptionistUser | null;
  loginAsReceptionist: (username: string, name: string, room: string) => boolean;
  logoutReceptionist: () => void;
  addPatient: (name: string, purpose: string, priority: PriorityLevel) => Promise<Patient>;
  callPatient: (id: string, room: string) => Promise<Patient>;
  callNextPatient: (room: string) => Promise<Patient | null>;
  completePatient: (id: string) => Promise<void>;
  noShowPatient: (id: string) => Promise<void>;
  removePatient: (id: string) => Promise<void>;
  updateAverageConsultationTime: (minutes: number) => Promise<void>;
  refreshData: () => Promise<void>;
  isOnline: boolean;
  setOnlineStatus: (status: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

// Helper to convert api patient representation to app Patient representation
export const transformToPatient = (apiPt: apiService.ApiPatientResponse): Patient => {
  const tokenVal = apiPt.token || 100;
  // Format token like QC-105
  const ticketNumber = typeof tokenVal === 'number' ? `QC-${tokenVal}` : String(tokenVal);
  return {
    id: apiPt._id,
    ticketNumber: ticketNumber.startsWith('QC-') ? ticketNumber : `QC-${ticketNumber}`,
    name: apiPt.name,
    purpose: apiPt.purpose || 'General Consultation',
    status: apiPt.status || 'waiting',
    joinedAt: apiPt.joinedAt || new Date().toISOString(),
    calledAt: apiPt.calledAt,
    estimatedWaitMinutes: apiPt.priority === 'urgent' ? 8 : 16,
    priority: apiPt.priority || 'normal',
    assignedRoom: apiPt.assignedRoom,
  };
};

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State variables
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentToken, setCurrentToken] = useState<string>('QC-100');
  const [averageWaitTime, setAverageWaitTime] = useState<number>(8);
  const [waitingCount, setWaitingCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const [receptionist, setReceptionist] = useState<ReceptionistUser | null>(() => {
    const saved = localStorage.getItem('qc_receptionist');
    return saved ? JSON.parse(saved) : null;
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('qc_dark_mode');
    return saved === 'true';
  });

  // Action: Toast Alert trigger
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Action: Synchronous Local Auth triggers
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

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Sync dark mode class on HTML node safely
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('qc_dark_mode', String(darkMode));
  }, [darkMode]);

  // Synchronizers of API data
  const refreshData = useCallback(async () => {
    try {
      // 1. Fetch Patients
      const apiPatients = await apiService.getPatients();
      const mappedPatients = apiPatients.map(transformToPatient);
      setPatients(mappedPatients);

      // 2. Fetch Queue Status
      try {
        const status = await apiService.getQueueStatus();
        setAverageWaitTime(status.averageConsultationTime || 8);
        setWaitingCount(status.waitingCount || Math.max(0, mappedPatients.filter(p => p.status === 'waiting').length));
        setCompletedCount(status.completedCount || Math.max(0, mappedPatients.filter(p => p.status === 'completed').length));
        
        const rawToken = status.currentToken;
        if (rawToken) {
          const tStr = String(rawToken);
          setCurrentToken(tStr.startsWith('QC-') ? tStr : `QC-${tStr}`);
        } else {
          // fallback if empty
          const callingPtList = mappedPatients.filter(p => p.status === 'calling');
          if (callingPtList.length > 0) {
            setCurrentToken(callingPtList[callingPtList.length - 1].ticketNumber);
          } else {
            setCurrentToken('QC-100');
          }
        }
      } catch (statusErr) {
        // Fallback calculations if status endpoint is offline but patients endpoint is working
        const activeCalling = mappedPatients.filter(p => p.status === 'calling');
        setCurrentToken(activeCalling.length > 0 ? activeCalling[activeCalling.length - 1].ticketNumber : 'QC-100');
        setWaitingCount(mappedPatients.filter(p => p.status === 'waiting').length);
        setCompletedCount(mappedPatients.filter(p => p.status === 'completed').length);
      }

      setIsOnline(true);
    } catch (err: any) {
      setIsOnline(false);
      console.error('Queue API Synchronization Error: ', err.message);
    }
  }, [showToast]);

  // Auto polling updates every 5.5 seconds to sync Live displays seamlessly
  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      refreshData();
    }, 5500);
    return () => clearInterval(interval);
  }, [refreshData]);

  // POST /api/patients
  const addPatient = async (name: string, purpose: string, priority: PriorityLevel): Promise<Patient> => {
    setLoading(true);
    try {
      const apiPt = await apiService.addPatient({ name, purpose, priority });
      const converted = transformToPatient(apiPt);
      await refreshData();
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

  // PUT /api/patients/:id - mark specific patient as calling
  const callPatient = async (id: string, room: string): Promise<Patient> => {
    setLoading(true);
    try {
      const apiPt = await apiService.updatePatientStatus(id, { status: 'calling', assignedRoom: room });
      const converted = transformToPatient(apiPt);
      await refreshData();
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

  // POST /api/queue/next
  const callNextPatient = async (room: string): Promise<Patient | null> => {
    setLoading(true);
    try {
      const apiPt = await apiService.callNextPatient(room);
      if (!apiPt) {
        showToast('Standby queue is currently empty.', 'error');
        return null;
      }
      const converted = transformToPatient(apiPt);
      await refreshData();
      showToast(`Announced Next Ticket: ${converted.ticketNumber}`, 'success');
      return converted;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'No next patient waiting.';
      showToast(msg, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // PUT /api/patients/:id - mark as completed
  const completePatient = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await apiService.updatePatientStatus(id, { status: 'completed' });
      await refreshData();
      showToast('Patient session completed successfully.', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error marking patient session complete.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // PUT /api/patients/:id - mark as no-show
  const noShowPatient = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await apiService.updatePatientStatus(id, { status: 'no-show' });
      await refreshData();
      showToast('Patient marked as absent/no-show.', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error marking no-show status.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // DELETE /api/patients/:id
  const removePatient = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await apiService.deletePatient(id);
      await refreshData();
      showToast('Patient registration cancelled successfully.', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error removing patient from list.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // PUT /api/queue/average-time
  const updateAverageConsultationTime = async (minutes: number): Promise<void> => {
    setLoading(true);
    try {
      await apiService.updateAverageTime(minutes);
      await refreshData();
      showToast(`Target average consultation set to ${minutes}m.`, 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error updating average time.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <QueueContext.Provider
      value={{
        patients,
        currentToken,
        averageWaitTime,
        waitingCount,
        completedCount,
        loading,
        toasts,
        showToast,
        removeToast,
        receptionist,
        loginAsReceptionist,
        logoutReceptionist,
        addPatient,
        callPatient,
        callNextPatient,
        completePatient,
        noShowPatient,
        removePatient,
        updateAverageConsultationTime,
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
