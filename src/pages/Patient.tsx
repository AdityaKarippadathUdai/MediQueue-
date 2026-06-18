import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { PriorityLevel } from '../types';
import { 
  ClipboardCheck, Sparkles, Clock, Users, ArrowRight, XCircle, 
  PartyPopper, ChevronRight, Activity, ShieldAlert, Heart, Calendar,
  BellRing, CheckCircle2, UserCheck, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StatsSkeleton, PatientCardSkeleton, ListSkeleton } from '../components/Skeleton';

export const Patient: React.FC = () => {
  const { patients, addPatient, removePatient, averageWaitTime, darkMode } = useQueue();

  // Mode Selection: "preset" uses the requested spec values, "live" uses context check-in
  const [activeTab, setActiveTab] = useState<'preset' | 'live'>('preset');

  // Preview options for demoing states requested (Skeleton loaders and Empty States)
  const [simulateLoading, setSimulateLoading] = useState(false);
  const [simulateEmptyState, setSimulateEmptyState] = useState(false);

  // States for Preset Mode
  const [presetStatus, setPresetStatus] = useState<'Waiting' | 'Being Called' | 'Completed'>('Waiting');

  // Local state to check if we have a ticket checked in this browser
  const [activeMyTicketId, setActiveMyTicketId] = useState<string | null>(() => {
    return localStorage.getItem('qc_my_patient_id') || null;
  });

  const [registerName, setRegisterName] = useState('');
  const [registerPurpose, setRegisterPurpose] = useState('General Consultation');
  const [registerPriority, setRegisterPriority] = useState<PriorityLevel>('normal');
  const [admissionSuccess, setAdmissionSuccess] = useState(false);

  // Retrieve current patient object if already checked in
  const myPatient = activeMyTicketId ? patients.find(p => p.id === activeMyTicketId) : null;

  // Sync state if patient is removed or completed
  useEffect(() => {
    if (activeMyTicketId && !myPatient) {
      localStorage.removeItem('qc_my_patient_id');
      setActiveMyTicketId(null);
    }
  }, [patients, activeMyTicketId, myPatient]);

  // Join Queue action
  const handleJoinQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim()) return;

    const patientObj = addPatient(registerName, registerPurpose, registerPriority);
    setActiveMyTicketId(patientObj.id);
    localStorage.setItem('qc_my_patient_id', patientObj.id);
    setRegisterName('');
    setRegisterPriority('normal');
    
    // Quick success trigger
    setAdmissionSuccess(true);
    setTimeout(() => setAdmissionSuccess(false), 3000);
  };

  // Withdraw action
  const handleWithdraw = () => {
    if (window.confirm('Are you sure you want to withdraw from the medical queue? This cancels your digital ticket.')) {
      if (activeMyTicketId) {
        removePatient(activeMyTicketId);
        localStorage.removeItem('qc_my_patient_id');
        setActiveMyTicketId(null);
      }
    }
  };

  // Find My line position
  const getQueuePosition = () => {
    if (!myPatient) return 0;
    const waitingPatients = patients.filter(p => p.status === 'waiting');
    
    // Sorted list
    const sortedWaiting = waitingPatients.sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });

    const index = sortedWaiting.findIndex(p => p.id === myPatient.id);
    return index !== -1 ? index + 1 : 0;
  };

  const queuePos = getQueuePosition();
  const positionText = queuePos === 1 ? 'Next' : queuePos === 2 ? '2nd' : queuePos === 3 ? '3rd' : `${queuePos}th`;

  // Simulation handlers to demo requested states
  const triggerSkeletonSimulate = () => {
    setSimulateLoading(true);
    setTimeout(() => setSimulateLoading(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-3 pb-8 relative" id="patient-waiting-room-page">
      
      {/* 
        -----------------------------------------
        TAB CONTROLLER / PRESET SIMULATOR WETWARE
        -----------------------------------------
      */}
      <div className={`p-1.5 rounded-2xl flex items-center justify-between mb-4 border ${
        darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/80 border-slate-200/50'
      }`}>
        <button
          onClick={() => {
            setActiveTab('preset');
            setSimulateEmptyState(false);
          }}
          className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'preset'
              ? 'bg-blue-600 text-white shadow-sm'
              : darkMode ? 'text-slate-400 hover:text-slate-205' : 'text-slate-600 hover:text-slate-900'
          }`}
          id="tab-preset-mock"
        >
          Preset Demo (Required Spec)
        </button>
        <button
          onClick={() => setActiveTab('live')}
          className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'live'
              ? 'bg-blue-600 text-white shadow-sm'
              : darkMode ? 'text-slate-400 hover:text-slate-205' : 'text-slate-600 hover:text-slate-900'
          }`}
          id="tab-live-queue"
        >
          My Live Check-In
        </button>
      </div>

      {/* 
        -----------------------------------------
        QUICK TOOLBAR TO PREVIEW REQ STATES (Loader, Empty State)
        -----------------------------------------
      */}
      <div className="flex gap-2 mb-4 justify-center">
        <button
          onClick={triggerSkeletonSimulate}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase border flex items-center gap-1 cursor-pointer transition-colors ${
            darkMode 
              ? 'bg-slate-900/40 border-slate-800 hover:bg-slate-850 text-slate-400' 
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 shadow-xs'
          }`}
          id="demo-skeleton-btn"
        >
          <Layers className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
          <span>Toggle Loader</span>
        </button>
        
        <button
          onClick={() => setSimulateEmptyState(!simulateEmptyState)}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase border flex items-center gap-1 cursor-pointer transition-colors ${
            simulateEmptyState
              ? 'bg-rose-500 text-white border-transparent'
              : darkMode 
                ? 'bg-slate-900/40 border-slate-800 hover:bg-slate-850 text-slate-400' 
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600 shadow-xs'
          }`}
          id="demo-empty-state-btn"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Toggle Empty State</span>
        </button>
      </div>

      {/* 
        -----------------------------------------
        SKELETON SIMULATOR LAYER
        -----------------------------------------
      */}
      {simulateLoading ? (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 rounded-3xl border border-slate-200/50 dark:border-slate-800">
            <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700/60 rounded mb-4 animate-pulse"></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 bg-slate-100 dark:bg-slate-800/40 rounded-2xl animate-pulse"></div>
              <div className="h-20 bg-slate-100 dark:bg-slate-800/40 rounded-2xl animate-pulse"></div>
            </div>
          </div>
          <StatsSkeleton />
          <ListSkeleton />
        </div>
      ) : simulateEmptyState ? (
        /* Empty State display */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-8 rounded-3xl text-center border border-dashed py-14 ${
            darkMode ? 'bg-slate-900/20 border-slate-850' : 'bg-slate-50/50 border-slate-200'
          }`}
          id="patient-empty-state"
        >
          <span className="text-4xl block mb-3 animate-bounce">📭</span>
          <h3 className="font-display font-black text-sm text-slate-900 dark:text-white capitalize">Waiting Room Is Empty</h3>
          <p className="text-[11px] text-slate-450 dark:text-slate-400 max-w-[240px] mx-auto mt-2 leading-relaxed">
            There are no registered patients currently checked into the queue. Please return to Live Check-in tab to add a walk-in patient.
          </p>
        </motion.div>
      ) : activeTab === 'preset' ? (
        /* 
          =======================================
          PRESET DEMORAMA (Required Spec Values)
          =======================================
        */
        <div className="space-y-4">
          
          {/* Header live badge style within screen */}
          <div className="flex items-center justify-between px-1">
            <h3 className="font-display font-black text-xs text-slate-450 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>Queue Cure Waiting Room</span>
            </h3>
            
            <div className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-black text-emerald-500 tracking-wider uppercase">Live</span>
            </div>
          </div>

          {/* Core Spec 2-column bento board containing: Current Token & My Token cards */}
          <div className="grid grid-cols-2 gap-3" id="token-cards-bento">
            
            {/* Current Token Card */}
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-3xl border flex flex-col justify-between relative overflow-hidden transition-all ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/50 shadow-sm'
              }`}
              id="current-token-card"
            >
              <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                Now Serving
              </div>
              <div className="my-2.5">
                <span className="font-mono text-[42px] font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 tracking-tight">
                  104
                </span>
              </div>
              <p className="text-[9.5px] text-slate-400 dark:text-slate-505">
                Active in Consult 1
              </p>
            </motion.div>

            {/* My Token Card */}
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className={`p-4 rounded-3xl border flex flex-col justify-between relative overflow-hidden transition-all ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-blue-600/30 shadow-md shadow-blue-50/40 bg-gradient-to-tr from-blue-500/5 to-indigo-500/5'
              }`}
              id="my-token-card"
            >
              <div className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
                My Token
              </div>
              <div className="my-2.5">
                <span className="font-mono text-[42px] font-black text-blue-600 dark:text-blue-400 tracking-tight">
                  109
                </span>
              </div>
              <p className="text-[9.5px] text-slate-500 dark:text-slate-300 font-semibold truncate leading-tight">
                Walk-In Premium
              </p>
            </motion.div>

          </div>

          {/* Patients Ahead Card & Estimated Wait Card Grid */}
          <div className="grid grid-cols-2 gap-3" id="stats-cards-bento">

            {/* People Ahead Card */}
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`p-3.5 rounded-2.5xl border ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
              }`}
              id="people-ahead-card"
            >
              <div className="flex items-center gap-1.5 text-slate-500 text-[9.5px] font-bold uppercase tracking-wider mb-1">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>Patients Ahead</span>
              </div>
              <div className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                5
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">Estimated people queueing</p>
            </motion.div>

            {/* Estimated Wait Card */}
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`p-3.5 rounded-2.5xl border ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
              }`}
              id="estimated-wait-card"
            >
              <div className="flex items-center gap-1.5 text-slate-500 text-[9.5px] font-bold uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                <span>Estimated Wait</span>
              </div>
              <div className="font-display text-[15px] font-black text-slate-900 dark:text-white leading-relaxed">
                40 Minutes
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5">Based on 8m avg speed</p>
            </motion.div>

          </div>

          {/* Queue Status Card (States: Waiting, Being Called, Completed) */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-4 rounded-3.5xl border ${
              darkMode ? 'bg-slate-900 border-slate-840' : 'bg-white border-slate-200/50 shadow-sm'
            }`}
            id="queue-status-card"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                Lobby Status & Timeline
              </span>
              
              {/* Dynamic Badging depending on selected mock state */}
              {presetStatus === 'Waiting' && (
                <span className="px-2 py-0.5 text-[9.5px] font-extrabold uppercase rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/10 animate-pulse">
                  ⏳ Waiting in Lounge
                </span>
              )}
              {presetStatus === 'Being Called' && (
                <span className="px-2 py-0.5 text-[9.5px] font-extrabold uppercase rounded-md bg-blue-600 text-white border border-transparent animate-bounce">
                  🛎️ Proceed to Consult room
                </span>
              )}
              {presetStatus === 'Completed' && (
                <span className="px-2 py-0.5 text-[9.5px] font-extrabold uppercase rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/10">
                  ✅ Consultation Done
                </span>
              )}
            </div>

            {/* Dynamic Progress Visualization */}
            <div className="space-y-1 mt-4">
              <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wide px-1">
                <span>Intake Entry</span>
                <span>Active Call</span>
                <span>Complete</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative border border-slate-200/10">
                <motion.div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    presetStatus === 'Waiting' 
                      ? 'w-[45%] bg-gradient-to-r from-blue-500 to-amber-500'
                      : presetStatus === 'Being Called'
                        ? 'w-[85%] bg-gradient-to-r from-blue-500 to-blue-600'
                        : 'w-full bg-gradient-to-r from-blue-500 to-emerald-500'
                  }`}
                />
              </div>
            </div>

            {/* Simulated Interactive Stage Selector so user can toggle preview status */}
            <div className={`mt-5 p-2 rounded-2xl ${darkMode ? 'bg-slate-950/45' : 'bg-slate-50'} border border-slate-200/15`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                Interactive State Simulator
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Waiting', 'Being Called', 'Completed'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setPresetStatus(st)}
                    className={`py-2 text-[9px] font-extrabold uppercase rounded-xl transition-all cursor-pointer ${
                      presetStatus === st
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

          </motion.div>

          {/* Simulated Loudspeaker notification showcase */}
          <div className={`p-3.5 rounded-2.5xl border text-xs leading-normal flex gap-3 ${
            presetStatus === 'Being Called'
              ? 'border-blue-500/40 bg-blue-500/5 animate-pulse'
              : darkMode ? 'bg-slate-900 border-slate-850 text-slate-400' : 'bg-slate-50 border-slate-200/80 text-slate-500'
          }`}>
            <Activity className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">Automated Clinic Advisor</span>
              {presetStatus === 'Waiting' && 'Your virtual pass updates in real-time. Feel free to seek fresh coffee in the lounge.'}
              {presetStatus === 'Being Called' && 'Ticket QC-109! Proceed directly to Consultant Room 1 immediately. Nurse Sarah is ready.'}
              {presetStatus === 'Completed' && 'Your clinical receipt and diagnostic slips have been issued. Thank you for using Queue Cure!'}
            </div>
          </div>

        </div>
      ) : (
        /* 
          =======================================
          LIVE INTERACTIVE MODE (Self Check-in)
          =======================================
        */
        <AnimatePresence mode="wait">
          {!myPatient ? (
            /* Register walk-in client form */
            <motion.div
              key="register-flow"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center pt-2 pb-1">
                <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-2">
                  <ClipboardCheck className="w-8 h-8" />
                </div>
                <h2 className="font-display font-extrabold text-[20px] dark:text-white text-slate-900 tracking-tight">
                  Walk-In Check In
                </h2>
                <p className="text-[13px] text-slate-505 dark:text-slate-400 max-w-[280px] mx-auto leading-relaxed mt-1">
                  Enter your name to obtain a real queue ticket and monitor live status update.
                </p>
              </div>

              {/* Dynamic stats banner */}
              <div className={`p-3.5 rounded-2.5xl border grid grid-cols-2 gap-3 statistics-row ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/60 shadow-xs'
              }`}>
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-450">Est. Wait</div>
                    <div className="text-[15px] font-extrabold font-display dark:text-white text-slate-900 mt-0.5">{averageWaitTime} mins</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-550 dark:text-indigo-400 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-450">In Lobby</div>
                    <div className="text-[15px] font-extrabold font-display dark:text-white text-slate-900 mt-0.5">
                      {patients.filter(p => p.status === 'waiting' || p.status === 'calling').length} patients
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleJoinQueue} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-455 uppercase tracking-widest">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-sm transition-all ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500' 
                        : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500 shadow-xs'
                    }`}
                    id="patient-register-name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-455 uppercase tracking-widest">
                    Consultation Purpose
                  </label>
                  <select
                    value={registerPurpose}
                    onChange={(e) => setRegisterPurpose(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-sm transition-all ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500' 
                        : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500 shadow-xs'
                    }`}
                  >
                    <option value="General Consultation">Wellness Checkup & Consult</option>
                    <option value="Vaccine Intake / Jab">Flu Vaccine / Jab Intake</option>
                    <option value="Severe Migraine Check">Acute Pain or Migraine</option>
                    <option value="Knee Joint Physiotherapy">Sports Injury Treatment</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-455 uppercase tracking-widest">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'normal', label: 'Standard', desc: 'Routine check' },
                      { key: 'urgent', label: 'Urgent Care', desc: 'Severe triage' }
                    ].map(lvl => (
                      <button
                        key={lvl.key}
                        type="button"
                        onClick={() => setRegisterPriority(lvl.key as PriorityLevel)}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          registerPriority === lvl.key
                            ? lvl.key === 'urgent'
                              ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : darkMode
                              ? 'border-slate-850 bg-slate-900/40 text-slate-400 hover:border-slate-750'
                              : 'border-slate-200 bg-white text-slate-550 hover:bg-slate-50 shadow-xs'
                        }`}
                      >
                        <span className="text-xs font-bold">{lvl.label}</span>
                        <span className="text-[10px] opacity-75 mt-0.5">{lvl.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Receive Virtual Ticket</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </form>
            </motion.div>
          ) : (
            /* Active Live queued Ticket Pass layout matching spec beautifully */
            <motion.div
              key="ticket-display"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* success notification */}
              <AnimatePresence>
                {admissionSuccess && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 justify-center"
                  >
                    <PartyPopper className="w-4 h-4" />
                    <span>Check-in registered successfully!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Patient Live Pass */}
              <div className={`py-6 px-4 rounded-3xl border text-center transition-all ${
                myPatient.status === 'calling'
                  ? 'animate-ring-pulse border-blue-600 dark:border-blue-500 bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                  : darkMode 
                    ? 'bg-slate-905 border-slate-800' 
                    : 'bg-white border-slate-205 shadow-md shadow-slate-100'
              }`}>
                
                <div className="flex justify-center mb-1">
                  {myPatient.status === 'calling' ? (
                    <span className="px-3 py-1.5 rounded-full bg-white text-indigo-700 text-xs font-extrabold tracking-wider animate-bounce uppercase">
                      🛎️ NOW SERVING
                    </span>
                  ) : (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${
                      darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}>
                      📋 QUEUED IN WAITLIST
                    </span>
                  )}
                </div>

                {/* Patient Large Token number display */}
                <div className="py-4">
                  <span className={`font-mono text-5xl font-black tracking-tight ${
                    myPatient.status === 'calling' ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {myPatient.ticketNumber}
                  </span>
                  <p className={`text-xs mt-2 font-medium ${myPatient.status === 'calling' ? 'text-blue-100' : 'text-slate-550 dark:text-slate-400'}`}>
                    Issued for: <strong className="font-extrabold">{myPatient.name}</strong>
                  </p>
                </div>

                <hr className={`border-dashed my-4 ${myPatient.status === 'calling' ? 'border-white/20' : 'border-slate-205 dark:border-slate-800'}`} />

                {myPatient.status === 'calling' ? (
                  <div className="space-y-2">
                    <div className="font-display font-extrabold text-[16px] leading-tight">
                      Please proceed to: <span className="underline decoration-wavy font-black text-amber-300">{myPatient.assignedRoom || 'Room 1'}</span>
                    </div>
                    <p className="text-xs text-blue-105 max-w-[280px] mx-auto leading-relaxed">
                      Your receptionist has broadcasted your ticket. Please present your screen to the doctor.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 mt-2">
                    <div className={`p-2.5 rounded-2xl ${darkMode ? 'bg-slate-900/65' : 'bg-slate-50 border border-slate-100'}`}>
                      <div className="text-[9.5px] font-bold text-slate-450 uppercase">Line Position</div>
                      <div className="text-base font-black font-display text-blue-600 dark:text-blue-400 mt-1">
                        {queuePos > 0 ? positionText : 'Next'}
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-2xl ${darkMode ? 'bg-slate-900/65' : 'bg-slate-50 border border-slate-100'}`}>
                      <div className="text-[9.5px] font-bold text-slate-450 uppercase">Est. Wait</div>
                      <div className="text-base font-black font-display text-emerald-500 mt-1">
                        {myPatient.priority === 'urgent' ? 'Immediate' : `${queuePos * 8} mins`}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Automated informational tip */}
              <div className={`p-3.5 rounded-2.5xl border text-xs leading-normal flex gap-3 ${
                darkMode ? 'bg-slate-900 border-slate-850 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <Activity className="w-5 h-5 text-emerald-555 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">Automated Clinic Update</span>
                  Keep this tab active. The speaker chime system will alert you when Nurse checks you in.
                </div>
              </div>

              {/* Withdraw button */}
              <div className="pt-2 text-center">
                <button 
                  onClick={handleWithdraw}
                  className="text-xs font-semibold text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 inline-flex items-center gap-1 hover:underline cursor-pointer"
                  id="patient-withdraw-ticket"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Withdraw from Clinic Queue</span>
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      )}

    </div>
  );
};
