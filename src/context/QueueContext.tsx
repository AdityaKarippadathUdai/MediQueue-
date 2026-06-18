import React, { createContext, useContext, useState, useEffect } from 'react';
import { Patient, PatientStatus, PriorityLevel, ReceptionistUser } from '../types';

interface QueueContextType {
  patients: Patient[];
  receptionist: ReceptionistUser | null;
  loginAsReceptionist: (username: string, name: string, room: string) => boolean;
  logoutReceptionist: () => void;
  addPatient: (name: string, purpose: string, priority: PriorityLevel) => Patient;
  callPatient: (id: string, room: string) => void;
  completePatient: (id: string) => void;
  noShowPatient: (id: string) => void;
  removePatient: (id: string) => void;
  resetQueue: () => void;
  isOnline: boolean;
  setOnlineStatus: (status: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  averageWaitTime: number;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

// Initial Mock Seed for realistic experience
const INITIAL_PATIENTS: Patient[] = [
  {
    id: '1',
    ticketNumber: 'QC-101',
    name: 'Robert Chen',
    purpose: 'Acute Chest Congestion',
    status: 'calling',
    joinedAt: new Date(Date.now() - 35 * 60000).toISOString(), // 35m ago
    calledAt: new Date(Date.now() - 2 * 60000).toISOString(),   // 2m ago
    estimatedWaitMinutes: 0,
    priority: 'urgent',
    assignedRoom: 'Exam Room 3'
  },
  {
    id: '2',
    ticketNumber: 'QC-102',
    name: 'Jane Doe',
    purpose: 'Wellness Checkup',
    status: 'waiting',
    joinedAt: new Date(Date.now() - 25 * 60000).toISOString(), // 25m ago
    estimatedWaitMinutes: 10,
    priority: 'normal'
  },
  {
    id: '3',
    ticketNumber: 'QC-103',
    name: 'Sarah Jenkins',
    purpose: 'Flu Vaccine Intake',
    status: 'waiting',
    joinedAt: new Date(Date.now() - 15 * 60000).toISOString(), // 15m ago
    estimatedWaitMinutes: 20,
    priority: 'normal'
  },
  {
    id: '4',
    ticketNumber: 'QC-104',
    name: 'Eleanor Vance',
    purpose: 'Migraine Injection',
    status: 'waiting',
    joinedAt: new Date(Date.now() - 8 * 60000).toISOString(),  // 8m ago
    estimatedWaitMinutes: 30,
    priority: 'normal'
  },
  {
    id: '5',
    ticketNumber: 'QC-105',
    name: 'Marcus Aurelius',
    purpose: 'Chronic Knee Review',
    status: 'completed',
    joinedAt: new Date(Date.now() - 80 * 60000).toISOString(),
    calledAt: new Date(Date.now() - 40 * 60000).toISOString(),
    estimatedWaitMinutes: 0,
    priority: 'normal',
    assignedRoom: 'Physio Room A'
  }
];

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('qc_patients');
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  const [receptionist, setReceptionist] = useState<ReceptionistUser | null>(() => {
    const saved = localStorage.getItem('qc_receptionist');
    return saved ? JSON.parse(saved) : null;
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('qc_dark_mode');
    return saved === 'true';
  });

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [averageWaitTime, setAverageWaitTime] = useState<number>(18);

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

  // Sync patients to localStorage
  useEffect(() => {
    localStorage.setItem('qc_patients', JSON.stringify(patients));
  }, [patients]);

  // Recalculate average waiting time and waiting lists dynamically
  useEffect(() => {
    const waitingPatients = patients.filter(p => p.status === 'waiting');
    const computedWait = waitingPatients.reduce((acc, _, idx) => acc + (idx + 1) * 10, 15);
    setAverageWaitTime(Math.min(90, Math.max(10, Math.round(computedWait / (waitingPatients.length || 1)))));
  }, [patients]);

  // Simulate network jitter to make connection "live indicator" feel organic
  useEffect(() => {
    const interval = setInterval(() => {
      // Small 2% chance of a temporary connection micro-drop to showcase the state UI beautifully
      if (Math.random() < 0.05) {
        setIsOnline(false);
        setTimeout(() => setIsOnline(true), 2500);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const loginAsReceptionist = (username: string, name: string, room: string): boolean => {
    const user: ReceptionistUser = {
      username,
      name,
      role: 'Receptionist',
      room
    };
    setReceptionist(user);
    localStorage.setItem('qc_receptionist', JSON.stringify(user));
    return true;
  };

  const logoutReceptionist = () => {
    setReceptionist(null);
    localStorage.removeItem('qc_receptionist');
  };

  const addPatient = (name: string, purpose: string, priority: PriorityLevel): Patient => {
    // Determine next ticket sequence
    const ticketIds = patients.map(p => {
      const match = p.ticketNumber.match(/\d+/);
      return match ? parseInt(match[0], 10) : 100;
    });
    const maxSequence = ticketIds.length > 0 ? Math.max(...ticketIds) : 100;
    const nextTicketNum = `QC-${maxSequence + 1}`;

    const waitingCount = patients.filter(p => p.status === 'waiting').length;
    const estWait = (waitingCount + 1) * 10;

    const newPatient: Patient = {
      id: Math.random().toString(36).substring(2, 9),
      ticketNumber: nextTicketNum,
      name,
      purpose: purpose || 'General Consultation',
      status: 'waiting',
      joinedAt: new Date().toISOString(),
      estimatedWaitMinutes: priority === 'urgent' ? Math.max(3, estWait / 3) : estWait,
      priority
    };

    setPatients(prev => {
      // Re-sort to put urgent patients at top of "waiting" lists when inserted
      const list = [...prev, newPatient];
      return list;
    });

    return newPatient;
  };

  const callPatient = (id: string, room: string) => {
    setPatients(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              status: 'calling',
              assignedRoom: room,
              calledAt: new Date().toISOString()
            }
          : p
      )
    );
  };

  const completePatient = (id: string) => {
    setPatients(prev =>
      prev.map(p => (p.id === id ? { ...p, status: 'completed' } : p))
    );
  };

  const noShowPatient = (id: string) => {
    setPatients(prev =>
      prev.map(p => (p.id === id ? { ...p, status: 'no-show' } : p))
    );
  };

  const removePatient = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
  };

  const resetQueue = () => {
    setPatients(INITIAL_PATIENTS);
    localStorage.setItem('qc_patients', JSON.stringify(INITIAL_PATIENTS));
  };

  return (
    <QueueContext.Provider
      value={{
        patients,
        receptionist,
        loginAsReceptionist,
        logoutReceptionist,
        addPatient,
        callPatient,
        completePatient,
        noShowPatient,
        removePatient,
        resetQueue,
        isOnline,
        setOnlineStatus: setIsOnline,
        darkMode,
        toggleDarkMode,
        averageWaitTime
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
