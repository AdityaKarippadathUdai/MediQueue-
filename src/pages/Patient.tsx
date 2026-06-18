import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { PriorityLevel } from '../types';
import { 
  ClipboardCheck, Sparkles, Clock, Users, ArrowRight, XCircle, 
  PartyPopper, ChevronRight, Activity, ShieldAlert, Heart, Calendar 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Patient: React.FC = () => {
  const { patients, addPatient, removePatient, averageWaitTime, darkMode } = useQueue();

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

  // React to receptionist completing or removing the active ticket
  useEffect(() => {
    if (activeMyTicketId && !myPatient) {
      // It has been cleared or completed
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
    
    // Quick celebration
    setAdmissionSuccess(true);
    setTimeout(() => setAdmissionSuccess(false), 3000);
  };

  // Withdraw action
  const handleWithdraw = () => {
    if (confirm('Are you sure you want to withdraw from the medical queue? This cancels your digital ticket.')) {
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
    
    // Sort similar to Receptionist
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

  return (
    <div className="flex-1 flex flex-col px-4 pt-4" id="patient-view-page">
      <AnimatePresence mode="wait">
        {!myPatient ? (
          /* Form Phase: Check In */
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
                Self-Check In Desk
              </h2>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-[280px] mx-auto leading-relaxed mt-1">
                Enter your details to instantly reserve a virtual ticket and join the clinic queue.
              </p>
            </div>

            {/* Simulated Live Wait Summary Card */}
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
              {/* Full name field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
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

              {/* Purpose/Reason Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest">
                  Reason for Visit
                </label>
                <select
                  value={registerPurpose}
                  onChange={(e) => setRegisterPurpose(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-sm transition-all ${
                    darkMode 
                      ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500' 
                      : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500 shadow-xs'
                  }`}
                  id="patient-register-purpose"
                >
                  <option value="General Consultation">Wellness Checkup & Consult</option>
                  <option value="Vaccine Intake / Jab">Flu Vaccine / Jab Intake</option>
                  <option value="Severe Migraine Check">Acute Pain or Migraine</option>
                  <option value="Knee Joint Physiotherapy">Sports Injury Treatment</option>
                  <option value="Annual Lab Diagnostics">Blood Test or Labs</option>
                </select>
              </div>

              {/* Emergency / Level flag */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest">
                  Triage Severity
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'normal', label: 'Standard', desc: 'Routine visit checks' },
                    { key: 'urgent', label: 'Urgent Care', desc: 'Severe active pain' }
                  ].map(lvl => (
                    <button
                      key={lvl.key}
                      type="button"
                      onClick={() => setRegisterPriority(lvl.key as PriorityLevel)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        registerPriority === lvl.key
                          ? lvl.key === 'urgent'
                            ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold'
                            : 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                          : darkMode
                            ? 'border-slate-850 bg-slate-900/40 text-slate-400 hover:border-slate-750'
                            : 'border-slate-200 bg-white text-slate-550 hover:bg-slate-50 shadow-xs'
                      }`}
                      id={`patient-lvl-btn-${lvl.key}`}
                    >
                      <span className="text-xs font-bold">{lvl.label}</span>
                      <span className="text-[10px] opacity-75 mt-0.5">{lvl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-2"
                  id="patient-join-submit"
                >
                  <span>Complete Triage Queue Entry</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </form>
          </motion.div>
        ) : (
          /* Active Pass Phase: Waiting */
          <motion.div
            key="ticket-display"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Soft success celebration banner */}
            <AnimatePresence>
              {admissionSuccess && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 justify-center"
                >
                  <PartyPopper className="w-4 h-4" />
                  <span>Success! Check-in registered locally.</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Interactive Digital Queue Pass Card */}
            <div className={`py-6 px-4 rounded-3xl border text-center transition-all ${
              myPatient.status === 'calling'
                ? 'animate-ring-pulse border-blue-600 dark:border-blue-500 bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                : darkMode 
                  ? 'bg-slate-905 border-slate-800' 
                  : 'bg-white border-slate-205 shadow-md shadow-slate-100'
            }`}>
              {/* Card Title status */}
              <div className="flex justify-center mb-1">
                {myPatient.status === 'calling' ? (
                  <span className="px-3 py-1.5 rounded-full bg-white text-indigo-700 text-xs font-extrabold tracking-wider animate-bounce uppercase">
                    🛎️ CALLING
                  </span>
                ) : (
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${
                    darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    📋 QUEUED WAITLIST
                  </span>
                )}
              </div>

              {/* Large Code Badge */}
              <div className="py-4">
                <span className={`font-mono text-5xl font-black tracking-tight ${
                  myPatient.status === 'calling' ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {myPatient.ticketNumber}
                </span>
                <p className={`text-xs mt-2 font-medium ${myPatient.status === 'calling' ? 'text-blue-105' : 'text-slate-500 dark:text-slate-400'}`}>
                  Registered for {myPatient.name}
                </p>
              </div>

              <hr className={`border-dashed my-4 ${myPatient.status === 'calling' ? 'border-white/20' : 'border-slate-205 dark:border-slate-800'}`} />

              {/* Patient Live Context update message */}
              {myPatient.status === 'calling' ? (
                /* Now Calling state instructions */
                <div className="space-y-2">
                  <div className="font-display font-extrabold text-[16px] leading-tight">
                    Please proceed to: <span className="underline decoration-wavy font-black text-amber-300">{myPatient.assignedRoom}</span>
                  </div>
                  <p className="text-xs text-blue-100 max-w-[280px] mx-auto leading-relaxed">
                    Nurse Sarah has broadcasted your ticket locally. Let the intake room door assistant know you have arrived.
                  </p>
                </div>
              ) : (
                /* Waiting metrics board */
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className={`p-2.5 rounded-2xl ${darkMode ? 'bg-slate-900/60' : 'bg-slate-50'}`}>
                    <div className="text-[10px] font-bold text-slate-450 uppercase">Line Position</div>
                    <div className="text-lg font-black font-display text-blue-600 dark:text-blue-400 mt-1">
                      {queuePos > 0 ? positionText : 'Next'}
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-2xl ${darkMode ? 'bg-slate-900/60' : 'bg-slate-50'}`}>
                    <div className="text-[10px] font-bold text-slate-450 uppercase">Est. remaining</div>
                    <div className="text-lg font-black font-display text-emerald-500 mt-1">
                      {myPatient.priority === 'urgent' ? 'Soon' : `${queuePos * 8} mins`}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Triage Safety Disclaimer Information */}
            <div className={`p-3.5 rounded-2.5xl border text-xs leading-normal flex gap-3 ${
              darkMode ? 'bg-slate-900 border-slate-850 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <Activity className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">Automated Clinic Update</span>
                You don't need to stand near the counter. Keep this browser active — it updates live through the TV announcement speaker system.
              </div>
            </div>

            {/* Backout / Cancel digital ticket action */}
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
    </div>
  );
};
