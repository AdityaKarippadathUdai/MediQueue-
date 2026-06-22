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
  RotateCw,
  Clock,
  Users,
  BellRing,
  Sparkles,
  Calendar,
  Layers,
  HelpCircle,
  TrendingUp,
  Check,
  Compass,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Patient: React.FC = () => {
  // Support both :tokenId and :token route param variables for absolute safety and backward compatibility
  const { tokenId, token } = useParams<{ tokenId?: string; token?: string }>();
  const activeTokenId = token || tokenId;
  
  const navigate = useNavigate();
  
  const { 
    patients, 
    averageWaitTime, 
    currentToken: liveCurrentToken, 
    waitingCount,
    socketStatus,
    darkMode 
  } = useQueue();

  // Local storage recent tokens history key
  const RECENT_TOKENS_KEY = 'recentTrackedTokens_v2';

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

  // Load history from localStorage on mount (no mock token seeds)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_TOKENS_KEY);
      if (stored) {
        setRecentTokens(JSON.parse(stored));
      } else {
        setRecentTokens([]);
      }
    } catch (e) {
      console.warn('Could not load recent token history:', e);
    }
  }, []);

  // Helper to append a token to the history list (and restrict to last 5 unique)
  const saveToHistory = (tokenStr: string) => {
    try {
      const cleanToken = tokenStr.replace(/qc-/i, '').replace(/[^0-9]/g, '').trim();
      if (!cleanToken) return;

      const filtered = recentTokens.filter(t => t !== cleanToken);
      const updated = [cleanToken, ...filtered].slice(0, 5);
      setRecentTokens(updated);
      localStorage.setItem(RECENT_TOKENS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to token history:', e);
    }
  };

  // Find if there is a matching patient in the database
  const getMatchedPatient = (): PatientType | null => {
    if (!activeTokenId) return null;
    const cleanToken = activeTokenId.toUpperCase().trim();
    
    return patients.find(p => 
      p.ticketNumber.toUpperCase() === cleanToken || 
      p.ticketNumber.toUpperCase() === `QC-${cleanToken}` || 
      p.id === cleanToken ||
      p.ticketNumber.replace(/qc-/i, '') === cleanToken
    ) || null;
  };

  const matchedPatient = getMatchedPatient();

  // Save token to history if successfully tracking a token
  useEffect(() => {
    if (activeTokenId) {
      saveToHistory(activeTokenId);
    }
  }, [activeTokenId]);

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

  // Real-time live derived stats from clinic DB
  const currentLiveStatus: 'Waiting' | 'Being Called' | 'Completed' | 'Absent/No Show' | 'Inactive' = (() => {
    if (!matchedPatient) return 'Waiting';
    if (matchedPatient.status === 'calling') return 'Being Called';
    if (matchedPatient.status === 'completed') return 'Completed';
    if (matchedPatient.status === 'no-show') return 'Absent/No Show';
    return 'Waiting';
  })();

  const currentLiveServingToken: number = (() => {
    if (liveCurrentToken) {
      const cleanNum = parseInt(liveCurrentToken.replace(/qc-/i, '').replace(/[^0-9]/g, ''), 10);
      if (!isNaN(cleanNum)) return cleanNum;
    }
    if (activeTokenId) {
      const cleanTokenNum = parseInt(activeTokenId.replace(/qc-/i, '').replace(/[^0-9]/g, ''), 10);
      return Math.max(100, (cleanTokenNum || 104) - 4);
    }
    return 100;
  })();

  const currentLivePatientsAhead: number = (() => {
    if (!matchedPatient || matchedPatient.status !== 'waiting') return 0;
    return patientPos > 0 ? patientPos - 1 : 0;
  })();

  const currentLiveWaitMinutes: number = (() => {
    if (!matchedPatient || matchedPatient.status !== 'waiting') return 0;
    if (matchedPatient.estimatedWaitMinutes !== null && matchedPatient.estimatedWaitMinutes !== undefined) {
      return matchedPatient.estimatedWaitMinutes;
    }
    return patientPos * (averageWaitTime || 8);
  })();

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
  const handleQuickReopen = (tk: string) => {
    navigate(`/patient/${tk}`);
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
        console.warn('Real camera feed error or block. Fallback to simulator:', err);
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


  // Calculations for display times
  const getSimulatedEstimatedCallTime = () => {
    const now = new Date();
    if (matchedPatient) {
      const join = new Date(matchedPatient.joinedAt);
      join.setMinutes(join.getMinutes() + (matchedPatient.status === 'completed' ? 0 : currentLiveWaitMinutes));
      return join.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    now.setMinutes(now.getMinutes() + currentLiveWaitMinutes);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSimulatedJoinTimeFormatted = () => {
    if (matchedPatient) {
      return new Date(matchedPatient.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const now = new Date();
    now.setMinutes(now.getMinutes() - 20);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Generate the Step Sequence for Queue Progress visualizer e.g., 104 -> 105 -> ... -> 108
  const getProgressSteps = () => {
    if (!activeTokenId) return [];
    
    const trackerNum = parseInt(activeTokenId.replace(/qc-/i, '').replace(/[^0-9]/g, ''), 10) || 108;
    const startNum = currentLiveServingToken;

    if (startNum >= trackerNum) {
      return [trackerNum];
    }

    const diff = trackerNum - startNum;
    if (diff <= 4) {
      const steps = [];
      for (let i = startNum; i <= trackerNum; i++) {
        steps.push(i);
      }
      return steps;
    } else {
      // For larger difference, show: [Start, Start+1, '...', MyToken-1, MyToken]
      return [startNum, startNum + 1, '...', trackerNum - 1, trackerNum];
    }
  };

  const progressSteps = getProgressSteps();

  // Calculate percentage for progress fill
  const calculateProgressPercent = () => {
    if (currentLiveStatus === 'Completed') return 100;
    if (currentLiveStatus === 'Being Called') return 80;
    
    // Waiting: evaluate based on how close simulated current serving is to tracked token
    if (!activeTokenId) return 20;
    const trackerNum = parseInt(activeTokenId.replace(/qc-/i, '').replace(/[^0-9]/g, ''), 10) || 108;
    const startNum = currentLiveServingToken;
    if (startNum >= trackerNum) return 80;

    const currentDistance = trackerNum - startNum;
    const initialDistance = Math.max(currentDistance, 6); // normal scale
    const completedFraction = (initialDistance - currentDistance) / initialDistance;
    return Math.min(75, Math.max(25, Math.round(completedFraction * 100)));
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-3 pb-24 relative overflow-y-auto selection:bg-blue-500/20" id="patient-primary-portal">
      {/* Ambient background accent graphics */}
      <div className="absolute top-[-40px] right-[-30px] w-56 h-56 rounded-full bg-blue-500/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[40px] left-[-30px] w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

      {activeTokenId ? (
        /* ====================================================================
           ACTIVE TOKEN STANDBY DETAILS SCREEN (The Complete Interactive Suite)
           ==================================================================== */
        <AnimatePresence mode="wait">
          <motion.div
            key="tracking-details-panel"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="space-y-4"
          >
            {/* Header / Nav Elements */}
            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800 pb-3">
              <button 
                onClick={() => {
                  navigate('/patient');
                }}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors cursor-pointer group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span>Track New Token</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500">
                  Live Status
                </span>
              </div>
            </div>

            {/* MAIN CARD STACK */}
            <div className={`rounded-3xl border shadow-xl overflow-hidden transition-all ${
              darkMode 
                ? 'bg-slate-950 border-slate-800 hover:border-slate-700/80' 
                : 'bg-white border-slate-150 hover:shadow-2xl hover:shadow-slate-100/100'
            }`}>
              
              {/* STATUS BAR HEADER ACCENT */}
              <div className={`p-4 text-center transition-all relative ${
                currentLiveStatus === 'Being Called'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white'
                  : currentLiveStatus === 'Completed'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800'
              }`}>
                {/* Simulated status ribbon tag */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-xs bg-white/10 text-white">
                  {currentLiveStatus === 'Being Called' && <BellRing className="w-3.5 h-3.5 animate-bounce text-amber-300" />}
                  {currentLiveStatus === 'Completed' && <Check className="w-3.5 h-3.5 text-white" />}
                  {currentLiveStatus === 'Waiting' && <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />}
                  <span className={`${
                    currentLiveStatus === 'Waiting' ? 'text-slate-700 dark:text-slate-200' : ''
                  }`}>
                    {currentLiveStatus}
                  </span>
                </div>

                <div className="mt-4 flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                    My Token
                  </span>
                  <span className="font-mono text-5xl font-black tracking-tight select-all leading-tight mt-1">
                    QC-{activeTokenId.toUpperCase()}
                  </span>
                  <p className="text-[11px] font-medium opacity-80 mt-1">
                    Patient Name: <strong className="font-extrabold">{matchedPatient?.name || 'Walk-in / Standby Client'}</strong>
                  </p>
                </div>
              </div>

              {/* THREE COLUMN HIGHLIGHT METRICS (Patients Ahead / Estimated Wait) */}
              <div className="grid grid-cols-3 border-b border-slate-150 dark:border-slate-800/80">
                {/* Now Serving Column */}
                <div className="p-4 text-center border-r border-slate-150 dark:border-slate-800/80">
                  <span className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 block mb-1">
                    Now Serving
                  </span>
                  <strong className="font-mono text-lg font-black text-blue-600 dark:text-blue-400 animate-pulse">
                    QC-{currentLiveServingToken}
                  </strong>
                </div>

                {/* Patients Ahead Column */}
                <div className="p-4 text-center border-r border-slate-150 dark:border-slate-800/80">
                  <span className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 block mb-1">
                    Patients Ahead
                  </span>
                  <strong className="font-sans text-lg font-black text-slate-800 dark:text-white">
                    {currentLiveStatus === 'Waiting' ? currentLivePatientsAhead : 0}
                  </strong>
                </div>

                {/* Estimated Wait Column */}
                <div className="p-4 text-center">
                  <span className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 block mb-1">
                    Estimated Wait
                  </span>
                  <strong className="font-sans text-lg font-black text-emerald-500">
                    {currentLiveStatus === 'Waiting' ? `${currentLiveWaitMinutes}m` : '0m'}
                  </strong>
                </div>
              </div>

              <div className="p-5 space-y-6">
                
                {/* SECTION: Queue Progress Visualization */}
                <div className="space-y-3.5" id="queue-progress-display">
                  <div className="flex justify-between items-center px-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span>Queue Progress</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      Current Token: {currentLiveServingToken} of {activeTokenId}
                    </span>
                  </div>

                  {/* Node Stepper Trail */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-150 dark:border-slate-800/60 space-y-4">
                    <div className="flex items-center justify-between relative px-2">
                      {/* Connection Line Behind */}
                      <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-800 z-0 rounded-full overflow-hidden">
                        <motion.div 
                           initial={{ width: '0%' }}
                           animate={{ width: `${calculateProgressPercent()}%` }}
                           transition={{ duration: 0.6, ease: 'easeInOut' }}
                           className="h-full bg-blue-600 rounded-full" 
                        />
                      </div>

                      {/* Map through Progress Steps */}
                      {progressSteps.map((stepNum, idx) => {
                        const isNumber = typeof stepNum === 'number';
                        const isCurrent = isNumber && stepNum === currentLiveServingToken;
                        const isMyToken = isNumber && String(stepNum) === activeTokenId.replace(/qc-/i, '');
                        const isPassed = isNumber && stepNum < currentLiveServingToken;

                        return (
                          <div key={idx} className="flex flex-col items-center relative z-10">
                            <motion.div
                              whileHover={isNumber ? { scale: 1.15 } : {}}
                              className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-[10px] font-mono font-black transition-all border ${
                                isPassed
                                  ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-300'
                                  : isCurrent
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/30'
                                    : isMyToken
                                      ? 'bg-indigo-100 border-indigo-400 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-400 font-extrabold'
                                      : !isNumber
                                        ? 'bg-transparent border-transparent text-slate-400'
                                        : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-800'
                              }`}
                            >
                              {isPassed ? (
                                <Check className="w-3 h-3 text-blue-600 dark:text-blue-300" />
                              ) : (
                                <span>{isNumber ? stepNum : '...'}</span>
                              )}
                            </motion.div>
                            {isNumber && (
                              <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-tight">
                                {isCurrent ? 'Now' : isMyToken ? 'Mine' : ''}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick progress percent loader */}
                    <div className="flex justify-between items-center text-[9px] font-semibold text-slate-400 px-1">
                      <span>In-Processing Progress</span>
                      <span>{calculateProgressPercent()}% Completed</span>
                    </div>
                  </div>
                </div>

                {/* SECTION: Queue Timeline */}
                <div className="space-y-3.5" id="queue-timeline-display">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>Queue Timeline</span>
                  </span>

                  <div className="space-y-3.5 pl-2 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                    
                    {/* Item 1: Token Generated */}
                    <div className="flex items-start gap-4 text-left relative">
                      <div className="w-5.5 h-5.5 rounded-full bg-emerald-500 border border-emerald-500 text-white flex items-center justify-center flex-shrink-0 z-10 shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h5 className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200">
                          ✓ Token Generated
                        </h5>
                        <p className="text-[9.5px] text-slate-400 mt-0.5 leading-normal">
                          Walk-in checklist verified at {getSimulatedJoinTimeFormatted()}
                        </p>
                      </div>
                    </div>

                    {/* Item 2: Waiting In Queue */}
                    <div className="flex items-start gap-4 text-left relative">
                      <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center flex-shrink-0 z-10 border transition-all ${
                        currentLiveStatus === 'Waiting' || currentLiveStatus === 'Being Called' || currentLiveStatus === 'Completed'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-white border-slate-200 text-slate-450 dark:bg-slate-900 dark:border-slate-800'
                      }`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h5 className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200">
                          ✓ Waiting In Queue
                        </h5>
                        <p className="text-[9.5px] text-slate-400 mt-0.5 leading-normal">
                          Priority sorted. Diagnostics pending active standby line.
                        </p>
                      </div>
                    </div>

                    {/* Item 3: Being Called */}
                    <div className="flex items-start gap-4 text-left relative">
                      <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center flex-shrink-0 z-10 border transition-all ${
                        currentLiveStatus === 'Being Called' || currentLiveStatus === 'Completed'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800'
                      }`}>
                        {currentLiveStatus === 'Being Called' ? (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                          </span>
                        ) : currentLiveStatus === 'Completed' ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <span className="text-[8px] font-bold">3</span>
                        )}
                      </div>
                      <div>
                        <h5 className={`text-[11.5px] font-extrabold ${
                          currentLiveStatus === 'Being Called' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {currentLiveStatus === 'Being Called' ? '🛎️ Being Called Now' : '○ Being Called'}
                        </h5>
                        <p className="text-[9.5px] text-slate-400 mt-0.5 leading-normal">
                          {currentLiveStatus === 'Being Called' 
                            ? 'Please proceed immediately to Consulting Room B.' 
                            : 'Patient called by clinician for face-to-face diagnosis.'}
                        </p>
                      </div>
                    </div>

                    {/* Item 4: Consultation Complete */}
                    <div className="flex items-start gap-4 text-left relative">
                      <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center flex-shrink-0 z-10 border transition-all ${
                        currentLiveStatus === 'Completed'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800'
                      }`}>
                        {currentLiveStatus === 'Completed' ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <span className="text-[8px] font-bold">4</span>
                        )}
                      </div>
                      <div>
                        <h5 className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200">
                          ○ Consultation Complete
                        </h5>
                        <p className="text-[9.5px] text-slate-400 mt-0.5 leading-normal">
                          Medical treatment completed, prescription generated.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* SECTION: My Queue Information (Additional Section requested) */}
                <div className="space-y-3.5 pt-1.5" id="my-queue-information-section">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-indigo-500" />
                    <span>My Queue Information</span>
                  </span>

                  <div className={`p-4 rounded-2.5xl border grid grid-cols-2 gap-3.5 text-left ${
                    darkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50 border-slate-200/80'
                  }`}>
                    <div>
                      <span className="text-[8.5px] font-bold text-slate-400 block uppercase">
                        Token Number
                      </span>
                      <strong className="text-sm font-mono font-black text-slate-800 dark:text-slate-100 block mt-0.5">
                        QC-{activeTokenId.toUpperCase()}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[8.5px] font-bold text-slate-400 block uppercase">
                        Join Time
                      </span>
                      <strong className="text-sm font-sans font-black text-slate-800 dark:text-slate-100 block mt-0.5">
                        {getSimulatedJoinTimeFormatted()}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[8.5px] font-bold text-slate-400 block uppercase">
                        Queue Position
                      </span>
                      <strong className="text-sm font-sans font-black text-slate-800 dark:text-slate-100 block mt-0.5">
                        #{patientPos}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[8.5px] font-bold text-slate-400 block uppercase">
                        Est. Call Time
                      </span>
                      <strong className="text-sm font-sans font-black text-emerald-505 block mt-0.5">
                        {getSimulatedEstimatedCallTime()}
                      </strong>
                    </div>
                  </div>
                </div>

              </div>
            </div>



            {/* QUICK PASSPORT SWITCHER Pill Bar */}
            {recentTokens.length > 0 && (
              <div className={`p-4 rounded-3xl border border-dashed text-left ${
                darkMode ? 'bg-slate-900/40 border-slate-850' : 'bg-slate-50 border-slate-150'
              }`}>
                <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
                  <History className="w-3.5 h-3.5 text-blue-500" />
                  <span>Recently Viewed Passes</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentTokens.map(tk => (
                    <button
                      key={tk}
                      onClick={() => handleQuickReopen(tk)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        (tk === activeTokenId || `qc-${tk}` === activeTokenId.toLowerCase())
                          ? 'bg-blue-600 text-white'
                          : darkMode
                            ? 'bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-350'
                            : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-750 shadow-3xs'
                      }`}
                    >
                      <span className={(tk === activeTokenId || `qc-${tk}` === activeTokenId.toLowerCase()) ? 'text-white' : 'text-blue-500'}>QC-{tk}</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Spacer branding footer */}
            <div className="text-center pt-3 select-none font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Queue Cure '26 • Real-time Terminal
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        /* ====================================================================
           PORTAL VIEW (Home tracking landing console)
           ==================================================================== */
        <motion.div
          key="portal-landing-console"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 flex-1 flex flex-col justify-between"
        >
          {/* Brand header */}
          <div className="text-center pt-4 pb-2">
            <div className="inline-flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-bold tracking-tight mb-2 uppercase">
              <Heart className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />
              <span>Queue Cure '26</span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-500">Standby Lounge</span>
            </div>

            <h2 className="font-sans font-extrabold text-[22px] text-slate-900 dark:text-white tracking-tight">
              Track Your Queue
            </h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 max-w-[310px] mx-auto mt-1 leading-relaxed">
              Enter your token number or scan the QR code provided by the receptionist.
            </p>
          </div>

          {/* Manual input ticket form */}
          <div className={`p-5 rounded-3.5xl border transition-all ${
            darkMode 
              ? 'bg-slate-900 border-slate-800 shadow-xl' 
              : 'bg-white border-slate-150 shadow-md'
          }`}
          id="patient-manual-card"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-3 pl-0.5">
              Enter Ticket Number
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
                        : 'bg-slate-50 border-slate-205 text-slate-800 focus:bg-white focus:border-blue-500 shadow-2xs'
                  }`}
                />
              </div>

              {/* Feedbacks */}
              <AnimatePresence>
                {searchError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10.5px] font-bold flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                    <span>{searchError}</span>
                  </motion.div>
                )}

                {searchSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10.5px] font-bold flex items-center justify-center gap-2 animate-pulse"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                    <span>Locating live token...</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Submit */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={searchSuccess}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 text-xs font-extrabold shadow-md shadow-blue-500/15 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Smartphone className="w-4 h-4" />
                <span>Track Queue</span>
              </motion.button>
            </form>
          </div>

          {/* Divider */}
          <div className="flex items-center text-center justify-center select-none py-1">
            <div className="h-[1px] w-20 bg-slate-200 dark:bg-slate-800" />
            <span className="mx-3 font-mono text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
              OR
            </span>
            <div className="h-[1px] w-20 bg-slate-200 dark:bg-slate-800" />
          </div>

          <div className={`p-4.5 rounded-3.5xl border transition-all ${
            darkMode 
              ? 'bg-slate-900 border-slate-800 shadow-xl' 
              : 'bg-white border-slate-150 shadow-md'
          }`}
          id="patient-qr-card"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <Scan className="w-5.5 h-5.5" />
              </div>
              <div className="text-left">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Scan QR Code
                </h3>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  Aim at the barcoded ticket on your receipt or registration screen.
                </p>
              </div>
            </div>

            {/* Launch Scanner Viewfinder */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsScannerOpen(true);
                startCamera();
              }}
              className={`w-full py-3 rounded-2xl border font-bold text-xs mt-3.5 flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                darkMode
                  ? 'border-slate-800 bg-slate-950 hover:bg-slate-900 text-white'
                  : 'border-slate-205 bg-slate-50 hover:bg-slate-100 text-slate-750'
              }`}
            >
              <Camera className="w-4.5 h-4.5 text-blue-500" />
              <span>Open Scanner Feed</span>
            </motion.button>
          </div>

          {/* Recently Tracked History Panel */}
          {recentTokens.length > 0 && (
            <div className={`p-4 rounded-3.5xl border border-dashed text-left ${
              darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
                <History className="w-3.5 h-3.5 text-blue-500" />
                <span>Recently Tracked Tickets</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentTokens.map(tk => (
                  <button
                    key={tk}
                    onClick={() => handleQuickReopen(tk)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      darkMode
                        ? 'bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white'
                        : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-750'
                    }`}
                  >
                    <span className="font-mono text-blue-500">QC-{tk}</span>
                    <ChevronRight className="w-3 h-3 text-slate-405" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Branding footer */}
          <div className="pt-2 text-center select-none font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Queue Cure '26 • Portal v1.2
          </div>
        </motion.div>
      )}

      {/* -----------------------------------------------------
          MODAL: CAMERA VIEWPORT SCENE (WITH DIRECT TEST SCAN CLICKS)
          ----------------------------------------------------- */}
      <AnimatePresence>
        {isScannerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-md flex flex-col justify-between p-6 select-none"
            id="camera-viewfinder-overlay"
          >
            {/* Viewfinder header */}
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

            {/* Viewfinder frame */}
            <div className="flex-1 flex flex-col justify-center items-center my-6">
              <div className="relative w-full max-w-[280px] aspect-square rounded-3xl overflow-hidden border-2 border-white/25 shadow-2xl bg-black">
                
                {/* Scanner Frame View finder targets */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-md z-20" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-md z-20" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-md z-20" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-md z-20" />

                {/* Scan Animation laser effect */}
                {scannerState === 'active' && (
                  <div className="absolute inset-x-0 h-[3px] bg-blue-500 shadow-[0_0_15px_#3b82f6] z-20 top-[40%] animate-bounce" />
                )}

                {/* HTML5 video tag */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    scannerState === 'active' ? 'opacity-70' : 'opacity-0'
                  }`}
                />

                {/* Overlay Text / Graphics for status */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center z-10 bg-black/45">
                  {scannerState === 'permission_request' && (
                    <div className="space-y-3 animate-pulse">
                      <div className="p-3.5 rounded-2xl bg-blue-500/20 text-blue-400 inline-flex">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-white font-bold text-xs">Authorize Camera Access</p>
                    </div>
                  )}

                  {scannerState === 'loading' && (
                    <div className="space-y-2">
                      <RefreshCw className="w-5 h-5 text-blue-400 animate-spin mx-auto" />
                      <p className="text-white font-bold text-[11px] uppercase tracking-wider">Acquiring feed...</p>
                    </div>
                  )}

                  {scannerState === 'denied' && (
                    <div className="space-y-3 p-2">
                      <XCircle className="w-7 h-7 text-rose-500 mx-auto" />
                      <p className="text-white font-bold text-xs">Authorization Blocked</p>
                      <p className="text-slate-400 text-[9.5px]">
                        Please check browser settings or use fallback buttons below!
                      </p>
                    </div>
                  )}

                  {scannerState === 'active' && (
                    <div className="absolute bottom-4 left-0 right-0 text-center text-white font-bold text-[9px] tracking-widest uppercase">
                      Center Ticket barcode to capture
                    </div>
                  )}

                  {scannerState === 'success' && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-2"
                    >
                      <div className="p-3 rounded-full bg-emerald-500 text-white inline-flex">
                        <Check className="w-6 h-6" />
                      </div>
                      <p className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Ticket Detected</p>
                      <p className="text-white font-bold text-sm">Directing Live Status...</p>
                    </motion.div>
                  )}

                  {scannerState === 'error' && (
                    <div className="space-y-2 p-2">
                      <XCircle className="w-7 h-7 text-rose-400 mx-auto" />
                      <p className="text-white font-bold text-xs">Camera feed unavailable</p>
                      <p className="text-slate-405 text-[9px] leading-relaxed">
                        Could not access camera. Please check browser permissions and try again.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="text-center">
              <button
                onClick={closeCameraScanner}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer font-semibold"
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
