import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { Patient, PriorityLevel } from '../types';
import {
  Users, UserPlus, Volume2, CheckCircle2, UserX, AlertCircle,
  Trash2, Plus, ArrowRight, UserCheck, ShieldAlert, Sparkles, Clock, BarChart2,
  Copy, Share2, Printer, Download, QrCode, Check, Smartphone, ExternalLink, Link,
  ArrowLeft, ClipboardCheck, Sliders, Settings, RotateCw, Play, VolumeX, Eye, Monitor,
  Activity, Bell, ChevronRight, Calendar, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InstallAppCard } from '../components/PWAInstallComponents';

// Activity Interface
interface ActivityLog {
  id: string;
  text: string;
  time: string;
  type: 'add' | 'call' | 'complete' | 'absent' | 'system';
}

// Simple clean metric value wrapper with a subtle key-based trigger animation
const ValueMotion: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AnimatePresence mode="wait">
    <motion.span
      key={String(children)}
      initial={{ opacity: 0, y: 10, scale: 0.93 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.93 }}
      transition={{ duration: 0.18 }}
      className="inline-block"
    >
      {children}
    </motion.span>
  </AnimatePresence>
);

export const Receptionist: React.FC = () => {
  const navigate = useNavigate();
  const {
    patients, receptionist, logoutReceptionist, addPatient,
    callPatient, callNextPatient, completePatient, noShowPatient, removePatient, darkMode,
    averageWaitTime, updateAverageConsultationTime, currentToken, waitingCount, completedCount,
    joinSocketRoom
  } = useQueue();

  useEffect(() => {
    joinSocketRoom('reception');
  }, [joinSocketRoom]);

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

  // Patient Registration Success Card states
  const [successRegisteredPatient, setSuccessRegisteredPatient] = useState<Patient | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const [customQrText, setCustomQrText] = useState('');
  const [showCustomQrInput, setShowCustomQrInput] = useState(false);

  // Auto-scrolling list reference or highlight helper
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Local state for Recent Activities Log
  const [activities, setActivities] = useState<ActivityLog[]>([
    {
      id: 'act-1',
      text: 'Reception desk opened and ready to receive walk-ins',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'system'
    }
  ]);

  // Real-time date and time states for dashboard header
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // Clock ticks
  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setCurrentDate(d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!receptionist) {
    return null;
  }

  // Active calling tickets
  const callingPatients = patients.filter(p => p.status === 'calling');
  const activeServingPatient = patients.find(p => p.ticketNumber === currentToken || p.status === 'calling');
  const nowServingToken = currentToken;
  const nowServingName = activeServingPatient ? activeServingPatient.name : 'No active patient called';

  // Helper to log recent operator desktop activities
  const logActivity = (text: string, type: 'add' | 'call' | 'complete' | 'absent' | 'system') => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}-${Math.random()}`,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type
    };
    setActivities(prev => [newLog, ...prev].slice(0, 10)); // Keep last 10 entries
  };

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

      // Populate Success Card
      setSuccessRegisteredPatient(registered);
      setCustomQrText('');
      setShowCustomQrInput(false);

      // Highlight newly added item in list
      setHighlightedId(registered.id);
      setTimeout(() => setHighlightedId(null), 3000);

      // Log to Recent Actions Feed
      logActivity(`Registered walk-in triage "${registered.name}" (#${registered.ticketNumber})`, 'add');

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

        // Log recent desk activities
        logActivity(`Announced next waiting ticket #${nextPatient.ticketNumber} (${nextPatient.name})`, 'call');

        setTimeout(() => {
          setSuccessMessage('');
          setSuccessTicket('');
        }, 3550);
      } else {
        alert('The standby waitlist is currently empty. Add a patient first to call next.');
      }
    } catch (err: any) {
      alert(err.message || 'No more patients waiting in queue.');
    }
  };

  const handleCallParticularTicket = async (id: string, name: string, room: string, ticketNumber: string) => {
    try {
      await callPatient(id, room);
      logActivity(`Re-called standby patient "${name}" (${ticketNumber})`, 'call');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCompleteParticularTicket = async (id: string, name: string) => {
    try {
      await completePatient(id);
      logActivity(`Marked patient "${name}" as successfully served`, 'complete');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleNoShowParticularTicket = async (id: string, name: string) => {
    try {
      await noShowPatient(id);
      logActivity(`Marked patient "${name}" as absent / no-show`, 'absent');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveParticularTicket = async (id: string, name: string) => {
    try {
      await removePatient(id);
      logActivity(`Removed patient "${name}" from reception index`, 'system');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleIncrementAvg = (amount: number) => {
    const updated = Math.max(1, averageWaitTime + amount);
    updateAverageConsultationTime(updated);
    logActivity(`Tuned queue delay simulation parameter to ${updated} mins`, 'system');
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareLink = (url: string, nameName: string, tokenVal: string) => {
    const inviteText = `Hi ${nameName}, track your clinic queue status in real-time here: ${url} (Token: ${tokenVal})`;
    if (navigator.share) {
      navigator.share({
        title: "Queue Cure Live Updates",
        text: inviteText,
        url: url
      }).catch(err => {
        console.warn('Share error:', err);
      });
    } else {
      setShareFeedback("Simulation: SMS invite with tracking link sent directly to patient!");
      setTimeout(() => setShareFeedback(''), 4000);
    }
  };

  const handlePrintToken = () => {
    setPrintLoading(true);
    setTimeout(() => {
      setPrintLoading(false);
      // Construct thermal receipt popup
      const printUrlStr = `${window.location.origin}/patient/${customQrText || successRegisteredPatient?.ticketNumber || ''}`;
      const printW = window.open('', '_blank', 'width=350,height=520,scrollbars=yes');
      if (printW) {
        printW.document.write(`
          <html>
            <head>
              <title>Print Token QC-${successRegisteredPatient?.ticketNumber}</title>
              <style>
                body {
                  font-family: 'Courier New', Courier, monospace;
                  text-align: center;
                  padding: 10px 20px;
                  color: #000;
                  background-color: #fff;
                  margin: 0;
                  font-size: 13px;
                }
                .title { font-size: 18px; font-weight: bold; margin: 5px 0; }
                .ticket-num { font-size: 38px; font-weight: 1000; margin: 15px 0; border: 2px dashed #000; padding: 10px 0; }
                .meta-table { font-size: 11px; text-align: left; width: 100%; margin: 10px 0; }
                .meta-table td { padding: 2px 0; }
                .qr-img { margin: 15px auto; width: 140px; height: 140px; }
                .footer-dashed { border-top: 1px dashed #000; margin: 15px 0; padding-top: 10px; font-size: 10px; }
              </style>
            </head>
            <body>
              <div class="title">QUEUE CURE '26</div>
              <div>STATION 1 RECEIPT</div>
              <hr style="border: 0; border-top: 1px dashed #000;" />
              <div class="ticket-num">QC-${successRegisteredPatient?.ticketNumber}</div>
              <table class="meta-table">
                <tr><td>Patient Name:</td><td><b>${successRegisteredPatient?.name || 'Patient'}</b></td></tr>
                <tr><td>Purpose:</td><td><b>${successRegisteredPatient?.purpose || 'General Consultation'}</b></td></tr>
                <tr><td>Urgency:</td><td><b>${(successRegisteredPatient?.priority || 'normal').toUpperCase()}</b></td></tr>
                <tr><td>Intake Time:</td><td><b>${new Date().toLocaleTimeString()}</b></td></tr>
              </table>
              <hr style="border: 0; border-top: 1px dashed #000;" />
              <p>Scan live status tracker:</p>
              <img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(printUrlStr)}" />
              <div class="footer-dashed">
                <p>Tracking link: ${printUrlStr}</p>
                <p>*** Please keep this receipt with you ***</p>
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                }
              </script>
            </body>
          </html>
        `);
        printW.document.close();
      } else {
        setShareFeedback("Popup blocked! Receipt printed successfully in thermal logs.");
        setTimeout(() => setShareFeedback(''), 4500);
      }
    }, 1200);
  };

  const handleDownloadQr = (qrCodeUrl: string, token: string) => {
    const dynamicLink = document.createElement('a');
    dynamicLink.href = qrCodeUrl;
    dynamicLink.target = '_blank';
    dynamicLink.download = `Token-${token}-QR.png`;
    document.body.appendChild(dynamicLink);
    dynamicLink.click();
    document.body.removeChild(dynamicLink);
    setShareFeedback("QR Code opened in high quality. Save/download active.");
    setTimeout(() => setShareFeedback(''), 3500);
  };



  // Reset entire standing queue for a fresh list
  const handleResetEntireQueue = () => {
    if (confirm("Are you sure you want to clear/reset the active standby patient queue list?")) {
      patients.forEach(p => {
        try {
          removePatient(p.id);
        } catch (e) { }
      });
      logActivity('Cleared all patient logs and flushed live dashboard queues', 'system');
      alert("Standby queue elements cleared!");
    }
  };

  const triggerVoiceDeclaration = () => {
    if (!activeServingPatient) {
      alert("No active caller available. Call a patient first.");
      return;
    }
    // Re-announce details with Speech Synthesis
    try {
      window.speechSynthesis.cancel();
      const txt = `Calling Ticket QC ${activeServingPatient.ticketNumber.replace('-', ' ')}: ${activeServingPatient.name}. Proceed to ${receptionist.room}.`;
      const utterance = new SpeechSynthesisUtterance(txt);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
      logActivity(`Triggered repeat vocal audio announcement for ${activeServingPatient.ticketNumber}`, 'call');
    } catch (err) {
      console.warn(err);
    }
  };

  // Helper wait elapsed time calculator
  const getElapsedWaitMinutes = (joinedAtStr: string, status: string) => {
    if (status === 'completed') return 'Served';
    if (status === 'no-show') return 'No-show';
    const joined = new Date(joinedAtStr);
    const diffMs = Date.now() - joined.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return '< 1 min';
    return `${diffMins} mins`;
  };

  return (
    <div className={`min-h-screen w-full flex flex-col transition-colors duration-300 font-sans select-none ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC] text-slate-800'
      }`}>

      {/* 
        ========================================================================
        Dashboard Central Area (Responsive Desktop Framework)
        Maximum content width: 1400px. Centered with responsive margins.
        ========================================================================
      */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col gap-6">

        {/* 
          ----------------------------------------------------------------------
          HEADER COMPONENT
          ----------------------------------------------------------------------
        */}
        <header className={`p-4 md:p-5 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 text-left ${darkMode
            ? 'bg-slate-900/60 border-slate-800/80 backdrop-blur-md'
            : 'bg-white border-slate-200/60 shadow-sm backdrop-blur-md'
          }`}>
          {/* Operator Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-650 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-blue-500/10">
              {receptionist.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans font-black text-base md:text-lg text-slate-900 dark:text-white leading-tight">
                  {receptionist.name}
                </h1>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Desk Online
                </span>
              </div>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <span>🏥 Client Concierge Operational Center</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span>Active: {receptionist.room}</span>
              </p>
            </div>
          </div>

          {/* Quick Stats and Date Displays */}
          <div className="flex flex-wrap items-center gap-3.5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
            {/* Live Clock / Calendar */}
            <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 font-mono text-xs">
              <Clock className="w-4 h-4 text-blue-500" />
              <div>
                <strong className="text-slate-900 dark:text-white block font-black leading-none">{currentTime || '12:00:00 PM'}</strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">{currentDate || 'Jun 18, 2026'}</span>
              </div>
            </div>

            {/* Wait Display Navigation link */}
            <button
              onClick={() => navigate('/display')}
              className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2 text-xs uppercase font-black tracking-wider transition-all cursor-pointer ${darkMode
                  ? 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-905 hover:text-white shadow-inner'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 shadow-xs'
                }`}
              title="Launch TV Lounge display channel"
            >
              <Monitor className="w-4 h-4 text-indigo-500" />
              <span>Wait Display</span>
            </button>

            {/* Logout operator button */}
            <button
              onClick={() => {
                logoutReceptionist();
                navigate('/');
              }}
              className="text-xs uppercase font-black tracking-widest text-white bg-rose-600 hover:bg-rose-700 py-2.5 px-4 rounded-2xl text-center cursor-pointer transition-all shadow-md shadow-rose-500/10 flex items-center gap-1.5"
              id="receptionist-logout-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Exit Desk</span>
            </button>
          </div>
        </header>

        {/* 
          ----------------------------------------------------------------------
          OPERATIONAL METRICS LAYER (Centered in a 4-Column Row on desktop)
          Each spans col-span-3 of 12 columns.
          ----------------------------------------------------------------------
        */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="receptionist-statistics-layer">

          {/* Metric 1: CURRENT TOKEN CARD */}
          <motion.div
            whileHover={{ y: -3 }}
            className={`p-5 rounded-3xl border transition-all text-left relative overflow-hidden flex flex-col justify-between h-[155px] ${callingPatients.length > 0
                ? 'border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-blue-500/10'
                : darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/50 shadow-sm'
              }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-blue-550 dark:text-blue-400 uppercase tracking-widest">
                CURRENT CALL
              </span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                <Volume2 className="w-4 h-4" />
              </div>
            </div>

            <div className="my-2 text-3xl md:text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-505 dark:from-blue-400 dark:to-indigo-300">
              <ValueMotion>{nowServingToken || '---'}</ValueMotion>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="truncate">Active: <strong className="font-extrabold text-slate-800 dark:text-slate-150 capitalize">{nowServingName}</strong></span>
            </div>
          </motion.div>

          {/* Metric 2: STANDBY WAITING COUNT */}
          <motion.div
            whileHover={{ y: -3 }}
            className={`p-5 rounded-3xl border text-left flex flex-col justify-between h-[155px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/50 shadow-sm'
              }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                STANDBY WAITING
              </span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="my-2 text-3xl md:text-5xl font-black font-sans text-slate-900 dark:text-white">
              <ValueMotion>{waitingCount}</ValueMotion>
            </div>

            <div className="text-xs text-slate-400">
              Patients in pipeline queue
            </div>
          </motion.div>

          {/* Metric 3: COMPLETED COUNT */}
          <motion.div
            whileHover={{ y: -3 }}
            className={`p-5 rounded-3xl border text-left flex flex-col justify-between h-[155px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/50 shadow-sm'
              }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                SERVED TODAY
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="my-2 text-3xl md:text-5xl font-black font-sans text-emerald-600 dark:text-emerald-400">
              <ValueMotion>{completedCount}</ValueMotion>
            </div>

            <div className="text-xs text-slate-400">
              Successfully consulted checkups
            </div>
          </motion.div>

          {/* Metric 4: AVERAGE TIME CARD WITH CONTROLS */}
          <motion.div
            whileHover={{ y: -3 }}
            className={`p-5 rounded-3xl border text-left flex flex-col justify-between h-[155px] relative ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/50 shadow-sm'
              }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                  DELAY PREDICTOR
                </span>
                <p className="text-[8.5px] text-slate-400 font-semibold tracking-wider mt-0.5 uppercase">Average service period</p>
              </div>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="my-1.5 flex items-center justify-between">
              <span className="text-2xl md:text-3.5xl font-black font-sans text-slate-900 dark:text-white">
                <ValueMotion>{averageWaitTime}</ValueMotion> <span className="text-xs font-semibold text-slate-400">mins</span>
              </span>

              {/* Inline instant adjust controls */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <button
                  onClick={() => handleIncrementAvg(-1)}
                  className="w-7 h-7 rounded-lg text-xs font-black hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
                  title="Shorten wait estimator"
                >
                  -
                </button>
                <button
                  onClick={() => handleIncrementAvg(1)}
                  className="w-7 h-7 rounded-lg text-xs font-black hover:bg-white dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
                  title="Lengthen wait estimator"
                >
                  +
                </button>
              </div>
            </div>

            <div className="text-[10px] text-slate-450 dark:text-slate-500 flex items-center gap-1 truncate">
              <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="truncate">Interactive predictor affects visitor tickers</span>
            </div>
          </motion.div>

        </section>

        {/* 
          ----------------------------------------------------------------------
          ROW 2: WALK-IN INTAKE STATION & QUICK OPERATION CHANNELS
          - Desktop (1280px+): grid-cols-12, where Form spans 8, Commands spans 4.
          - Tablet: 2 column.
          - Mobile: 1 column.
          ----------------------------------------------------------------------
        */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* AddPatientCard (Walk-in Intake Form) - Spans 8 Columns */}
          <div className="lg:col-span-8">
            <motion.div
              layout="position"
              className={`p-5 rounded-3xl border h-full flex flex-col justify-between transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}
            >
              <div>
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-150 dark:border-slate-800">
                  <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-blue-500" />
                    <span>Clinic Walk-In Registration Counter</span>
                  </h4>
                </div>

                <form onSubmit={handleAddPatientSubmit} className="space-y-4 pt-4">
                  {/* Validation indicators */}
                  <AnimatePresence>
                    {formError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2 text-left"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{formError}</span>
                      </motion.div>
                    )}

                    {successMessage && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center gap-2 justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-500" />
                          <span>{successMessage}</span>
                        </div>
                        {successTicket && (
                          <span className="font-mono bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wide">
                            QC-{successTicket}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Type patient legal name..."
                        value={newPatientName}
                        onChange={(e) => {
                          setNewPatientName(e.target.value);
                          if (e.target.value.trim()) setFormError('');
                        }}
                        className={`w-full px-4.5 py-3 text-xs md:text-sm rounded-2xl border focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all ${darkMode
                            ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500'
                            : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                          }`}
                      />
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      type="submit"
                      style={{ backgroundColor: '#163858' }}
                      className="px-6 py-3.5 rounded-2xl text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:brightness-110 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add to Standby waitlist</span>
                    </motion.button>
                  </div>

                  {/* Form Options Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pt-2">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-1">Primary Triage Purpose</span>
                      <select
                        value={visitPurpose}
                        onChange={(e) => setVisitPurpose(e.target.value)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-semibold border focus:outline-hidden cursor-pointer ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                      >
                        <option value="General Consultation">🩺 General Consultation </option>
                        <option value="Acute Pain Triage">🚨 Acute Localized Pain </option>
                        <option value="Vaccine Intake / Jab">💉 Immunization / Jab </option>
                        <option value="Physiotherapy Consult">🦴 Physiotherapy Triage </option>
                        <option value="Cardiac Checkup">❤️ Cardiac Diagnostic </option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <label className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer select-none transition-all ${isUrgent
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                          : darkMode
                            ? 'border-slate-800 hover:bg-slate-950'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}>
                        <input
                          type="checkbox"
                          checked={isUrgent}
                          onChange={(e) => setIsUrgent(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-rose-550 focus:ring-rose-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-black uppercase tracking-wider">
                          ⚠️ Flag Urgent Triage (Priority)
                        </span>
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/50 flex items-center gap-2 text-[11px] text-slate-400 pl-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Entering a patient automatically syncs real-time delays and prints standard ticket credentials.</span>
              </div>
            </motion.div>
          </div>

          {/* QuickActionsCard (Desk Command Center) - Spans 4 Columns */}
          <div className="lg:col-span-4">
            <div className={`p-5 rounded-3xl border h-full flex flex-col justify-between text-left ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-202 shadow-sm'
              }`} id="QuickActionsCard">
              <div>
                <h4 className="text-xs font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-3.5 flex items-center gap-2 pb-2 border-b border-slate-150 dark:border-slate-800">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  <span>Reception Command Center</span>
                </h4>

                <div className="space-y-2.5">
                  {/* Call next action */}
                  <button
                    onClick={handleCallNextTicket}
                    disabled={waitingCount === 0}
                    className={`w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/10 ${waitingCount === 0 ? 'opacity-40 saturate-50 cursor-not-allowed' : ''
                      }`}
                  >
                    <Volume2 className="w-4 h-4 animate-bounce" />
                    <span>Call Next Standsby patient</span>
                  </button>

                  {/* Re-announce vocal trigger */}
                  <button
                    onClick={triggerVoiceDeclaration}
                    disabled={!activeServingPatient}
                    className={`w-full py-2.5 px-4 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors ${!activeServingPatient
                        ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                        : darkMode
                          ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10'
                          : 'border-blue-100 text-blue-600 bg-blue-50/40 hover:bg-blue-105/50'
                      }`}
                  >
                    <VolumeX className="w-4 h-4 flex-shrink-0" />
                    <span>Announce Serving Ticket Again</span>
                  </button>
                </div>
              </div>

              {/* Reset Flusher Button */}
              <div className="mt-4 pt-3 text-right">
                <button
                  type="button"
                  onClick={handleResetEntireQueue}
                  className={`w-full py-2 px-3 rounded-xl border border-dashed text-[10px] font-extrabold uppercase tracking-widest text-center text-rose-500 flex items-center justify-center gap-1.5 cursor-pointer transition-all ${darkMode ? 'border-slate-800 hover:bg-rose-950/20' : 'border-rose-100 hover:bg-rose-500/10'
                    }`}
                  title="Purge standby roster"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Purge Desk Waiting Roster</span>
                </button>
              </div>

            </div>
          </div>

        </section>

        {/* 
          ----------------------------------------------------------------------
          ROW 3: THE MAIN WAITING PIPELINE & AUDIT LOGS OVERLAYS
          - Desktop (1280px+): grid-cols-12, where QueueTable spans 8, and Logs spans 4.
          - Tablet: 2 column.
          - Mobile: 1 column.
          ----------------------------------------------------------------------
        */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* Main Waiting Standby Pipeline (QueueTable) - Spans 8 Columns */}
          <div className="lg:col-span-8 flex flex-col justify-between" id="receptionist-queue-list-container">
            <div className="space-y-3 h-full flex flex-col">

              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Live Active Standing Waitlist
                  </h4>
                </div>
                <span className="text-[10px] bg-slate-205 dark:bg-slate-900 border border-slate-105 dark:border-slate-800 px-2.5 py-1 rounded-lg font-mono text-slate-500 font-bold uppercase">
                  {patients.length} REGISTERED IN TOTAL
                </span>
              </div>

              {/* Roster table block */}
              <div className={`p-4 rounded-3xl border flex-1 flex flex-col min-h-[360px] justify-between ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                {patients.length === 0 ? (
                  <div className="my-auto py-12 text-center text-slate-405">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-300 animate-pulse" />
                    <h5 className="text-sm font-black text-slate-700 dark:text-slate-300">Vacant Clinical Standby Line</h5>
                    <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
                      No patients in queue. Register a walk-in patient using the intake counter above.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1">

                    {/* DESKTOP TABLE PATTERN - Grid format inside table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-450 uppercase text-[9.5px] font-black tracking-widest select-none">
                            <th className="py-3 pl-2.5">Token</th>
                            <th className="py-3">Patient credentials</th>
                            <th className="py-3 text-center">Triage status</th>
                            <th className="py-3 text-center">Joined Period</th>
                            <th className="py-3 text-center">Wait elapsed</th>
                            <th className="py-3 pr-2 text-right">Operational desk changes</th>
                          </tr>
                        </thead>
                        <tbody>
                          <AnimatePresence initial={false}>
                            {patients.map((pt) => {
                              const statusColor = pt.status === 'calling'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200'
                                : pt.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : pt.status === 'no-show'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-955/20 dark:text-amber-300'
                                    : 'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-305';

                              const formattedJoin = new Date(pt.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                              return (
                                <motion.tr
                                  key={pt.id}
                                  initial={{ opacity: 0, y: 12 }}
                                  animate={{
                                    opacity: 1,
                                    y: 0,
                                    backgroundColor: highlightedId === pt.id
                                      ? (darkMode ? 'rgba(37, 99, 235, 0.12)' : 'rgba(219, 234, 254, 0.35)')
                                      : 'transparent'
                                  }}
                                  exit={{ opacity: 0, x: -15 }}
                                  className={`border-b border-slate-105/60 dark:border-slate-800/60 hover:bg-slate-100/30 dark:hover:bg-slate-900/30 transition-colors ${pt.priority === 'urgent' && pt.status === 'waiting'
                                      ? 'bg-rose-500/5 dark:bg-rose-950/10'
                                      : ''
                                    }`}
                                >
                                  {/* Token */}
                                  <td className="py-3.5 pl-2.5 font-mono font-black text-slate-900 dark:text-white">
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800">
                                      {pt.ticketNumber}
                                    </span>
                                  </td>

                                  {/* Credentials */}
                                  <td className="py-3.5 font-semibold">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-slate-900 dark:text-white font-extrabold capitalize text-xs md:text-[13px]">{pt.name}</span>
                                      {pt.priority === 'urgent' && pt.status === 'waiting' && (
                                        <span className="text-[7.5px] uppercase font-black bg-rose-500 text-white px-1.5 py-0.5 rounded tracking-widest animate-pulse">
                                          Urgent
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 block font-normal">{pt.purpose}</span>
                                  </td>

                                  {/* Triage Status */}
                                  <td className="py-3.5 text-center">
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColor}`}>
                                      {pt.status === 'calling' ? '🛎️ CALLING' : pt.status}
                                    </span>
                                  </td>

                                  {/* Registration Join stamp */}
                                  <td className="py-3.5 font-mono text-[11px] text-slate-500 text-center">
                                    {formattedJoin}
                                  </td>

                                  {/* Dynamic wait timer */}
                                  <td className="py-3.5 font-mono text-[11px] text-slate-500 text-center font-bold">
                                    {getElapsedWaitMinutes(pt.joinedAt, pt.status)}
                                  </td>

                                  {/* Actions grids */}
                                  <td className="py-3.5 pr-2.5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      {pt.status === 'waiting' && (
                                        <motion.button
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => handleCallParticularTicket(pt.id, pt.name, receptionist.room, pt.ticketNumber)}
                                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                                        >
                                          <Volume2 className="w-3.5 h-3.5" />
                                          <span>Call</span>
                                        </motion.button>
                                      )}

                                      {pt.status === 'calling' && (
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            onClick={() => handleCompleteParticularTicket(pt.id, pt.name)}
                                            className="px-2 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                            title="Complete consultation"
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Serve</span>
                                          </button>
                                          <button
                                            onClick={() => handleNoShowParticularTicket(pt.id, pt.name)}
                                            className="px-2 py-1.5 rounded-lg bg-rose-505/15 text-rose-600 hover:bg-rose-500 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                            title="Mark Patient No Show"
                                          >
                                            <UserX className="w-3.5 h-3.5" />
                                            <span>Absent</span>
                                          </button>
                                        </div>
                                      )}

                                      {pt.status === 'completed' && (
                                        <span className="text-[10px] text-emerald-650 font-bold flex items-center gap-0.5 select-none pr-3">
                                          ✓ Complete
                                        </span>
                                      )}

                                      {pt.status === 'no-show' && (
                                        <span className="text-[10px] text-slate-400 font-bold select-none pr-3">
                                          No-show
                                        </span>
                                      )}

                                      <button
                                        onClick={() => handleRemoveParticularTicket(pt.id, pt.name)}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                        title="Purge record"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </AnimatePresence>
                        </tbody>
                      </table>
                    </div>

                    {/* MOBILE STACKED CARDS LAYOUT (Pushed when viewport is <768px) */}
                    <div className="md:hidden space-y-3.5">
                      <AnimatePresence initial={false}>
                        {patients.map((pt) => {
                          const statusColor = pt.status === 'calling'
                            ? 'border-indigo-400 bg-indigo-50/10'
                            : pt.priority === 'urgent' && pt.status === 'waiting'
                              ? 'border-rose-450 bg-rose-500/5'
                              : darkMode ? 'border-slate-805' : 'border-slate-150';

                          const formattedJoinTime = new Date(pt.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '09:21 AM';

                          return (
                            <motion.div
                              key={pt.id}
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{
                                opacity: 1,
                                scale: 1,
                                backgroundColor: highlightedId === pt.id
                                  ? (darkMode ? 'rgba(37, 99, 235, 0.15)' : 'rgba(219, 234, 254, 0.4)')
                                  : 'transparent'
                              }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className={`p-4 rounded-2.5xl border transition-all relative overflow-hidden text-left ${statusColor}`}
                            >
                              {/* Emergency tab indicator */}
                              {pt.priority === 'urgent' && pt.status === 'waiting' && (
                                <div className="absolute top-0 right-0 bg-rose-500 text-white font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                                  Urgent triage
                                </div>
                              )}

                              <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-2.5">
                                  <span className="font-mono text-xs font-black px-2 py-1 rounded bg-slate-100 dark:bg-slate-950 border dark:border-slate-800 text-slate-800 dark:text-slate-100">
                                    {pt.ticketNumber}
                                  </span>
                                  <div>
                                    <h5 className="text-xs md:text-sm font-black text-slate-900 dark:text-white capitalize">
                                      {pt.name}
                                    </h5>
                                    <p className="text-[10px] text-slate-450 mt-0.5 leading-normal">{pt.purpose}</p>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span className="text-[9.5px] text-slate-400 block font-mono">
                                    {formattedJoinTime}
                                  </span>
                                </div>
                              </div>

                              {/* Mobile actions block */}
                              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-slate-400">
                                  Status: {pt.status}
                                </span>

                                <div className="flex items-center gap-2">
                                  {pt.status === 'waiting' && (
                                    <motion.button
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleCallParticularTicket(pt.id, pt.name, receptionist.room, pt.ticketNumber)}
                                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                                    >
                                      <Volume2 className="w-3.5 h-3.5" />
                                      <span>Call</span>
                                    </motion.button>
                                  )}

                                  {pt.status === 'calling' && (
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => handleCompleteParticularTicket(pt.id, pt.name)}
                                        className="p-1.5 text-emerald-600 bg-emerald-500/10 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                                        title="Complete"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleNoShowParticularTicket(pt.id, pt.name)}
                                        className="p-1.5 text-rose-500 bg-rose-500/10 rounded-lg hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                                        title="No Show"
                                      >
                                        <UserX className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}

                                  <button
                                    onClick={() => handleRemoveParticularTicket(pt.id, pt.name)}
                                    className="p-1.5 text-slate-350 hover:text-rose-550 hover:bg-slate-100 rounded"
                                    title="Delete guest"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* COLUMN 3 ACTIONS: RECENT ACTIVITY LOGS & QR POSTER - Spans 4 Columns */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Recent Activity Card */}
            <div className={`p-5 rounded-3xl border text-left flex-1 flex flex-col ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`} id="RecentActivityCard">
              <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2 pb-2 border-b border-slate-150 dark:border-slate-800">
                <Activity className="w-4 h-4 text-orange-500" />
                <span>Station Desktop activity Log</span>
              </h4>

              {/* Feed stream */}
              <div className="flex-1 flex flex-col justify-start">
                <div className="space-y-3.5 my-auto max-h-[220px] overflow-y-auto pr-1">
                  {activities.map((act) => {
                    const iconColor = act.type === 'add'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                      : act.type === 'call'
                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30'
                        : act.type === 'complete'
                          ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/30'
                          : act.type === 'absent'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-505/30'
                            : 'bg-slate-500/10 text-slate-500 border border-slate-500/30';

                    return (
                      <div key={act.id} className="flex items-start gap-2.5 text-left">
                        <div className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5 ${iconColor}`}>
                          {act.type === 'add' ? '＋' : act.type === 'call' ? '🗣' : act.type === 'complete' ? '✓' : act.type === 'absent' ? '✖' : 'ℹ'}
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                            {act.text}
                          </p>
                          <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{act.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-150 dark:border-slate-800 mt-3 text-[9px] text-slate-400 text-center font-semibold">
                OPERATIONAL DESK AUDITING CURRENTLY ACTIVE
              </div>
            </div>

            {/* PWA Install App Card integration for Receptionist dashboard */}
            <InstallAppCard />

            {/* QR Poster Card */}
            <div className={`p-5 rounded-3xl border text-left ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-202 shadow-sm'
              }`} id="QRGenerationCard">
              <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-2 pb-2 border-b border-slate-150 dark:border-slate-800">
                <QrCode className="w-4 h-4 text-emerald-500" />
                <span>Station Standby Poster URL</span>
              </h4>

              <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                Lobby visitors can scan the physical Desk counter QR scanner on their smartphones to track their live order.
              </p>

              {/* QR representation layout */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 flex items-center justify-center max-w-[125px] mx-auto mb-3 shadow-inner relative group">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(window.location.origin + '/patient')}`}
                  alt="Desk Poster QR"
                  className="w-24 h-24 block rounded-lg select-none"
                />
              </div>

              {successRegisteredPatient && (
                <button
                  onClick={handlePrintToken}
                  disabled={printLoading}
                  className={`w-full py-2.5 px-3 rounded-xl border text-[10.5px] font-extrabold tracking-wide uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${printLoading
                      ? 'opacity-65'
                      : darkMode
                        ? 'border-slate-800 hover:bg-slate-950 text-white shadow-inner'
                        : 'border-slate-250 hover:bg-slate-100 text-slate-700 shadow-xs'
                    }`}
                >
                  <Printer className={`w-3.5 h-3.5 text-amber-500 ${printLoading ? 'animate-spin' : ''}`} />
                  <span>{printLoading ? 'Printing...' : 'Print Last Registered Slip'}</span>
                </button>
              )}
              {!successRegisteredPatient && (
                <p className={`text-center text-[10px] py-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                  Register a patient to print their ticket slip.
                </p>
              )}
            </div>

          </div>

        </section>

      </div>

      {/* 
        -------------------------------------------------------------
        MEMBER REGISTRATION SUCCESS RECEIPTS (MODALOVERLAYS)
        -------------------------------------------------------------
      */}
      <AnimatePresence>
        {successRegisteredPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto selection:bg-blue-500/35 font-sans"
            id="success-receipt-modal"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`w-full max-w-[400px] rounded-3xl overflow-hidden shadow-2xl relative border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'
                }`}
            >
              {/* Receipt Header Style */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-750 text-white p-5 text-center relative">
                {/* Punch Holes representation on left / right */}
                <div className="absolute left-0 bottom-0 top-0 w-3 flex flex-col justify-around pointer-events-none -translate-x-[6px]">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`} />
                  ))}
                </div>
                <div className="absolute right-0 bottom-0 top-0 w-3 flex flex-col justify-around pointer-events-none translate-x-[6px]">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`} />
                  ))}
                </div>

                <div className="mx-auto w-11 h-11 bg-white/10 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="font-sans font-black text-sm tracking-widest uppercase">
                  Intake Success
                </h3>
                <p className="text-[10px] text-blue-100 uppercase tracking-tighter font-semibold mt-0.5">
                  Patient Registered Successfully
                </p>
              </div>

              {/* Receipt body */}
              <div className="p-5 space-y-4">

                {/* Patient Information Section */}
                <div className={`p-4 rounded-2.5xl border ${darkMode ? 'bg-slate-905/65 border-slate-800' : 'bg-slate-50 border-slate-150'
                  }`}>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                    Patient Credentials
                  </span>
                  <div className="flex justify-between items-center mt-1.5">
                    <div>
                      <div className="text-[14px] font-black text-slate-900 dark:text-white leading-tight">
                        {successRegisteredPatient.name}
                      </div>
                      <div className="text-[10px] text-slate-505 dark:text-slate-400 mt-1">
                        Purpose: {successRegisteredPatient.purpose}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">TOKEN #</span>
                      <strong className="font-mono text-xl font-black text-blue-600 dark:text-blue-400">
                        {successRegisteredPatient.ticketNumber.startsWith('QC-') ? successRegisteredPatient.ticketNumber : `QC-${successRegisteredPatient.ticketNumber}`}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Tracking & QR Code Section */}
                <div className={`p-4 rounded-2.5xl border text-center ${darkMode ? 'bg-slate-905/40 border-slate-800' : 'bg-white border-slate-150/80 shadow-xs'
                  }`}>
                  <span className="text-[9.5px] uppercase tracking-wider font-black text-slate-500 dark:text-slate-400 block mb-2 text-center">
                    QUEUING STATUS TRACKER (QR)
                  </span>

                  {/* QR Code Prominent representation */}
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 w-[200px] h-[200px] mx-auto shadow-inner relative group overflow-hidden">

                    {/* Corner viewfinder guides */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-500 rounded-tl-[3px]" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-500 rounded-tr-[3px]" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-500 rounded-bl-[3px]" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-500 rounded-br-[3px]" />

                    {/* Laser scanning line effect */}
                    <div className="absolute inset-x-2 h-[2px] bg-blue-505/50 shadow-[0_0_8px_rgb(59,130,246)] animate-bounce top-[40%] pointer-events-none" />

                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        window.location.origin + '/patient/' + (customQrText || successRegisteredPatient.ticketNumber)
                      )}`}
                      alt={`Token QC-${successRegisteredPatient.ticketNumber} QR Code`}
                      title="Desk Code Scan"
                      className="w-[170px] h-[170px] block rounded-lg select-none relative z-10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://placehold.co/180x180/F1F5F9/2563EB?text=QC-${successRegisteredPatient.ticketNumber}+QR`;
                      }}
                    />
                  </div>

                  {/* Tracking link label Displayed prominently */}
                  <div className="mt-2.5 text-center">
                    <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Tracking URL Invite</span>
                    <div className="mt-1 flex items-center justify-center gap-1 inline-flex py-1 px-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10 text-[10px] font-mono text-blue-600 dark:text-blue-400 select-all max-w-full overflow-hidden truncate">
                      <Link className="w-3 h-3 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{window.location.origin}/patient/{customQrText || successRegisteredPatient.ticketNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Customize QR Input toggle */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomQrInput(!showCustomQrInput);
                      if (!customQrText) setCustomQrText(successRegisteredPatient.ticketNumber);
                    }}
                    className="text-[10px] font-bold text-slate-400 hover:text-blue-550 underline cursor-pointer"
                  >
                    {showCustomQrInput ? 'Hide QR Code Settings' : '🔧 Generate New QR (Edit Encoded Value)'}
                  </button>

                  <AnimatePresence>
                    {showCustomQrInput && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 max-w-[280px] mx-auto flex items-center gap-1.5"
                      >
                        <input
                          type="text"
                          placeholder="Customize QR token target..."
                          value={customQrText}
                          onChange={(e) => setCustomQrText(e.target.value)}
                          className={`flex-1 px-2 py-1.5 text-[10px] rounded-lg border focus:outline-hidden ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-205 text-slate-800'
                            }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCustomQrText(successRegisteredPatient.ticketNumber);
                            setShowCustomQrInput(false);
                          }}
                          className="px-2 py-1.5 text-[9px] font-bold bg-slate-100 dark:bg-slate-800 rounded-lg hover:opacity-80"
                        >
                          Reset
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* Copy Link Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyLink(`${window.location.origin}/patient/${customQrText || successRegisteredPatient.ticketNumber}`)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${copiedLink
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 font-bold'
                        : darkMode
                          ? 'bg-slate-900 border-slate-800 hover:border-slate-705 text-slate-305'
                          : 'bg-slate-55/80 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-blue-500" />}
                    <div className="text-[10px]">
                      <span className="block font-bold">Copy Link</span>
                      <span className="text-[8px] opacity-75">{copiedLink ? 'Copied tracker URL' : 'Copy guest invite'}</span>
                    </div>
                  </button>

                  {/* Share Link Button */}
                  <button
                    type="button"
                    onClick={() => handleShareLink(`${window.location.origin}/patient/${customQrText || successRegisteredPatient.ticketNumber}`, successRegisteredPatient.name, successRegisteredPatient.ticketNumber)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${darkMode
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                        : 'bg-slate-55/80 border-slate-200 hover:bg-slate-105 text-slate-700'
                      }`}
                  >
                    <Share2 className="w-4 h-4 text-indigo-500" />
                    <div className="text-[10px]">
                      <span className="block font-bold">Share Link</span>
                      <span className="text-[8px] opacity-75">Send SMS Invite</span>
                    </div>
                  </button>

                  {/* Download QR Code Button */}
                  <button
                    type="button"
                    onClick={() => handleDownloadQr(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                      window.location.origin + '/patient/' + (customQrText || successRegisteredPatient.ticketNumber)
                    )}`, successRegisteredPatient.ticketNumber)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${darkMode
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                        : 'bg-slate-55/80 border-slate-200 hover:bg-slate-105 text-slate-700'
                      }`}
                  >
                    <Download className="w-4 h-4 text-emerald-500" />
                    <div className="text-[10px]">
                      <span className="block font-bold">Download QR</span>
                      <span className="text-[8px] opacity-75">Save PNG Image</span>
                    </div>
                  </button>

                  {/* Print thermal receipt check button */}
                  <button
                    type="button"
                    onClick={handlePrintToken}
                    disabled={printLoading}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${printLoading
                        ? 'opacity-65'
                        : darkMode
                          ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-305'
                          : 'bg-slate-55/80 border-slate-200 hover:bg-slate-105 text-slate-700'
                      }`}
                  >
                    <Printer className={`w-4 h-4 text-amber-500 ${printLoading ? 'animate-spin' : ''}`} />
                    <div className="text-[10px]">
                      <span className="block font-bold">Print Token</span>
                      <span className="text-[8px] opacity-75">{printLoading ? 'Thermal spooling...' : 'Print formal receipt'}</span>
                    </div>
                  </button>
                </div>

                {/* Feedback alert toast inside receipt */}
                <AnimatePresence>
                  {shareFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="p-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold text-center"
                    >
                      {shareFeedback}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Thermal receipt jagged separation boundary design */}
                <div className="pt-1 flex justify-between select-none pointer-events-none text-slate-300 dark:text-slate-800">
                  {[...Array(20)].map((_, i) => (
                    <span key={i} className="text-xs font-bold leading-[3px]">-</span>
                  ))}
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSuccessRegisteredPatient(null)}
                  className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold cursor-pointer text-center block mt-1"
                >
                  Confirm & Dismiss
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 
        -----------------------------------------
        5. FLOATING QUICK-CALL TRIGGER BUTTON (Desktop hidden, Mobile / Tablet absolute assistance)
        -----------------------------------------
      */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
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
          className={`flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl cursor-pointer select-none border border-blue-405/20 ${waitingCount === 0 ? 'opacity-40 saturate-50 cursor-not-allowed' : ''
            }`}
          title="Call Next Patient in Queue"
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
