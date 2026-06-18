import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { Patient, PriorityLevel, PatientStatus } from '../types';
import { 
  Users, UserPlus, Volume2, CheckCircle2, UserX, AlertCircle, 
  Trash2, Plus, ArrowRight, UserCheck, ShieldAlert, Sparkles, Clock, BarChart3, HelpCircle, Flame, MonitorPlay
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmptyState } from '../components/EmptyState';
import { PatientCardSkeleton } from '../components/Skeleton';

export const Receptionist: React.FC = () => {
  const navigate = useNavigate();
  const { 
    patients, receptionist, logoutReceptionist, addPatient, 
    callPatient, callNextPatient, completePatient, noShowPatient, removePatient, darkMode,
    averageWaitTime, updateAverageConsultationTime, currentToken, waitingCount, completedCount
  } = useQueue();

  // Route protection - send staff back to auth login if not authorized
  useEffect(() => {
    if (!receptionist) {
      navigate('/reception-login');
    }
  }, [receptionist, navigate]);

  const [showAvgEditOptions, setShowAvgEditOptions] = useState(false);

  // Add Patient Card Form Triage States
  const [newPatientName, setNewPatientName] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [successTicket, setSuccessTicket] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('General Consultation');
  const [isUrgent, setIsUrgent] = useState(false);

  // Auto-scrolling list reference or highlight helper
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  if (!receptionist) {
    return null;
  }

  // Active calling tickets
  const callingPatients = patients.filter(p => p.status === 'calling');
  const activeServingPatient = patients.find(p => p.ticketNumber === currentToken || p.status === 'calling');
  const nowServingToken = currentToken;
  const nowServingName = activeServingPatient ? activeServingPatient.name : 'No active patient called';

  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Explicit Validation Check 
    if (!newPatientName.trim()) {
      setFormError('Patient Name is required for queue entry.');
      setSuccessMessage('');
      return;
    }

    setFormError('');
    const priorityCode: PriorityLevel = isUrgent ? 'urgent' : 'normal';
    
    try {
      // Call Context action to add persistent local patient
      const registered = await addPatient(newPatientName, visitPurpose, priorityCode);
      
      // Trigger Success feedback
      setSuccessTicket(registered.ticketNumber);
      setSuccessMessage(`Patient "${newPatientName}" registered successfully!`);
      setNewPatientName('');
      setIsUrgent(false);
      setVisitPurpose('General Consultation');

      // Highlight newly added item in list
      setHighlightedId(registered.id);
      setTimeout(() => setHighlightedId(null), 3000);

      // Auto clear success Toast after 4 seconds
      setTimeout(() => {
        setSuccessMessage('');
        setSuccessTicket('');
      }, 4500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to add patient to register');
    }
  };

  // Automated "Call Next" from Waiting Stack
  const handleCallNextTicket = async () => {
    try {
      const nextPatient = await callNextPatient(receptionist.room);
      if (nextPatient) {
        // Visual flash reminder
        setSuccessMessage(`Now announcing Ticket ${nextPatient.ticketNumber}`);
        setSuccessTicket(nextPatient.ticketNumber);
        setTimeout(() => {
          setSuccessMessage('');
          setSuccessTicket('');
        }, 3500);
      } else {
        alert('The standby waitlist is currently empty. Add a patient to call next.');
      }
    } catch (err: any) {
      alert(err.message || 'No more patients waiting in queue.');
    }
  };

  const handleIncrementAvg = (amount: number) => {
    updateAverageConsultationTime(Math.max(1, averageWaitTime + amount));
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-3 pb-24 relative" id="receptionist-premium-flow">
      
      {/* 
        -----------------------------------------
        RECONCILED STAFF TOP BANNER
        -----------------------------------------
      */}
      <div className={`p-3 rounded-2xl border flex items-center justify-between mb-4 ${
        darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/60 shadow-xs'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            {receptionist.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-display font-medium text-xs text-slate-800 dark:text-slate-200 leading-tight">
              {receptionist.name}
            </h3>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">
              {receptionist.room}
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            logoutReceptionist();
            navigate('/');
          }}
          className="text-[10px] uppercase font-extrabold text-rose-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/5 transition-colors border border-transparent hover:border-rose-500/10"
          id="receptionist-logout-btn"
        >
          Exit desk
        </button>
      </div>

      {/* 
        -----------------------------------------
        CURRENT TOKEN CARD (Now Serving Display)
        -----------------------------------------
      */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-3xl border mb-3.5 transition-all text-center relative overflow-hidden ${
          callingPatients.length > 0 
            ? 'border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-blue-500/10'
            : darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/50 shadow-sm'
        }`}
        id="current-token-wrapper"
      >
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active Call</span>
        </div>

        <div className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-2">
          NOW SERVING
        </div>
        
        <div className="my-2.5">
          <span className="font-mono text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 tracking-tighter">
            {nowServingToken}
          </span>
        </div>

        <div className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'} flex items-center justify-center gap-1`}>
          <UserCheck className="w-3.5 h-3.5 text-blue-500" />
          <span>Patient: <strong className="font-extrabold text-blue-600 dark:text-blue-400">{nowServingName}</strong></span>
        </div>
      </motion.div>

      {/* 
        -----------------------------------------
        ADD PATIENT CARD (Validation states built-in)
        -----------------------------------------
      */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`p-4 rounded-3xl border mb-3.5 transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/50 shadow-sm'
        }`}
        id="add-patient-wrapper"
      >
        <h4 className="text-xs font-extrabold text-slate-950 dark:text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <UserPlus className="w-4 h-4 text-blue-500" />
          <span>Intake Walk-in Registration</span>
        </h4>

        <form onSubmit={handleAddPatientSubmit} className="space-y-3">
          {/* Validation Feedbacks */}
          <AnimatePresence>
            {formError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-semibold flex items-center gap-1.5"
                id="add-patient-error"
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formError}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[11px] font-semibold flex items-center gap-1.5 justify-between"
                id="add-patient-success"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{successMessage}</span>
                </div>
                {successTicket && (
                  <span className="font-mono bg-emerald-500 text-white px-1.5 py-0.5 rounded text-[10px] font-black">
                    {successTicket}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Patient Full Name..."
              value={newPatientName}
              onChange={(e) => {
                setNewPatientName(e.target.value);
                if (e.target.value.trim()) setFormError('');
              }}
              className={`flex-1 px-3.5 py-2.5 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 transition-all ${
                darkMode 
                  ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
              }`}
              id="receptionist-form-name-input"
            />
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/10 flex items-center gap-1 cursor-pointer"
              id="receptionist-form-add-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </motion.button>
          </div>

          {/* Quick options */}
          <div className="flex items-center justify-between pt-1">
            <select
              value={visitPurpose}
              onChange={(e) => setVisitPurpose(e.target.value)}
              className={`px-2 py-1.5 rounded-lg text-[10px] border focus:outline-hidden ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <option value="General Consultation">Wellness Checkup</option>
              <option value="Acute Chest Congestion">Acute Pain Triage</option>
              <option value="Vaccine Intake / Jab">Vaccine / Jab</option>
              <option value="Knee Joint Physiotherapy">Physio consult</option>
            </select>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400">MARK URGENT Triage</span>
            </label>
          </div>
        </form>
      </motion.div>

      {/* 
        -----------------------------------------
        AVERAGE CONSULTATION TIME CARD
        -----------------------------------------
      */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`p-4 rounded-3xl border mb-3.5 transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/50 shadow-sm'
        }`}
        id="average-time-card"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-orange-500/10 text-orange-500">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Consultation Target</div>
              <div className="text-[14px] font-extrabold text-slate-950 dark:text-white mt-0.5">
                {averageWaitTime} Minutes Average
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAvgEditOptions(!showAvgEditOptions)}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            id="average-time-toggle-edit"
          >
            {showAvgEditOptions ? 'Done' : 'Edit'}
          </button>
        </div>

        {/* Accordion dial options */}
        <AnimatePresence>
          {showAvgEditOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-dashed border-slate-250 dark:border-slate-800 flex items-center justify-between gap-3"
            >
              <p className="text-[10px] text-slate-505 dark:text-slate-400 max-w-[180px] leading-relaxed">
                Adjust consultation speeds according to staff availability.
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleIncrementAvg(-1)}
                  className={`w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center border hover:bg-slate-100 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200/80 text-slate-700'
                  }`}
                >
                  -
                </button>
                <span className="font-mono font-bold text-xs w-6 text-center">{averageWaitTime}m</span>
                <button
                  type="button"
                  onClick={() => handleIncrementAvg(1)}
                  className={`w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center border hover:bg-slate-100 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200/80 text-slate-700'
                  }`}
                >
                  +
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 
        -----------------------------------------
        QUEUE STATISTICS CARD
        -----------------------------------------
      */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-3 mb-4"
        id="queue-statistics-holder"
      >
        {/* Waiting box */}
        <div className={`p-3 rounded-2.5xl border flex flex-col justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
        }`}>
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span>WAITING STACK</span>
          </div>
          <div className="text-2xl font-black font-display text-slate-900 dark:text-white mt-1.5">
            {waitingCount}
          </div>
        </div>

        {/* Completed box */}
        <div className={`p-3 rounded-2.5xl border flex flex-col justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
        }`}>
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>COMPLETED TODAY</span>
          </div>
          <div className="text-2xl font-black font-display text-slate-900 dark:text-white mt-1.5">
            {completedCount || 18}
          </div>
        </div>
      </motion.div>

      {/* 
        -----------------------------------------
        CURRENT QUEUE CARD (STANDBY LIST)
        -----------------------------------------
      */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest">
            Live Standby Queue
          </h4>
          <span className="text-[10px] font-mono text-slate-400">{patients.length} total</span>
        </div>

        <div className={`p-3 rounded-3.5xl border min-h-[160px] pb-6 ${
          darkMode ? 'bg-slate-905 border-slate-800/80' : 'bg-white border-slate-205/60 shadow-xs'
        }`} id="queue-list-card">
          {patients.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <Sparkles className="w-7 h-7 mx-auto mb-1 text-slate-300 animate-pulse" />
              <p className="text-xs">All Standby queues are completely vacant.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {patients.map((pt, idx) => (
                  <motion.div
                    key={pt.id}
                    layoutId={`receptionist-pt-${pt.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      backgroundColor: highlightedId === pt.id 
                        ? (darkMode ? 'rgba(37, 99, 235, 0.15)' : 'rgba(219, 234, 254, 0.5)')
                        : 'transparent'
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      pt.priority === 'urgent' && pt.status === 'waiting'
                        ? darkMode ? 'bg-rose-950/20 border-rose-950' : 'bg-red-500/5 border-red-100'
                        : pt.status === 'calling'
                          ? 'border-indigo-500 bg-indigo-500/5'
                          : darkMode ? 'border-slate-800' : 'border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Ticket Badge */}
                      <span className="font-mono text-xs font-extrabold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                        {pt.ticketNumber}
                      </span>
                      
                      {/* Name / Reason */}
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          {pt.name}
                          {pt.priority === 'urgent' && pt.status === 'waiting' && (
                            <span className="text-[7.5px] uppercase font-black bg-rose-500 text-white px-1 rounded">Urgent</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">{pt.purpose}</p>
                      </div>
                    </div>

                    {/* Left align button actions or status */}
                    <div className="flex items-center gap-1.5">
                      {pt.status === 'waiting' && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => callPatient(pt.id, receptionist.room)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Call</span>
                        </motion.button>
                      )}

                      {pt.status === 'calling' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => completePatient(pt.id)}
                            className="p-1.5 rounded bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors"
                            title="Complete"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => noShowPatient(pt.id)}
                            className="p-1.5 rounded bg-rose-500/15 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                            title="No Show"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Status badges */}
                      {(pt.status === 'completed' || pt.status === 'no-show') && (
                        <div className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                          pt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {pt.status}
                        </div>
                      )}

                      {/* Quick delete card */}
                      <button
                        onClick={() => removePatient(pt.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* 
        -----------------------------------------
        FLOATING CALL NEXT PATIENT BUTTON
        -----------------------------------------
      */}
      <div className="absolute bottom-6 right-5 z-40">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          animate={{
            boxShadow: [
              "0 4px 14px 0 rgba(37, 99, 235, 0.4)",
              "0 4px 20px 8px rgba(37, 99, 235, 0.15)",
              "0 4px 14px 0 rgba(37, 99, 235, 0.4)"
            ]
          }}
          transition={{
            repeat: Infinity,
            duration: 2.2,
            ease: "easeInOut"
          }}
          onClick={handleCallNextTicket}
          disabled={waitingCount === 0}
          className={`flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl cursor-pointer select-none border border-blue-400/20 ${
            waitingCount === 0 ? 'opacity-40 saturate-50 cursor-not-allowed' : ''
          }`}
          title="Call Next Patient in Standby Queue"
          id="floating-call-next-ticket"
        >
          <Volume2 className="w-6 h-6 animate-pulse-slow text-white" />
          
          {waitingCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 animate-bounce">
              {waitingCount}
            </span>
          )}
        </motion.button>
      </div>

    </div>
  );
};
