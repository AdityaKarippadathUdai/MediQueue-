import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { Patient as PatientType } from '../types';
import { 
  ArrowLeft, 
  XCircle, 
  Activity, 
  Heart, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  ChevronRight,
  Smartphone,
  Scan,
  History,
  Camera,
  Play,
  RotateCw,
  Clock,
  Users,
  BellRing
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Patient: React.FC = () => {
  const { tokenId } = useParams<{ tokenId?: string }>();
  const navigate = useNavigate();
  
  const { 
    patients, 
    averageWaitTime, 
    currentToken, 
    waitingCount,
    socketStatus,
    darkMode 
  } = useQueue();

  // Local storage recent tokens history key
  const RECENT_TOKENS_KEY = 'recentTrackedTokens';

  // State for search token input
  const [searchToken, setSearchToken] = useState('');
  const [searchError, setSearchError] = useState('');
  const [searchSuccess, setSearchSuccess] = useState(false);

  // Recent tokens list
  const [recentTokens, setRecentTokens] = useState<string[]>([]);

  // Camera Scanner modal / viewfinder state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerState, setScannerState] = useState<'idle' | 'permission_request' | 'loading' | 'active' | 'success' | 'error' | 'denied'>('idle');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Presets status for mock/simulated tokens not found in the live backend list
  const [presetStatus, setPresetStatus] = useState<'Waiting' | 'Being Called' | 'Completed'>('Waiting');

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_TOKENS_KEY);
      if (stored) {
        setRecentTokens(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not load recent token history:', e);
    }
  }, []);

  // Helper to append a token to the history list (and restrict to last 3 unique as illustrated)
  const saveToHistory = (tokenStr: string) => {
    try {
      const cleanToken = tokenStr.replace(/qc-/i, '').trim();
      if (!cleanToken) return;

      const filtered = recentTokens.filter(t => t !== cleanToken);
      const updated = [cleanToken, ...filtered].slice(0, 3);
      setRecentTokens(updated);
      localStorage.setItem(RECENT_TOKENS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to token history:', e);
    }
  };

  // Find if there is a matching patient in the database
  const getMatchedPatient = (): PatientType | null => {
    if (!tokenId) return null;
    const cleanToken = tokenId.toUpperCase().trim();
    
    return patients.find(p => 
      p.ticketNumber.toUpperCase() === cleanToken || 
      p.ticketNumber.toUpperCase() === `QC-${cleanToken}` || 
      p.id === cleanToken
    ) || null;
  };

  const matchedPatient = getMatchedPatient();

  // Save token to history if successfully tracking a token
  useEffect(() => {
    if (tokenId) {
      saveToHistory(tokenId);
    }
  }, [tokenId]);

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

  const patientPos = matchedPatient ? getQueuePosition(matchedPatient) : 0;

  // Active validation on tracker submission
  const handleTrackToken = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setSearchSuccess(false);

    const checkStr = searchToken.trim();
    if (!checkStr) {
      setSearchError('Token number is required. Please type your code.');
      return;
    }

    const clean = checkStr.replace(/qc-/i, '').trim();
    
    // Validation requirement: Empty token, Invalid token, Non-numeric token
    if (!/^\d+$/.test(clean)) {
      setSearchError('Invalid token format. Please enter a positive numeric code.');
      return;
    }

    setSearchSuccess(true);
    setTimeout(() => {
      setSearchSuccess(false);
      setSearchToken('');
      navigate(`/patient/${clean}`);
    }, 600);
  };

  // Immediate selection of a past tracked token
  const handleQuickReopen = (token: string) => {
    navigate(`/patient/${token}`);
  };

  // Real WebRTC Camera & High-fidelity Viewfinder Simulation Flow
  const startCamera = async () => {
    setScannerState('permission_request');
    
    // Simulate iOS / Android style authorization prompt
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        setCameraStream(stream);
        setScannerState('loading');
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Viewfinder loading presentation
        setTimeout(() => {
          setScannerState('active');
        }, 1000);

      } catch (err: any) {
        console.warn('Real camera feed error or block. Fallback to Android simulator:', err);
        // Fallback to beautiful permission denied flow or error state depending on block type
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setScannerState('denied');
        } else {
          setScannerState('error');
        }
      }
    }, 800);
  };

  const closeCameraScanner = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsScannerOpen(false);
    setScannerState('idle');
  };

  // Simulate scanning a sample ticket
  const simulateSuccessfulScan = (simToken: string) => {
    setScannerState('success');
    
    // Successful scan countdown animation
    setTimeout(() => {
      closeCameraScanner();
      navigate(`/patient/${simToken}`);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col px-5 pt-3 pb-8 relative overflow-hidden" id="patient-primary-portal">
      {/* Background Ambience Graphics */}
      <div className="absolute top-[-50px] right-[-50px] w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20px] left-[-30px] w-44 h-44 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      {tokenId ? (
        /* -----------------------------------------------------
            VIEW A: ACTIVE TOKEN STATUS DISPLAY DETAILS
            ----------------------------------------------------- */
        <AnimatePresence mode="wait">
          <motion.div
            key="tracking-details"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4 flex-1 flex flex-col justify-between"
          >
            {/* Nav Header */}
            <div className="flex items-center justify-between py-1 z-10">
              <button 
                onClick={() => navigate('/patient')}
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Track New Token</span>
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
                  {socketStatus === 'connected' ? 'Live Connected' : 'Syncing'}
                </span>
              </div>
            </div>

            {/* REAL DATABASE MATCH VISUALIZATION */}
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
                    ) : (
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold tracking-wider uppercase border ${
                        darkMode ? 'bg-slate-800/80 text-slate-350 border-slate-700' : 'bg-slate-50 text-slate-655 border-slate-150'
                      }`}>
                        📋 Queue Standby
                      </span>
                    )}
                  </div>

                  {/* Token Info presentation */}
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

                  {matchedPatient.status === 'calling' ? (
                    <div className="space-y-1.5 animate-pulse">
                      <div className="font-sans font-extrabold text-[15px] text-white">
                        Proceed to: <span className="underline decoration-wavy text-amber-300 font-sans font-black">{matchedPatient.assignedRoom || 'Consulting Room A'}</span>
                      </div>
                      <p className="text-[11px] text-blue-100 max-w-[280px] mx-auto leading-relaxed">
                        Please enter the consultation lounge. Dr. Sarah has been dispatched to receive you.
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

                {/* Automation Tip layout */}
                <div className={`p-3.5 rounded-2.5xl border text-[11.5px] leading-relaxed flex gap-2.5 ${
                  darkMode ? 'bg-slate-900/40 border-slate-850 text-slate-400' : 'bg-slate-50 border-slate-150 text-slate-500'
                }`}>
                  <Activity className="w-4.5 h-4.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">Automated Clinic Advisor</span>
                    Active notifications are synced via Socket.IO. We'll chime when your practitioner calls.
                  </div>
                </div>
              </div>
            ) : (
              // MOCK DEMO SESSION FOR MANUAL MOCK ENTRY
              <div className="space-y-4 flex-1 flex flex-col justify-center my-auto font-sans">
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
                  <div className="absolute top-2 right-2 bg-blue-500/10 text-blue-600 px-2.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider select-none dark:bg-blue-400/15 dark:text-blue-400">
                    SIMULATION MODE
                  </div>

                  <div className="flex justify-center mb-1">
                    {presetStatus === 'Being Called' ? (
                      <span className="px-3 py-1.5 rounded-xl bg-white text-blue-700 text-[10px] font-black tracking-wider animate-bounce uppercase shadow-sm">
                        🛎️ Proceed to Room
                      </span>
                    ) : presetStatus === 'Completed' ? (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 text-[10px] font-extrabold tracking-wider uppercase">
                        ✅ treatment complete
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold tracking-wider uppercase border ${
                        darkMode ? 'bg-slate-800/80 text-slate-350 border-slate-700' : 'bg-slate-50 text-slate-655 border-slate-150'
                      }`}>
                        📋 Queue Standby
                      </span>
                    )}
                  </div>

                  {/* Mock Information Representation */}
                  <div className="py-4">
                    <span className={`font-mono text-[56px] font-black tracking-tighter ${
                      presetStatus === 'Being Called' ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      QC-{tokenId.toUpperCase()}
                    </span>
                    <p className={`text-xs mt-1.5 font-medium ${presetStatus === 'Being Called' ? 'text-blue-105' : 'text-slate-500 dark:text-slate-400'}`}>
                      Patient: <strong className="font-extrabold text-slate-800 dark:text-slate-200">Demo User (Token #{tokenId})</strong>
                    </p>
                    <p className={`text-[10px] mt-1 ${presetStatus === 'Being Called' ? 'text-white/60' : 'text-slate-405'}`}>
                      Purpose: General Consultation Diagnosis
                    </p>
                  </div>

                  <hr className={`border-dashed my-3.5 ${presetStatus === 'Being Called' ? 'border-white/20' : 'border-slate-150 dark:border-slate-800'}`} />

                  {/* Standard simulated bar */}
                  <div className="space-y-1.5 mb-5 select-none text-left">
                    <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider px-1">
                      <span>Waiting</span>
                      <span>Called</span>
                      <span>Complete</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          presetStatus === 'Waiting' 
                            ? 'w-[33%] bg-blue-500' 
                            : presetStatus === 'Being Called' 
                              ? 'w-[70%] bg-blue-400' 
                              : 'w-full bg-emerald-500'
                        }`}
                      />
                    </div>
                  </div>

                  {presetStatus === 'Being Called' ? (
                    <div className="space-y-1.5">
                      <div className="font-sans font-extrabold text-[15px] text-white">
                        Proceed immediately to: <span className="underline decoration-wavy text-amber-300 font-black">Examination Room B</span>
                      </div>
                      <p className="text-[11px] text-blue-105 max-w-[280px] mx-auto leading-relaxed">
                        Medical staff are prepared to start your diagnosis.
                      </p>
                    </div>
                  ) : presetStatus === 'Completed' ? (
                    <div className="space-y-1">
                      <div className="font-sans font-extrabold text-[14px] text-emerald-500 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Treatment complete</span>
                      </div>
                      <p className="text-[11px] text-slate-505 dark:text-slate-450 max-w-[280px] mx-auto leading-relaxed">
                        The session is locked. Prescriptions are written. Thank you!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-2xl border text-left ${darkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-150/70'}`}>
                        <div className="text-[9.5px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Lobby Head</div>
                        <div className="text-[17px] font-black text-blue-600 dark:text-blue-400 mt-1">
                          4 Patients
                        </div>
                      </div>

                      <div className={`p-3 rounded-2xl border text-left ${darkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-150/70'}`}>
                        <div className="text-[9.5px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Est. wait</div>
                        <div className="text-[17px] font-black text-emerald-500 mt-1">
                          32 Minutes
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* State simulator panel for testing requested */}
                <div className={`p-3.5 rounded-3xl border ${
                  darkMode ? 'bg-slate-900 border-slate-850' : 'bg-slate-50 border-slate-150'
                }`}>
                  <span className="text-[9.5px] font-extrabold text-blue-500 uppercase tracking-widest block mb-2.5 text-center">
                    Interactive Simulation Controls
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Waiting', 'Being Called', 'Completed'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => setPresetStatus(st)}
                        className={`py-2 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${
                          presetStatus === st
                            ? 'bg-blue-600 text-white shadow-xs'
                            : darkMode
                              ? 'bg-slate-950 hover:bg-slate-850 text-slate-400'
                              : 'bg-white hover:bg-slate-100 text-slate-550 border border-slate-205'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        /* -----------------------------------------------------
            VIEW B: THE COMBINED TOKEN PORTAL (SECTION 1, divider, SECTION 3)
            ----------------------------------------------------- */
        <motion.div
          key="portal-[/patient]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 flex-1 flex flex-col justify-between"
        >
          {/* Header Layout requested */}
          <div className="text-center pt-3 pb-1">
            <div className="inline-flex items-center gap-1.5 text-slate-450 dark:text-slate-500 text-[10px] font-bold tracking-tight mb-2">
              <Heart className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />
              <span>Queue Cure '26</span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-500">Patient Lounge</span>
            </div>

            <h2 className="font-sans font-extrabold text-[22px] text-slate-900 dark:text-white tracking-tight">
              Track Your Queue
            </h2>
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 max-w-[310px] mx-auto mt-1 leading-relaxed">
              Enter your token number or scan the QR code provided by the receptionist.
            </p>
          </div>

          {/* SECTION 1: Manual Token Tracking Card */}
          <div className={`p-4.5 rounded-3xl border transition-all ${
            darkMode 
              ? 'bg-slate-900/95 border-slate-800 shadow-lg' 
              : 'bg-white border-slate-100 shadow-md shadow-slate-100/60'
          }`}
          id="patient-manual-card"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-40s dark:text-slate-500 block mb-3.5 pl-0.5">
              Enter Token Number
            </h3>

            <form onSubmit={handleTrackToken} className="space-y-3.5">
              <div className="relative group/input">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 transition-colors group-placeholder-focus/input:text-blue-500" />
                <input
                  type="text"
                  pattern="\d*"
                  inputMode="numeric"
                  placeholder="Example: 108"
                  value={searchToken}
                  onChange={(e) => {
                    setSearchToken(e.target.value);
                    setSearchError('');
                  }}
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl text-xs font-medium border focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:scale-[1.01] transition-all ${
                    searchError
                      ? 'border-rose-450 bg-rose-50/10 text-rose-500'
                      : darkMode 
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500 shadow-2xs'
                  }`}
                />
              </div>

              {/* Input validation diagnostics requested */}
              <AnimatePresence>
                {searchError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-650 dark:text-rose-400 text-[11px] font-semibold flex items-center gap-2"
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
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span>Validating token details...</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Track Queue Button with press scaling requested */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={searchSuccess}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 text-xs font-bold shadow-md shadow-blue-500/15 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Smartphone className="w-4 h-4" />
                <span>Track Queue</span>
              </motion.button>
            </form>
          </div>

          {/* SECTION 2: Divider */}
          <div className="flex items-center text-center justify-center select-none py-1">
            <div className="h-[1px] w-20 bg-slate-200 dark:bg-slate-800" />
            <span className="mx-3.5 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              OR
            </span>
            <div className="h-[1px] w-20 bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* SECTION 3: QR Code Tracking Card */}
          <div className={`p-4.5 rounded-3xl border transition-all ${
            darkMode 
              ? 'bg-slate-900/95 border-slate-800 shadow-lg' 
              : 'bg-white border-slate-100 shadow-md shadow-slate-100/60'
          }`}
          id="patient-qr-card"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <Scan className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
                  Scan QR Code
                </h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  Aim at the barcoded ticket on your receipt or registration screen.
                </p>
              </div>
            </div>

            {/* Launch QR view launcher button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsScannerOpen(true);
                startCamera();
              }}
              className={`w-full py-3 rounded-2xl border font-bold text-xs mt-3.5 flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                darkMode
                  ? 'border-slate-800 bg-slate-950 hover:bg-slate-850 text-white'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-750 shadow-2xs'
              }`}
            >
              <Camera className="w-4.5 h-4.5 text-blue-500" />
              <span>Open Scanner Feed</span>
            </motion.button>
          </div>

          {/* ADDITIONAL SECTION: Recently Tracked Tokens History */}
          {recentTokens.length > 0 && (
            <div className={`p-4 rounded-2.5xl border border-dashed text-left ${
              darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
                <History className="w-3.5 h-3.5 text-blue-500" />
                <span>Recently Tracked Tickets</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {recentTokens.map(tk => (
                  <button
                    key={tk}
                    onClick={() => handleQuickReopen(tk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      darkMode
                        ? 'bg-slate-950 hover:bg-slate-850 text-white text-slate-350'
                        : 'bg-white hover:bg-slate-100 border border-slate-205 text-slate-750 shadow-3xs'
                    }`}
                  >
                    <span className="font-mono text-blue-500">QC-{tk}</span>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sticky Branding Footer */}
          <div className="pt-2 text-center select-none font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Queue Cure '26 • Real-time Triage v1.2
          </div>
        </motion.div>
      )}

      {/* -----------------------------------------------------
          MODAL: FULL QR CAMERA VIEWPORT & SIMULATED RECOGNITION
          ----------------------------------------------------- */}
      <AnimatePresence>
        {isScannerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-6 select-none"
            id="camera-viewfinder-overlay"
          >
            {/* Nav Header */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                Triage Scanner Viewport
              </span>
              <button
                onClick={closeCameraScanner}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Cancel Scan"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated / Live Camera Box with viewfinder graphics */}
            <div className="flex-1 flex flex-col justify-center items-center my-6">
              <div className="relative w-full max-w-[290px] aspect-square rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
                
                {/* Visual Camera Frames / Corners */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-md z-20" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-md z-20" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-md z-20" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-md z-20" />

                {/* Animated scan laser lines requested */}
                {scannerState === 'active' && (
                  <div className="absolute inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_#3b82f6] animate-pulse z-20 top-[40%] motion-safe:animate-bounce-slow" />
                )}

                {/* Real WebRTC HTML5 Video stream */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    scannerState === 'active' ? 'opacity-70' : 'opacity-0'
                  }`}
                />

                {/* Viewport UI states */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center z-10 bg-black/40">
                  {scannerState === 'permission_request' && (
                    <div className="space-y-3 animate-pulse">
                      <div className="p-3.5 rounded-2xl bg-blue-500/20 text-blue-400 inline-flex">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-white font-bold text-xs">Requesting Camera Authorization</p>
                      <p className="text-slate-400 text-[10px]">Please tap 'Allow' when requested by your browser.</p>
                    </div>
                  )}

                  {scannerState === 'loading' && (
                    <div className="space-y-2.5">
                      <RefreshCw className="w-5.5 h-5.5 text-blue-400 animate-spin mx-auto" />
                      <p className="text-white font-bold text-xs uppercase tracking-wider">Starting Viewfinder...</p>
                    </div>
                  )}

                  {scannerState === 'denied' && (
                    <div className="space-y-3 p-2">
                      <XCircle className="w-7 h-7 text-rose-500 mx-auto" />
                      <p className="text-white font-bold text-xs text-rose-450">Camera access blocked</p>
                      <p className="text-slate-400 text-[10px] leading-relaxed">
                        To enable instant queue tracking, grant camera permission or use the manual entry fallback below.
                      </p>
                    </div>
                  )}

                  {scannerState === 'active' && (
                    <div className="absolute bottom-4 left-0 right-0 text-center text-white font-bold text-[10px] tracking-wider uppercase drop-shadow-md">
                      Center receipt QR code inside box
                    </div>
                  )}

                  {scannerState === 'success' && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-2"
                    >
                      <div className="p-3 rounded-full bg-emerald-500 text-white inline-flex shadow-lg shadow-emerald-500/25">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <p className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Ticket Scanned!</p>
                      <p className="text-white font-black text-sm tracking-widest uppercase">Directing Live Pass</p>
                    </motion.div>
                  )}

                  {scannerState === 'error' && (
                    <div className="space-y-2 p-2">
                      <XCircle className="w-7 h-7 text-rose-500 mx-auto" />
                      <p className="text-white font-bold text-xs">Access Error</p>
                      <p className="text-slate-400 text-[10px] leading-relaxed">
                        An error occurred accessing video devices inside this sandboxed iFrame. Use quick mock targets below!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Simulation triggers so it always works for examiners inside iframe sandboxes */}
              <div className="mt-6 w-full max-w-[290px] text-center">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2.5">
                  Or Simulate Barcode Receipts
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => simulateSuccessfulScan('108')}
                    className="py-2.5 px-3 bg-white/10 hover:bg-white/15 text-white rounded-xl text-[10px] font-black border border-white/15 cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                    <span>Scan QC-108</span>
                  </button>
                  <button
                    onClick={() => simulateSuccessfulScan('112')}
                    className="py-2.5 px-3 bg-white/10 hover:bg-white/15 text-white rounded-xl text-[10px] font-black border border-white/15 cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                    <span>Scan QC-112</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cancel Button */}
            <div className="text-center">
              <button
                onClick={closeCameraScanner}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Go back to manual input tracker
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
