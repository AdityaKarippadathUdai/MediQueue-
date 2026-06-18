import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { PriorityLevel, Patient as PatientType } from '../types';
import { 
  ClipboardCheck, 
  Sparkles, 
  Clock, 
  Users, 
  ArrowLeft, 
  XCircle, 
  PartyPopper, 
  Activity, 
  Heart, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  ChevronRight,
  UserCheck,
  Smartphone,
  ShieldCheck,
  BellRing
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StatsSkeleton, PatientCardSkeleton, ListSkeleton } from '../components/Skeleton';

export const Patient: React.FC = () => {
  const { tokenId } = useParams<{ tokenId?: string }>();
  const navigate = useNavigate();
  
  const { 
    patients, 
    addPatient, 
    removePatient, 
    averageWaitTime, 
    currentToken, 
    waitingCount,
    socketStatus,
    darkMode 
  } = useQueue();

  // Mode tabs for standard access: "track" or "register"
  const [activeTab, setActiveTab] = useState<'track' | 'register'>('track');

  // Input states for Token Search Form
  const [searchToken, setSearchToken] = useState('');
  const [searchError, setSearchError] = useState('');
  const [searchSuccess, setSearchSuccess] = useState(false);

  // Input states for Registration Form
  const [registerName, setRegisterName] = useState('');
  const [registerPurpose, setRegisterPurpose] = useState('General Consultation');
  const [registerPriority, setRegisterPriority] = useState<PriorityLevel>('normal');
  const [admissionSuccess, setAdmissionSuccess] = useState(false);

  // Simulation loaders to check skeleton screens
  const [simulateLoading, setSimulateLoading] = useState(false);

  // Presets status for mock/simulated tokens not found in the live backend list
  const [presetStatus, setPresetStatus] = useState<'Waiting' | 'Being Called' | 'Completed'>('Waiting');

  // Find if there is a matching patient in the database
  const getMatchedPatient = (): PatientType | null => {
    if (!tokenId) return null;
    const cleanToken = tokenId.toUpperCase().trim();
    
    // Look for exact matchmaking
    return patients.find(p => 
      p.ticketNumber.toUpperCase() === cleanToken || 
      p.ticketNumber.toUpperCase() === `QC-${cleanToken}` || 
      p.id === cleanToken
    ) || null;
  };

  const matchedPatient = getMatchedPatient();

  // If a live patient matches, compute priority wait time & position
  const getQueuePosition = (patientObj: PatientType) => {
    if (patientObj.status !== 'waiting') return 0;
    const waitingPatients = patients.filter(p => p.status === 'waiting');
    
    // Ordered by Priority first, then joined time
    const sortedWaiting = waitingPatients.sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });

    const index = sortedWaiting.findIndex(p => p.id === patientObj.id);
    return index !== -1 ? index + 1 : 0;
  };

  // Safe checks for estimated times
  const patientPos = matchedPatient ? getQueuePosition(matchedPatient) : 0;
  const positionText = patientPos === 1 ? 'Next' : patientPos === 2 ? '2nd' : patientPos === 3 ? '3rd' : `${patientPos}th`;

  // Track Token validation and redirection
  const handleTrackToken = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setSearchSuccess(false);

    if (!searchToken.trim()) {
      setSearchError('Please enter your token number.');
      return;
    }

    // Support numeric or fully qualified token QC-XXX
    const clean = searchToken.replace(/qc-/i, '').trim();
    if (!/^\d+$/.test(clean)) {
      setSearchError('Invalid token format. Please enter a number (e.g. 108).');
      return;
    }

    setSearchSuccess(true);
    setTimeout(() => {
      setSearchSuccess(false);
      navigate(`/patient/${clean}`);
    }, 600);
  };

  // Direct Join Queue Submission
  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim()) return;

    try {
      const patientObj = await addPatient(registerName, registerPurpose, registerPriority);
      setRegisterName('');
      setRegisterPriority('normal');
      
      setAdmissionSuccess(true);
      // Seamlessly transition patient immediately to tracking view of their real token
      setTimeout(() => {
        setAdmissionSuccess(false);
        const codeNum = patientObj.ticketNumber.replace(/qc-/i, '');
        navigate(`/patient/${codeNum}`);
      }, 1500);
    } catch (err) {
      console.error('Error joining queue:', err);
    }
  };

  // Leave queue / cancel appointment action
  const handleWithdraw = async (patientId: string) => {
    if (window.confirm('Are you sure you want to withdraw from the clinic queue? This action cancels your digital ticket.')) {
      try {
        await removePatient(patientId);
        navigate('/patient');
      } catch (err) {
        console.error('Error withdrawing from queue:', err);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col px-5 pt-3 pb-8 relative overflow-hidden" id="patient-portal-container">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-50px] right-[-50px] w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20px] left-[-30px] w-44 h-44 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      {/* -----------------------------------------------------
          SCREEN A: IF A TOKEN ID PARAMETER IS SPECIFIED (TRACKING DETAIL VIEW)
          ----------------------------------------------------- */}
      {tokenId ? (
        <AnimatePresence mode="wait">
          <motion.div
            key="tracking-details"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4 flex-1 flex flex-col justify-between"
          >
            {/* Header with Back button navigation */}
            <div className="flex items-center justify-between py-1 z-10">
              <button 
                onClick={() => navigate('/patient')}
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Track Another</span>
              </button>

              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {socketStatus === 'connected' ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  )}
                </span>
                <span className={`text-[10px] font-bold tracking-wider uppercase ${
                  socketStatus === 'connected' ? 'text-emerald-500' : 'text-amber-500 animate-pulse'
                }`}>
                  {socketStatus === 'connected' ? 'Live Track' : 'Connecting'}
                </span>
              </div>
            </div>

            {/* CASE 1: Patient exists on the real Server Side List */}
            {matchedPatient ? (
              <div className="space-y-4 flex-1 flex flex-col justify-center my-auto">
                <motion.div
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`py-7 px-5 rounded-3.5xl border text-center relative overflow-hidden transition-all shadow-xl ${
                    matchedPatient.status === 'calling'
                      ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-500/20 shadow-md'
                      : darkMode 
                        ? 'bg-slate-900 border-slate-800' 
                        : 'bg-white border-slate-100 shadow-slate-100/60'
                  }`}
                  id={`live-token-ticket-${matchedPatient.ticketNumber}`}
                >
                  <div className="flex justify-center mb-1">
                    {matchedPatient.status === 'calling' ? (
                      <span className="px-3 py-1.5 rounded-xl bg-white text-blue-700 text-[10px] font-black tracking-wider animate-bounce uppercase shadow-sm">
                        🛎️ Proceed Immediately
                      </span>
                    ) : matchedPatient.status === 'completed' ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 text-[10px] font-extrabold tracking-wider uppercase">
                        ✅ Session Complete
                      </span>
                    ) : matchedPatient.status === 'no-show' ? (
                      <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-605 dark:text-rose-400 border border-rose-500/15 text-[10px] font-extrabold tracking-wider uppercase">
                        ⚠️ No-Show Checked
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold tracking-wider uppercase border ${
                        darkMode ? 'bg-slate-800/80 text-slate-350 border-slate-700' : 'bg-slate-50 text-slate-650 border-slate-150'
                      }`}>
                        📋 Queue Standby
                      </span>
                    )}
                  </div>

                  {/* Token Sizing representation */}
                  <div className="py-4">
                    <span className={`font-mono text-[56px] font-black tracking-tighter ${
                      matchedPatient.status === 'calling' ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {matchedPatient.ticketNumber}
                    </span>
                    <p className={`text-xs mt-1.5 font-medium ${matchedPatient.status === 'calling' ? 'text-blue-105' : 'text-slate-500 dark:text-slate-400'}`}>
                      Patient: <strong className="font-extrabold text-slate-800 dark:text-slate-200">{matchedPatient.name}</strong>
                    </p>
                    <p className={`text-[10px] mt-1 ${matchedPatient.status === 'calling' ? 'text-white/60' : 'text-slate-400'}`}>
                      Purpose: {matchedPatient.purpose}
                    </p>
                  </div>

                  <hr className={`border-dashed my-3.5 ${matchedPatient.status === 'calling' ? 'border-white/20' : 'border-slate-150 dark:border-slate-800'}`} />

                  {/* Callout action for patient consultation layout */}
                  {matchedPatient.status === 'calling' ? (
                    <div className="space-y-1.5 animate-pulse">
                      <div className="font-sans font-extrabold text-[15px] text-white">
                        Room: <span className="underline decoration-wavy text-amber-300 font-sans font-black">{matchedPatient.assignedRoom || 'Examination Room 1'}</span>
                      </div>
                      <p className="text-[11px] text-blue-100 max-w-[280px] mx-auto leading-relaxed">
                        Please proceed to the examination lounge. Dr. Sarah is waiting to begin your checkup.
                      </p>
                    </div>
                  ) : matchedPatient.status === 'completed' ? (
                    <div className="space-y-1">
                      <div className="font-sans font-extrabold text-[14px] text-emerald-500 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Consultation Finished</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                        Your electronic diagnostics report is issued. Thank you for choosing Queue Cure '26.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className={`p-3 rounded-2xl border text-left ${darkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-150/70'}`}>
                        <div className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Lounge Line</div>
                        <div className="text-[18px] font-black font-display text-blue-600 dark:text-blue-400 mt-1">
                          {patientPos > 0 ? `#${patientPos}` : 'Next'}
                        </div>
                      </div>

                      <div className={`p-3 rounded-2xl border text-left ${darkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-150/70'}`}>
                        <div className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Est. Wait</div>
                        <div className="text-[18px] font-black font-display text-emerald-500 mt-1">
                          {matchedPatient.priority === 'urgent' ? 'Immediate' : `${Math.max(8, patientPos * (averageWaitTime || 8))} min`}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Additional tips under active pass */}
                <div className={`p-3.5 rounded-2.5xl border text-[11.5px] leading-relaxed flex gap-2.5 ${
                  darkMode ? 'bg-slate-900/40 border-slate-850 text-slate-400' : 'bg-slate-50 border-slate-150 text-slate-500'
                }`}>
                  <Activity className="w-4.5 h-4.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">Automated Clinic Advisor</span>
                    Active notifications are synced via Socket.IO. We'll chime when your practitioner calls.
                  </div>
                </div>

                {/* Patient can cancel/withdraw */}
                {matchedPatient.status === 'waiting' && (
                  <div className="text-center pt-2 select-none">
                    <button
                      onClick={() => handleWithdraw(matchedPatient.id)}
                      className="text-[11px] font-bold text-slate-400 hover:text-rose-500 dark:hover:text-rose-450 transition-colors inline-flex items-center gap-1.5 cursor-pointer hover:underline"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Leave Clinic Queue</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // CASE 2: Mock Session / Token not found on server (Allows testing token inputs flawlessly)
              <div className="space-y-4 flex-1 flex flex-col justify-center my-auto">
                <motion.div
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`py-7 px-5 rounded-3.5xl border text-center relative overflow-hidden transition-all shadow-xl ${
                    presetStatus === 'Being Called'
                      ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-500/20 shadow-md'
                      : darkMode 
                        ? 'bg-slate-900 border-slate-800' 
                        : 'bg-white border-slate-100 shadow-slate-100/60'
                  }`}
                  id={`mock-token-ticket-${tokenId}`}
                >
                  <div className="absolute top-2 right-2 bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded text-[8px] font-bold uppercase select-none dark:bg-blue-400/15 dark:text-blue-400">
                    Simulation Pass
                  </div>

                  <div className="flex justify-center mb-1">
                    {presetStatus === 'Being Called' ? (
                      <span className="px-3 py-1.5 rounded-xl bg-white text-blue-700 text-[10px] font-black tracking-wider animate-bounce uppercase shadow-sm">
                        🛎️ Procced to Room
                      </span>
                    ) : presetStatus === 'Completed' ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 text-[10px] font-extrabold tracking-wider uppercase">
                        ✅ Session Complete
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold tracking-wider uppercase border ${
                        darkMode ? 'bg-slate-800/80 text-slate-350 border-slate-700' : 'bg-slate-50 text-slate-650 border-slate-150'
                      }`}>
                        📋 Queue Standby
                      </span>
                    )}
                  </div>

                  {/* Token number */}
                  <div className="py-4">
                    <span className={`font-mono text-[56px] font-black tracking-tighter ${
                      presetStatus === 'Being Called' ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      QC-{tokenId.toUpperCase()}
                    </span>
                    <p className={`text-xs mt-1.5 font-medium ${presetStatus === 'Being Called' ? 'text-blue-105' : 'text-slate-500 dark:text-slate-400'}`}>
                      Patient: <strong className="font-extrabold text-slate-800 dark:text-slate-200">Demo Patient (Token #{tokenId})</strong>
                    </p>
                    <p className={`text-[10px] mt-1 ${presetStatus === 'Being Called' ? 'text-white/60' : 'text-slate-400'}`}>
                      Consultation Purpose: General Wellness Check
                    </p>
                  </div>

                  <hr className={`border-dashed my-3.5 ${presetStatus === 'Being Called' ? 'border-white/20' : 'border-slate-150 dark:border-slate-800'}`} />

                  {/* Timeline progress line */}
                  <div className="space-y-1.5 mb-5 select-none">
                    <div className="flex justify-between text-[9px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider px-1">
                      <span>Intake</span>
                      <span>Calling</span>
                      <span>Done</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          presetStatus === 'Waiting' 
                            ? 'w-[35%] bg-blue-500' 
                            : presetStatus === 'Being Called' 
                              ? 'w-[75%] bg-blue-400' 
                              : 'w-full bg-emerald-500'
                        }`}
                      />
                    </div>
                  </div>

                  {presetStatus === 'Being Called' ? (
                    <div className="space-y-1.5">
                      <div className="font-sans font-extrabold text-[15px] text-white">
                        Please proceed to: <span className="underline decoration-wavy text-amber-300 font-black">Examination Room 1</span>
                      </div>
                      <p className="text-[11px] text-blue-105 max-w-[280px] mx-auto leading-relaxed">
                        Clinic room is prepared for your consultation. Nurse Sarah will receive you.
                      </p>
                    </div>
                  ) : presetStatus === 'Completed' ? (
                    <div className="space-y-1">
                      <div className="font-sans font-extrabold text-[14px] text-emerald-500 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Treatment Complete</span>
                      </div>
                      <p className="text-[11px] text-slate-505 dark:text-slate-450 max-w-[280px] mx-auto leading-relaxed">
                        Billing and digital prescriptions have been logged. You may leave the lounge.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-2xl border text-left ${darkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-150/70'}`}>
                        <div className="text-[9.5px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Lobby Ahead</div>
                        <div className="text-[18px] font-black font-display text-blue-600 dark:text-blue-400 mt-1">
                          5 Patients
                        </div>
                      </div>

                      <div className={`p-3 rounded-2xl border text-left ${darkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-150/70'}`}>
                        <div className="text-[9.5px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Est. Waiting</div>
                        <div className="text-[18px] font-black font-display text-emerald-500 mt-1">
                          40 Minutes
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* State simulator helper requested */}
                <div className={`p-4 rounded-3xl border ${
                  darkMode ? 'bg-slate-900/60 border-slate-850' : 'bg-slate-50 border-slate-150/80'
                }`}>
                  <span className="text-[10px] font-extrabold text-blue-500 dark:text-blue-450 uppercase tracking-widest block mb-2.5 text-center">
                    Simulate Live Callback States
                  </span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {(['Waiting', 'Being Called', 'Completed'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => setPresetStatus(st)}
                        className={`py-2 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${
                          presetStatus === st
                            ? 'bg-blue-600 text-white shadow-xs'
                            : darkMode
                              ? 'bg-slate-950 hover:bg-slate-850 text-slate-400'
                              : 'bg-white hover:bg-slate-100 text-slate-550 border border-slate-205 shadow-2xs'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Back Link */}
                <div className="text-center pt-2 select-none">
                  <button
                    onClick={() => navigate('/patient')}
                    className="text-[11px] font-bold text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer hover:underline"
                  >
                    Return to Token Portal Entry
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        /* -----------------------------------------------------
            SCREEN B: PRIMARY RECEPTION & TRACKING ENTRY PORTAL
            ----------------------------------------------------- */
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          
          {/* Header Description Title and Badge */}
          <div className="text-center pt-3 pb-1">
            <div className="inline-flex items-center gap-1 text-slate-450 dark:text-slate-500 text-[11px] font-bold tracking-tight mb-2">
              <Heart className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />
              <span>Queue Cure</span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-500">Patient Lounge</span>
            </div>

            <h2 className="font-sans font-extrabold text-[22px] text-slate-900 dark:text-white tracking-tight">
              Track Your Queue
            </h2>
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 max-w-[290px] mx-auto mt-1 leading-relaxed">
              Enter your token number to view live queue updates.
            </p>
          </div>

          {/* Mode Selector Tab Bar */}
          <div className={`p-1 rounded-2xl flex items-center border ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-150 shadow-inner'
          }`}>
            <button
              onClick={() => setActiveTab('track')}
              className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'track'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-805 dark:hover:text-slate-200'
              }`}
            >
              Track Token
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 text-center py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-805 dark:hover:text-slate-200'
              }`}
            >
              Sign Up Walk-In
            </button>
          </div>

          {/* Tab Render Layouts */}
          <AnimatePresence mode="wait">
            {activeTab === 'track' ? (
              /* TAB 1: ENTER TOKEN SEARCH */
              <motion.div
                key="tab-tracking-search"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4 flex-1 flex flex-col justify-center"
              >
                <div className={`p-5 rounded-3.5xl border ${
                  darkMode 
                    ? 'bg-slate-900 border-slate-800 shadow-xl' 
                    : 'bg-white border-slate-100 shadow-lg shadow-slate-100/50'
                }`}>
                  <form onSubmit={handleTrackToken} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Active Token Number
                        </label>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Example: <strong className="text-blue-500">108</strong>
                        </span>
                      </div>

                      {/* Animated focus input representation */}
                      <div className="relative group/input">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 transition-colors group-focus-within/input:text-blue-500" />
                        <input
                          type="text"
                          pattern="\d*"
                          inputMode="numeric"
                          placeholder="Enter Token Number"
                          value={searchToken}
                          onChange={(e) => {
                            setSearchToken(e.target.value);
                            setSearchError('');
                          }}
                          className={`w-full pl-10 pr-4 py-3 rounded-2xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-blue-500/25 transition-all font-sans ${
                            searchError
                              ? 'border-rose-450 bg-rose-50/10 text-rose-500'
                              : darkMode 
                                ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' 
                                : 'bg-slate-50 border-slate-200 text-slate-850 focus:border-blue-500 focus:bg-white focus:shadow-xs'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Quick validation banners */}
                    <AnimatePresence>
                      {searchError && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-semibold flex items-center gap-2"
                        >
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>{searchError}</span>
                        </motion.div>
                      )}

                      {searchSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Loading queue pass statistics...</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Track Button */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={searchSuccess}
                      className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/15 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Smartphone className="w-4.5 h-4.5" />
                      <span>Track Queue</span>
                    </motion.button>
                  </form>
                </div>

                {/* Additional UI: Beautiful informative helper cards containing stats dynamically */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`p-4.5 rounded-3.5xl border border-dashed select-none relative overflow-hidden ${
                    darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                  id="info-portal-card"
                >
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-3 block text-center">
                    💡 Clinic Telemetry Dashboard
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[9.5px] font-medium text-slate-450 dark:text-slate-500 block">Lounge Speed</span>
                      <div className="font-sans font-extrabold text-[13px] text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span>{averageWaitTime} min/avg</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9.5px] font-medium text-slate-450 dark:text-slate-500 block">Currently Serving</span>
                      <div className="font-sans font-extrabold text-[13px] text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <BellRing className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{currentToken}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9.5px] font-medium text-slate-450 dark:text-slate-500 block">People in Line</span>
                      <div className="font-sans font-extrabold text-[13px] text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-amber-500" />
                        <span>{waitingCount} waiting</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9.5px] font-medium text-slate-450 dark:text-slate-500 block">Dynamic Sync</span>
                      <div className="font-sans font-extrabold text-[13px] text-emerald-500 flex items-center gap-1">
                        <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                        <span>Active Updates</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              /* TAB 2: SIGN UP WALK IN PATIENT FORM */
              <motion.div
                key="tab-register-flow"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4 flex-1 flex flex-col justify-center"
              >
                <div className={`p-5 rounded-3.5xl border ${
                  darkMode 
                    ? 'bg-slate-900 border-slate-800' 
                    : 'bg-white border-slate-100 shadow-lg shadow-slate-100/50'
                }`}>
                  <form onSubmit={handleJoinQueue} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest pl-0.5">
                        Patient Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-xs transition-all ${
                          darkMode 
                            ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 Focus:bg-white shadow-2xs'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-455 uppercase tracking-widest pl-0.5">
                        Intake Reason
                      </label>
                      <select
                        value={registerPurpose}
                        onChange={(e) => setRegisterPurpose(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-xs transition-all cursor-pointer ${
                          darkMode 
                            ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                        }`}
                      >
                        <option value="General Consultation">Wellness Checkup & Consult</option>
                        <option value="Vaccine Intake / Jab">Flu Vaccine / Jab Intake</option>
                        <option value="Severe Migraine Check">Acute Pain or Migraine</option>
                        <option value="Knee Joint Physiotherapy">Sports Injury Treatment</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-455 uppercase tracking-widest pl-0.5 animate-pulse">
                        Care Priority
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: 'normal', label: 'Standard', desc: 'Routine visit' },
                          { key: 'urgent', label: 'Urgent Care', desc: 'Critical triage' }
                        ].map(lvl => (
                          <button
                            key={lvl.key}
                            type="button"
                            onClick={() => setRegisterPriority(lvl.key as PriorityLevel)}
                            className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                              registerPriority === lvl.key
                                ? lvl.key === 'urgent'
                                  ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'
                                  : 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                                : darkMode
                                  ? 'border-slate-850 bg-slate-955 text-slate-400 hover:border-slate-750'
                                  : 'border-slate-200 bg-slate-50 text-slate-550 hover:bg-slate-100 shadow-2xs'
                            }`}
                          >
                            <span className="text-xs font-bold">{lvl.label}</span>
                            <span className="text-[10px] opacity-75 mt-0.5">{lvl.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Admission notifications */}
                    <AnimatePresence>
                      {admissionSuccess && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="p-3 bg-emerald-500 text-white rounded-xl text-[11px] font-semibold flex items-center gap-2 justify-center"
                        >
                          <PartyPopper className="w-4 h-4" />
                          <span>Appointment booked! Entering live track...</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Registration button */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Receive Virtual Ticket</span>
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sticky Branding Footer */}
          <div className="pt-2 text-center select-none font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Queue Cure '26 • Real-time Triage v1.2
          </div>
        </div>
      )}
    </div>
  );
};
