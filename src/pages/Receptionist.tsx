import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { Patient, PriorityLevel, PatientStatus } from '../types';
import { 
  Users, UserPlus, Volume2, CheckCircle2, UserX, AlertCircle, 
  Trash2, Plus, ArrowRight, UserCheck, ShieldAlert 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmptyState } from '../components/EmptyState';
import { PatientCardSkeleton } from '../components/Skeleton';

export const Receptionist: React.FC = () => {
  const navigate = useNavigate();
  const { 
    patients, receptionist, logoutReceptionist, addPatient, 
    callPatient, completePatient, noShowPatient, removePatient, darkMode 
  } = useQueue();

  // Redirect to login if receptionist is not signed in
  useEffect(() => {
    if (!receptionist) {
      navigate('/reception-login');
    }
  }, [receptionist, navigate]);

  const [activeTab, setActiveTab] = useState<'waiting' | 'calling' | 'history'>('waiting');
  
  // Walk-in intake Form state
  const [showIntakeDrawer, setShowIntakeDrawer] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [purpose, setPurpose] = useState('General Consultation');
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [successToast, setSuccessToast] = useState('');

  // Skeletons simulator when switching tabs to feel snappy and native
  const [loadingList, setLoadingList] = useState(false);
  useEffect(() => {
    setLoadingList(true);
    const timer = setTimeout(() => setLoadingList(false), 300);
    return () => clearTimeout(timer);
  }, [activeTab]);

  if (!receptionist) {
    return null;
  }

  // Filter patients by active state
  const getFilteredPatients = () => {
    switch (activeTab) {
      case 'waiting':
        return patients.filter(p => p.status === 'waiting')
          // Sort urgent ones first, then by joinedAt sequence
          .sort((a, b) => {
            if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
            if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
            return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
          });
      case 'calling':
        return patients.filter(p => p.status === 'calling');
      case 'history':
        return patients.filter(p => p.status === 'completed' || p.status === 'no-show');
      default:
        return [];
    }
  };

  const handleCreateIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;
    
    const newPatient = addPatient(patientName, purpose, priority);
    setPatientName('');
    setPriority('normal');
    setShowIntakeDrawer(false);
    
    // Display successful banner
    setSuccessToast(`Ticket ${newPatient.ticketNumber} registered successfully.`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleCallPatient = (id: string) => {
    callPatient(id, receptionist.room);
    setActiveTab('calling');
  };

  const handleLogout = () => {
    logoutReceptionist();
    navigate('/');
  };

  const filteredPatients = getFilteredPatients();

  // Stats Counters
  const waitingCount = patients.filter(p => p.status === 'waiting').length;
  const callingCount = patients.filter(p => p.status === 'calling').length;
  const historyCount = patients.filter(p => p.status === 'completed' || p.status === 'no-show').length;

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 relative" id="receptionist-dashboard">
      
      {/* Top Header/Staff profile tile */}
      <div className={`p-4 rounded-2.5xl border flex items-center justify-between mb-4 ${
        darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/60 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            {receptionist.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-slate-950 dark:text-white leading-tight">
              {receptionist.name}
            </h3>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
              Assigned to: {receptionist.room}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 px-3 py-1.5 rounded-lg hover:bg-rose-500/5 cursor-pointer border border-transparent hover:border-rose-500/10 transition-colors"
          id="receptionist-signout"
        >
          Logout Desk
        </button>
      </div>

      {/* Success Notification Popup Banner */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-3 rounded-xl bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center justify-between"
            id="receptionist-toast-banner"
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span>{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast('')} className="font-bold opacity-80 cursor-pointer">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { key: 'waiting', icon: Users, label: 'Waiting', count: waitingCount, color: 'text-blue-500 hover:bg-blue-500/5' },
          { key: 'calling', icon: Volume2, label: 'Calling', count: callingCount, color: 'text-amber-500 hover:bg-amber-500/5' },
          { key: 'history', icon: CheckCircle2, label: 'Ready', count: historyCount, color: 'text-emerald-500 hover:bg-emerald-500/5' }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key as any)}
            className={`p-2.5 rounded-2xl border transition-all text-left relative cursor-pointer ${
              activeTab === item.key
                ? darkMode
                  ? 'bg-slate-905 border-slate-700 ring-1 ring-slate-800'
                  : 'bg-white border-slate-350 shadow-sm'
                : darkMode
                  ? 'bg-slate-900/30 border-slate-900 text-slate-400'
                  : 'bg-slate-50/70 border-slate-200/50 text-slate-500'
            }`}
          >
            <div className="flex justify-between items-center">
              <item.icon className={`w-4 h-4 ${activeTab === item.key ? item.color.split(' ')[0] : 'text-slate-400'}`} />
              <span className={`text-[10px] uppercase tracking-wider font-bold opacity-80 z-10`}>{item.label}</span>
            </div>
            <div className="mt-2 text-xl font-bold font-display text-slate-950 dark:text-white leading-none">
              {item.count}
            </div>
          </button>
        ))}
      </div>

      {/* Patient Queue Head */}
      <div className="flex justify-between items-center mb-2.5">
        <h4 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
          {activeTab === 'waiting' && 'Patient Priority Queue'}
          {activeTab === 'calling' && 'Active Loudspeaker Callings'}
          {activeTab === 'history' && 'Admitted / Closed History'}
        </h4>

        {activeTab === 'waiting' && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowIntakeDrawer(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            id="open-intake-drawer-button"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Intake Walk-in</span>
          </motion.button>
        )}
      </div>

      {/* Main Container stream with loaders */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pb-20">
        {loadingList ? (
          <div className="space-y-2.5">
            <PatientCardSkeleton />
            <PatientCardSkeleton />
          </div>
        ) : filteredPatients.length === 0 ? (
          <EmptyState
            title={
              activeTab === 'waiting' 
                ? 'Queue Clear' 
                : activeTab === 'calling' 
                  ? 'No Active Announcements' 
                  : 'Logs Archive Empty'
            }
            description={
              activeTab === 'waiting'
                ? 'Excellent work triage room! There are no patients waiting in the clinic foyer.'
                : activeTab === 'calling'
                  ? 'Call a waiting ticket below to broadcast them automatically onto the Lobby Display.'
                  : 'No patients have been checked in or marked as completed during this session.'
            }
            icon={activeTab === 'waiting' ? 'users' : 'clipboard'}
            actionLabel={activeTab === 'waiting' ? 'New Walk-In Intake' : undefined}
            onAction={activeTab === 'waiting' ? () => setShowIntakeDrawer(true) : undefined}
          />
        ) : (
          <AnimatePresence initial={false}>
            {filteredPatients.map((patient, index) => (
              <motion.div
                key={patient.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -50 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`p-3 rounded-2.5xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                  patient.priority === 'urgent' && patient.status === 'waiting'
                    ? darkMode
                      ? 'bg-rose-950/20 border-rose-900/60'
                      : 'bg-rose-500/5 border-rose-250/60 shadow-xs'
                    : patient.status === 'calling'
                      ? 'animate-ring-pulse border-blue-600 dark:border-blue-500'
                      : darkMode
                        ? 'bg-slate-900/50 border-slate-850'
                        : 'bg-white border-slate-200/50 shadow-sm'
                }`}
                id={`patient-card-${patient.ticketNumber}`}
              >
                <div className="flex items-center gap-3">
                  {/* Digital circular badge indicator */}
                  <div className={`w-11 h-11 rounded-xl font-mono text-center flex flex-col items-center justify-center leading-none flex-shrink-0 ${
                    patient.priority === 'urgent' && patient.status === 'waiting'
                      ? 'bg-qc-danger text-white'
                      : patient.status === 'calling'
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                        : darkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-800'
                  }`}>
                    <span className="text-[9px] font-bold tracking-tight opacity-75">TICKET</span>
                    <span className="text-[13px] font-extrabold mt-0.5">{patient.ticketNumber.split('-')[1]}</span>
                  </div>

                  {/* Patient Name / Reason */}
                  <div>
                    <h5 className="font-display font-extrabold text-[14px] text-slate-950 dark:text-white leading-tight flex items-center gap-1.5">
                      {patient.name}
                      {patient.priority === 'urgent' && (
                        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-extrabold bg-red-500 text-white uppercase animate-pulse-slow">
                          URGENT
                        </span>
                      )}
                    </h5>
                    <p className={`text-[12px] mt-0.5 leading-tight ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {patient.purpose}
                    </p>
                    <span className="text-[10px] font-mono opacity-60">
                      In {Math.round((Date.now() - new Date(patient.joinedAt).getTime()) / 60000)}m ago
                    </span>
                  </div>
                </div>

                {/* Operations contextual actions depending on Current Active Tab */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {patient.status === 'waiting' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCallPatient(patient.id)}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/10 flex items-center gap-1 cursor-pointer"
                      id={`action-call-${patient.id}`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </motion.button>
                  )}

                  {patient.status === 'calling' && (
                    <>
                      {/* Complete Check-in button */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => completePatient(patient.id)}
                        className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white transition-colors cursor-pointer"
                        title="Mark Completed"
                        id={`action-complete-${patient.id}`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </motion.button>

                      {/* No Show button */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => noShowPatient(patient.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-colors cursor-pointer"
                        title="Mark No Show"
                        id={`action-noshow-${patient.id}`}
                      >
                        <UserX className="w-4 h-4" />
                      </motion.button>
                    </>
                  )}

                  {activeTab === 'history' && (
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        patient.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        {patient.status}
                      </span>
                      {patient.assignedRoom && (
                        <div className="text-[10px] text-slate-400 font-medium">By {patient.assignedRoom}</div>
                      )}
                    </div>
                  )}

                  {/* Ultimate emergency option: Delete card completely */}
                  {patient.status === 'waiting' && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${patient.name} from admissions entirely?`)) removePatient(patient.id);
                      }}
                      className="p-2 rounded-xl text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer"
                      id={`action-delete-${patient.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Floating Walk-in Intake drawer simulation */}
      <AnimatePresence>
        {showIntakeDrawer && (
          <>
            {/* Soft Backdrop overlay wrapper */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIntakeDrawer(false)}
              className="absolute inset-0 bg-slate-950 z-40 rounded-b-[40px] pointer-events-auto"
            />

            {/* Simulated Sheet drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`absolute bottom-0 left-0 right-0 p-5 rounded-t-[28px] border-t z-50 pointer-events-auto shadow-2xl ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
              id="walk-in-intake-drawer"
            >
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-extrabold text-[18px] text-slate-950 dark:text-white">
                  Intake Walk-In Admission
                </h3>
                <button 
                  onClick={() => setShowIntakeDrawer(false)}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateIntake} className="space-y-4">
                {/* Full name input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Johnathan Smith"
                    className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 transition-all ${
                      darkMode 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                    }`}
                  />
                </div>

                {/* Reason select list */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reason for Visit</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 transition-all ${
                      darkMode 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 shadow-xs'
                    }`}
                  >
                    <option value="General Consultation">General Consultation</option>
                    <option value="Acute Chest Congestion">Acute Chest Congestion</option>
                    <option value="Vaccine Intake / Jab">Vaccine Intake / Jab</option>
                    <option value="Knee Joint Physiotherapy">Knee Joint Physiotherapy</option>
                    <option value="Severe Migraine Check">Severe Migraine Check</option>
                    <option value="Annual Lab Diagnostics">Annual Lab Diagnostics</option>
                  </select>
                </div>

                {/* Priority Radios */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Triage Level</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'normal', label: 'Normal / Non-urgent', flag: 'badge bg-slate-100 text-slate-700' },
                      { key: 'urgent', label: 'Urgent Clinic Case', flag: 'badge bg-rose-500 text-white' }
                    ].map(t => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setPriority(t.key as PriorityLevel)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          priority === t.key
                            ? t.key === 'urgent'
                              ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold'
                              : 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                            : darkMode
                              ? 'border-slate-800 bg-slate-800/40 text-slate-400'
                              : 'border-slate-200 bg-slate-50/50 text-slate-500'
                        }`}
                      >
                        <span className="text-xs">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/10 cursor-pointer"
                  >
                    Register Walk-In Patient
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
