import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { Patient, PriorityLevel, PatientStatus } from '../types';
import { 
  Users, UserPlus, Volume2, CheckCircle2, UserX, AlertCircle, 
  Trash2, Plus, ArrowRight, UserCheck, ShieldAlert, Sparkles, Clock, BarChart3, HelpCircle, Flame, MonitorPlay,
  Copy, Share2, Printer, Download, QrCode, Check, Smartphone, ExternalLink, Link, ArrowLeft, ClipboardCheck
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

  // Patient Registration Success Card states
  const [successRegisteredPatient, setSuccessRegisteredPatient] = useState<Patient | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const [customQrText, setCustomQrText] = useState('');
  const [showCustomQrInput, setShowCustomQrInput] = useState(false);

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

      // Populate Success Card
      setSuccessRegisteredPatient(registered);
      setCustomQrText('');
      setShowCustomQrInput(false);

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

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareLink = (url: string, nameName: string, tokenVal: string) => {
    const inviteText = `Hi ${nameName}, track your clinic queue status in real-time here: ${url} (Token: ${tokenVal})`;
    if (navigator.share) {
      navigator.share({
        title: "Queue Cure live updates",
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
      const printUrlStr = `${window.location.origin}/patient/${customQrText || (successRegisteredPatient ? successRegisteredPatient.ticketNumber : '108')}`;
      const printW = window.open('', '_blank', 'width=350,height=520,scrollbars=yes');
      if (printW) {
        printW.document.write(`
          <html>
            <head>
              <title>Print Token QC-${successRegisteredPatient?.ticketNumber || '108'}</title>
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
              <div class="ticket-num">QC-${successRegisteredPatient?.ticketNumber || '108'}</div>
              <table class="meta-table">
                <tr><td>Patient Name:</td><td><b>\${successRegisteredPatient?.name || 'Rahul Sharma'}</b></td></tr>
                <tr><td>Purpose:</td><td><b>\${successRegisteredPatient?.purpose || 'General Consultation'}</b></td></tr>
                <tr><td>Urgency:</td><td><b>\${(successRegisteredPatient?.priority || 'normal').toUpperCase()}</b></td></tr>
                <tr><td>Intake Time:</td><td><b>\${new Date().toLocaleTimeString()}</b></td></tr>
              </table>
              <hr style="border: 0; border-top: 1px dashed #000;" />
              <p>Scan live status tracker:</p>
              <img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${encodeURIComponent(printUrlStr)}" />
              <div class="footer-dashed">
                <p>Tracking link: \${printUrlStr}</p>
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
    // Generate static image link download
    const dynamicLink = document.createElement('a');
    dynamicLink.href = qrCodeUrl;
    dynamicLink.target = '_blank';
    dynamicLink.download = `Token-\${token}-QR.png`;
    document.body.appendChild(dynamicLink);
    dynamicLink.click();
    document.body.removeChild(dynamicLink);
    setShareFeedback("QR Code opened in high quality. Save/download active.");
    setTimeout(() => setShareFeedback(''), 3500);
  };

  const handleTriggerMockSuccess = () => {
    const mockPatient: Patient = {
      id: 'mock-rahul-sharma-108',
      name: 'Rahul Sharma',
      ticketNumber: '108',
      purpose: 'General Consultation',
      priority: 'normal',
      status: 'waiting',
      joinedAt: new Date().toISOString(),
      estimatedWaitMinutes: 20
    };
    setSuccessRegisteredPatient(mockPatient);
    setCustomQrText('');
    setShowCustomQrInput(false);
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
        <div className="flex justify-between items-center mb-2.5">
          <h4 className="text-xs font-extrabold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-blue-500" />
            <span>Intake Walk-in Registration</span>
          </h4>
          <button
            type="button"
            onClick={handleTriggerMockSuccess}
            className="text-[10px] bg-blue-55 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-black tracking-tight px-2 py-1 rounded-lg border border-blue-101 dark:border-slate-700 hover:opacity-85 cursor-pointer"
            id="test-demo-success-btn"
            title="Immediately preview success ticket styling with Rahul Sharma (#108)"
          >
            🧪 Test Demo Card
          </button>
        </div>

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

      {/* 
        -------------------------------------------------------------
        MEMBER REGISTRATION SUCCESS POPUP CARD (RECEIPT-STYLE)
        -------------------------------------------------------------
      */}
      <AnimatePresence>
        {successRegisteredPatient && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto selection:bg-blue-500/35 font-sans"
            id="success-receipt-modal"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`w-full max-w-[400px] rounded-3xl overflow-hidden shadow-2xl relative border ${
                darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'
              }`}
            >
              {/* Receipt Header Style */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 text-center relative">
                {/* Punch Holes representation on left / right */}
                <div className="absolute left-0 bottom-0 top-0 w-3 flex flex-col justify-around pointer-events-none -translate-x-[6px]">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`} />
                  ))}
                </div>
                <div className="absolute right-0 bottom-0 top-0 w-3 flex flex-col justify-around pointer-events-none translate-x-[6px]">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`} />
                  ))}
                </div>

                <div className="mx-auto w-11 h-11 bg-white/10 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="font-sans font-black text-sm tracking-widest uppercase">
                  Intake Success
                </h3>
                <p className="text-[10px] text-blue-100 uppercase tracking-tighter font-semibold mt-0.5">
                  Patient Added Successfully
                </p>
              </div>

              {/* Receipt body */}
              <div className="p-5 space-y-4">
                
                {/* Patient Information Section */}
                <div className={`p-3.5 rounded-2xl border ${
                  darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-150'
                }`}>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                    Patient Credentials
                  </span>
                  <div className="flex justify-between items-center mt-1.5">
                    <div>
                      <div className="text-[14px] font-black text-slate-900 dark:text-white leading-tight">
                        {successRegisteredPatient.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        Purpose: {successRegisteredPatient.purpose}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">TOKEN #</span>
                      <strong className="font-mono text-xl font-black text-blue-600 dark:text-blue-400">
                        {successRegisteredPatient.ticketNumber}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Tracking & QR Code Section */}
                <div className={`p-4 rounded-2.5xl border text-center ${
                  darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-150/80 shadow-xs'
                }`}>
                  <span className="text-[9.5px] uppercase tracking-wider font-black text-slate-500 dark:text-slate-400 block mb-2 text-center">
                    QUEUING STATUS TRACKER (QR)
                  </span>

                  {/* QR Code Prominent representation */}
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-[200px] h-[200px] mx-auto shadow-inner relative group overflow-hidden">
                    
                    {/* Corner viewfinder guides */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-500 rounded-tl-[3px]" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-500 rounded-tr-[3px]" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-500 rounded-bl-[3px]" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-500 rounded-br-[3px]" />

                    {/* Laser scanning line effect */}
                    <div className="absolute inset-x-2 h-[2px] bg-blue-500/50 shadow-[0_0_8px_rgb(59,130,246)] animate-bounce top-[40%] pointer-events-none" />

                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        window.location.origin + '/patient/' + (customQrText || successRegisteredPatient.ticketNumber)
                      )}`}
                      alt={`Token QC-${successRegisteredPatient.ticketNumber} QR Code`}
                      title={`Double tap to copy`}
                      className="w-[170px] h-[170px] block rounded-lg select-none relative z-10"
                      onError={(e) => {
                        // Fallback placeholder QR rendering
                        (e.target as HTMLImageElement).src = `https://placehold.co/180x180/F1F5F9/2563EB?text=QC-${successRegisteredPatient.ticketNumber}+QR`;
                      }}
                    />
                  </div>

                  {/* Tracking link label Displayed prominently */}
                  <div className="mt-2.5 text-center">
                    <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Tracking URL Invite</span>
                    <div className="mt-1 flex items-center justify-center gap-1 inline-flex py-1 px-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10 text-[10px] font-mono text-blue-601 dark:text-blue-400 select-all">
                      <Link className="w-3 h-3 text-blue-500 flex-shrink-0" />
                      <span>{window.location.origin}/patient/{customQrText || successRegisteredPatient.ticketNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Customize QR Input toggle */}
                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowCustomQrInput(!showCustomQrInput);
                      if(!customQrText) setCustomQrText(successRegisteredPatient.ticketNumber);
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
                          className={`flex-1 px-2 py-1.5 text-[10px] rounded-lg border focus:outline-hidden ${
                            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
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
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      copiedLink 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 font-bold' 
                        : darkMode 
                          ? 'bg-slate-900 border-slate-800 hover:border-slate-705 text-slate-300' 
                          : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 text-slate-700'
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
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-705 text-slate-300' 
                        : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Share2 className="w-4 h-4 text-indigo-505" />
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
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-800 hover:border-slate-705 text-slate-300' 
                        : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Download className="w-4 h-4 text-emerald-500" />
                    <div className="text-[10px]">
                      <span className="block font-bold">Download QR</span>
                      <span className="text-[8px] opacity-75">Save standard PNG</span>
                    </div>
                  </button>

                  {/* Print thermal receipt check button */}
                  <button
                    type="button"
                    onClick={handlePrintToken}
                    disabled={printLoading}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      printLoading 
                        ? 'opacity-65' 
                        : darkMode 
                          ? 'bg-slate-900 border-slate-800 hover:border-slate-705 text-slate-300' 
                          : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100 text-slate-700'
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

    </div>
  );
};
