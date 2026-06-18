import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { Patient, PriorityLevel } from '../types';
import { 
  Users, UserPlus, Volume2, CheckCircle2, UserX, AlertCircle, 
  Trash2, Plus, ArrowRight, UserCheck, ShieldAlert, Sparkles, Clock, BarChart2, 
  Copy, Share2, Printer, Download, QrCode, Check, Smartphone, ExternalLink, Link, 
  ArrowLeft, ClipboardCheck, Sliders, Settings, RotateCw, Play, VolumeX, Eye, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
        alert('The standby waitlist is currently empty. Add a patient first to call next.');
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
                <tr><td>Patient Name:</td><td><b>${successRegisteredPatient?.name || 'Rahul Sharma'}</b></td></tr>
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

  // Add dummy patient helper for quick sandboxing
  const handleAddMockPatient = async (name: string, purpose: string, isUrgentFlag: boolean) => {
    const priorityCode: PriorityLevel = isUrgentFlag ? 'urgent' : 'normal';
    try {
      const p = await addPatient(name, purpose, priorityCode);
      setHighlightedId(p.id);
      setTimeout(() => setHighlightedId(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  // Reset entire standing queue for a fresh list
  const handleResetEntireQueue = () => {
    if (confirm("Are you sure you want to clear/reset the active standby patient queue list?")) {
      // Clear local patients
      patients.forEach(p => {
        try {
          removePatient(p.id);
        } catch(e) {}
      });
      alert("standby queue elements cleared!");
    }
  };

  // -------------------------------------------------------------
  // LAYOUT COMPONENT RENDERS
  // -------------------------------------------------------------

  const CurrentTokenCard = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-5 rounded-3xl border transition-all text-center relative overflow-hidden ${
        callingPatients.length > 0 
          ? 'border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-blue-500/10'
          : darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/50 shadow-sm'
      }`}
      id="CurrentTokenCard"
    >
      <div className="absolute top-4 left-4 flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Call</span>
      </div>

      <div className="text-[10.5px] font-extrabold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-3">
        CURRENTLY CALLING
      </div>
      
      <div className="my-3.5">
        <span className="font-mono text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 tracking-tighter">
          {nowServingToken}
        </span>
      </div>

      <div className={`text-xs font-semibold px-4.5 py-1.5 rounded-2xl inline-flex items-center gap-1.5 ${
        darkMode ? 'bg-slate-850 text-slate-300' : 'bg-slate-50 text-slate-700 border border-slate-100'
      }`}>
        <UserCheck className="w-3.5 h-3.5 text-blue-500" />
        <span>Patient: <strong className="font-extrabold text-blue-600 dark:text-blue-400">{nowServingName}</strong></span>
      </div>
    </motion.div>
  );

  const AddPatientCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-5 rounded-3xl border transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-205 shadow-sm'
      }`}
      id="AddPatientCard"
    >
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xs font-extrabold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <UserPlus className="w-4 h-4 text-blue-500" />
          <span>Walk-in Intake Form</span>
        </h4>
        <button
          type="button"
          onClick={handleTriggerMockSuccess}
          className="text-[9.5px] bg-blue-50 dark:bg-slate-800 text-blue-650 dark:text-blue-400 font-extrabold tracking-widest uppercase px-2 py-1 rounded-lg border border-blue-100 dark:border-slate-700 hover:opacity-85 cursor-pointer"
          id="test-demo-success-btn"
          title="Immediately preview success ticket styling with Rahul Sharma (#108)"
        >
          🧪 Try Demo
        </button>
      </div>

      <form onSubmit={handleAddPatientSubmit} className="space-y-3.5">
        {/* Validations */}
        <AnimatePresence>
          {formError && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px] font-bold flex items-center gap-1.5 text-left"
              id="add-patient-error"
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
              className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[11px] font-bold flex items-center gap-1.5 justify-between text-left"
              id="add-patient-success"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>{successMessage}</span>
              </div>
              {successTicket && (
                <span className="font-mono bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-extrabold">
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
            className={`flex-1 px-4 py-2.5 text-xs rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all ${
              darkMode 
                ? 'bg-slate-850 border-slate-700 text-white focus:border-blue-500' 
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
            }`}
            id="receptionist-form-name-input"
          />
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="px-4.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/10 flex items-center gap-1 cursor-pointer"
            id="receptionist-form-add-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </motion.button>
        </div>

        {/* Form Options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <select
            value={visitPurpose}
            onChange={(e) => setVisitPurpose(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs border focus:outline-hidden ${
              darkMode ? 'bg-slate-855 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <option value="General Consultation">General Wellness Check</option>
            <option value="Acute Pain Triage">Acute Localized Pain</option>
            <option value="Vaccine Intake / Jab">Immunization / Jab</option>
            <option value="Physiotherapy Consult">Physiotherapy Triage</option>
            <option value="Cardiac Checkup">Cardiac Diagnostic</option>
          </select>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-rose-650 focus:ring-rose-500 cursor-pointer"
            />
            <span className="text-[10.5px] font-black text-rose-605 dark:text-rose-455 uppercase tracking-wide">
              MARK URGENT Triage
            </span>
          </label>
        </div>
      </form>
    </motion.div>
  );

  const AverageTimeCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-3xl border transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-205 shadow-xs'
      }`}
      id="AverageTimeCard"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delay Predictor</div>
            <div className="text-[14px] font-black text-slate-900 dark:text-white mt-0.5">
              {averageWaitTime} Min / Patient
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAvgEditOptions(!showAvgEditOptions)}
          className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:opacity-85 cursor-pointer"
          id="average-time-toggle-edit"
        >
          {showAvgEditOptions ? 'Done' : 'Adjust'}
        </button>
      </div>

      {/* Accordion speed slider controls */}
      <AnimatePresence>
        {showAvgEditOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-left"
          >
            <p className="text-[10px] text-slate-455 dark:text-slate-400 max-w-[180px] leading-relaxed">
              Scaling predictor adapts real-time patient queue tickers.
            </p>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleIncrementAvg(-1)}
                className={`w-7.5 h-7.5 rounded-lg font-black text-xs flex items-center justify-center border hover:bg-slate-100 ${
                  darkMode ? 'bg-slate-800 border-slate-705 text-white' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                -
              </button>
              <span className="font-mono font-black text-xs w-6 text-center">{averageWaitTime}m</span>
              <button
                type="button"
                onClick={() => handleIncrementAvg(1)}
                className={`w-7.5 h-7.5 rounded-lg font-black text-xs flex items-center justify-center border hover:bg-slate-100 ${
                  darkMode ? 'bg-slate-800 border-slate-705 text-white' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                +
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  const StatisticsCard = () => (
    <div className="grid grid-cols-2 gap-3" id="StatisticsCard">
      {/* Waiting panel */}
      <div className={`p-4 rounded-3xl border flex flex-col justify-between text-left ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-205 shadow-xs'
      }`}>
        <div className="flex items-center gap-1.5 text-slate-500 text-[9.5px] font-black uppercase tracking-wider">
          <Users className="w-3.5 h-3.5 text-blue-500" />
          <span>Waiting Line</span>
        </div>
        <div className="text-3xl font-black font-sans text-slate-900 dark:text-white mt-2">
          {waitingCount}
        </div>
      </div>

      {/* Completed panel */}
      <div className={`p-4 rounded-3xl border flex flex-col justify-between text-left ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-205 shadow-xs'
      }`}>
        <div className="flex items-center gap-1.5 text-slate-500 text-[9.5px] font-black uppercase tracking-wider">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Served Today</span>
        </div>
        <div className="text-3xl font-black font-sans text-emerald-600 dark:text-emerald-400 mt-2">
          {completedCount || 18}
        </div>
      </div>
    </div>
  );

  const QueueListCard = () => {
    return (
      <div className="flex flex-col h-full space-y-2.5" id="QueueListCard">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <ClipboardCheck className="w-4 h-4 text-blue-500" />
            <span>Active Waiting Standby</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{patients.length} Registered</span>
        </div>

        <div className={`p-4.5 rounded-3.5xl border flex-1 flex flex-col min-h-[300px] ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-205 shadow-xs'
        }`}>
          {patients.length === 0 ? (
            <div className="my-auto py-12 text-center text-slate-400">
              <Sparkles className="w-10 h-10 mx-auto mb-2 text-slate-300 animate-pulse" />
              <p className="text-xs font-medium">All Clinic Standby lines are currently vacant.</p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto">Use Walk-in intake or mock generator to load patients.</p>
            </div>
          ) : (
            <div className="flex-1">
              
              {/* DESKTOP TABLE VIEW (Visible >= 768px Tablet and up) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 select-none uppercase text-[9.5px] font-black tracking-wider">
                      <th className="py-2.5 pl-2">Token</th>
                      <th className="py-2.5">Patient Name</th>
                      <th className="py-2.5">Triage status</th>
                      <th className="py-2.5">Joined At</th>
                      <th className="py-2.5 pr-2 text-right">Desk Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {patients.map((pt) => {
                        const statusColor = pt.status === 'calling' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200'
                          : pt.status === 'completed'
                            ? 'bg-emerald-105 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-300';

                        const formattedJoinTime = new Date(pt.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '09:21 AM';

                        return (
                          <motion.tr
                            key={pt.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ 
                              opacity: 1, 
                              y: 0,
                              backgroundColor: highlightedId === pt.id 
                                ? (darkMode ? 'rgba(37, 99, 235, 0.12)' : 'rgba(219, 234, 254, 0.35)')
                                : 'transparent'
                            }}
                            exit={{ opacity: 0, x: -10 }}
                            className={`border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors ${
                              pt.priority === 'urgent' && pt.status === 'waiting'
                                ? 'bg-rose-500/5 dark:bg-rose-950/10'
                                : ''
                            }`}
                          >
                            {/* Token */}
                            <td className="py-3 pl-2 font-mono font-black text-slate-800 dark:text-slate-200">
                              <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
                                {pt.ticketNumber}
                              </span>
                            </td>

                            {/* Patient Name */}
                            <td className="py-3 font-semibold">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-900 dark:text-white font-extrabold">{pt.name}</span>
                                {pt.priority === 'urgent' && pt.status === 'waiting' && (
                                  <span className="text-[7.5px] uppercase font-black bg-rose-500 text-white px-1 py-0.5 rounded tracking-widest">
                                    Urgent
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-450 block">{pt.purpose}</span>
                            </td>

                            {/* Status */}
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${statusColor}`}>
                                {pt.status === 'calling' ? '🛎️ CALLING' : pt.status}
                              </span>
                            </td>

                            {/* Joined Time */}
                            <td className="py-3 font-mono text-[10.5px] text-slate-500">
                              {formattedJoinTime}
                            </td>

                            {/* Actions */}
                            <td className="py-3 pr-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {pt.status === 'waiting' && (
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => callPatient(pt.id, receptionist.room)}
                                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Volume2 className="w-3 h-3" />
                                    <span>Call</span>
                                  </motion.button>
                                )}

                                {pt.status === 'calling' && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => completePatient(pt.id)}
                                      className="px-2 py-1.5 rounded bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500 hover:text-white text-[10px] font-bold flex items-center gap-0.5 transition-colors"
                                      title="Complete consultation"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Complete</span>
                                    </button>
                                    <button
                                      onClick={() => noShowPatient(pt.id)}
                                      className="px-2 py-1.5 rounded bg-rose-500/15 text-rose-550 hover:bg-rose-500 hover:text-white text-[10px] font-bold flex items-center gap-0.5 transition-colors"
                                      title="Mark Patient No Show"
                                    >
                                      <UserX className="w-3.5 h-3.5" />
                                      <span>Absent</span>
                                    </button>
                                  </div>
                                )}

                                {pt.status === 'completed' && (
                                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 select-none pr-2">
                                    ✓ Completed
                                  </span>
                                )}

                                {pt.status === 'no-show' && (
                                  <span className="text-[10px] text-slate-400 font-bold select-none pr-2">
                                    No-Show
                                  </span>
                                )}

                                <button
                                  onClick={() => removePatient(pt.id)}
                                  className="p-1.5 text-slate-350 hover:text-rose-500 rounded hover:bg-slate-100 dark:hover:bg-slate-805"
                                  title="Remove from queue record"
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

              {/* MOBILE CARD VIEW (Visible on Mobile screens < 768px) */}
              <div className="md:hidden space-y-3">
                <AnimatePresence initial={false}>
                  {patients.map((pt) => {
                    const statusColor = pt.status === 'calling' 
                      ? 'border-indigo-400 bg-indigo-50/20'
                      : pt.priority === 'urgent' && pt.status === 'waiting'
                        ? 'border-rose-400 bg-rose-500/5'
                        : darkMode ? 'border-slate-800' : 'border-slate-105';

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
                        className={`p-3 rounded-2.5xl border transition-all relative overflow-hidden text-left ${statusColor}`}
                      >
                        {/* Urgent badge block */}
                        {pt.priority === 'urgent' && pt.status === 'waiting' && (
                          <div className="absolute top-0 right-0 bg-rose-500 text-white font-black text-[7px] uppercase tracking-widest px-2.5 py-0.5 rounded-bl-lg">
                            Urgent
                          </div>
                        )}

                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                              {pt.ticketNumber}
                            </span>
                            <div>
                              <h5 className="text-[12.5px] font-extrabold text-slate-900 dark:text-white">
                                {pt.name}
                              </h5>
                              <p className="text-[10px] text-slate-450 leading-normal">{pt.purpose}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 block font-mono">
                              {formattedJoinTime}
                            </span>
                          </div>
                        </div>

                        {/* Actions block for mobile */}
                        <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-805 flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                            Status: {pt.status}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {pt.status === 'waiting' && (
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => callPatient(pt.id, receptionist.room)}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[10px] font-extrabold flex items-center gap-0.5 cursor-pointer"
                              >
                                <Volume2 className="w-3 h-3" />
                                <span>Call</span>
                              </motion.button>
                            )}

                            {pt.status === 'calling' && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => completePatient(pt.id)}
                                  className="p-1 text-emerald-600 bg-emerald-500/10 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors"
                                  title="Complete"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => noShowPatient(pt.id)}
                                  className="p-1 text-rose-500 bg-rose-500/10 rounded-lg hover:bg-rose-500 hover:text-white transition-colors"
                                  title="No Show"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            <button
                              onClick={() => removePatient(pt.id)}
                              className="p-1 text-slate-300 hover:text-rose-500 hover:bg-slate-100 rounded"
                              title="Delete Patient Record"
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
    );
  };

  const QuickActionsCard = () => (
    <div className={`p-4 rounded-3xl border text-left ${
      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-205 shadow-xs'
    }`} id="QuickActionsCard">
      <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <Sliders className="w-4 h-4 text-indigo-500" />
        <span>Desk Quick Actions</span>
      </h4>

      <div className="space-y-2.5">
        {/* Call next */}
        <button
          onClick={handleCallNextTicket}
          disabled={waitingCount === 0}
          className={`w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            waitingCount === 0 ? 'opacity-40 saturate-50 cursor-not-allowed' : ''
          }`}
        >
          <Volume2 className="w-4 h-4 animate-pulse" />
          <span>Call Next Waiting Patient</span>
        </button>

        {/* Mock triggers */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleAddMockPatient("Aditya Udai", "Acute Pain Triage", true)}
            className={`py-2 px-2.5 rounded-xl border text-[9.5px] font-black uppercase tracking-wider text-center transition-all cursor-pointer ${
              darkMode 
                ? 'bg-slate-950 border-slate-800 text-rose-400 hover:bg-slate-900' 
                : 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-100 text-rose-600'
            }`}
          >
            🚨 Urgent Seed
          </button>

          <button
            type="button"
            onClick={() => handleAddMockPatient("Maya Sen", "Immunization / Jab", false)}
            className={`py-2 px-2.5 rounded-xl border text-[9.5px] font-black uppercase tracking-wider text-center transition-all cursor-pointer ${
              darkMode 
                ? 'bg-slate-950 border-slate-800 text-blue-400 hover:bg-slate-900' 
                : 'bg-blue-500/5 hover:bg-blue-500/10 border-blue-100 text-blue-600'
            }`}
          >
            🌱 Wellness Seed
          </button>
        </div>

        {/* View display & reset */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => navigate('/display')}
            className={`py-2 px-2 rounded-xl border text-[9px] font-bold text-center flex items-center justify-center gap-1 cursor-pointer transition-colors ${
              darkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50 text-slate-755'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-indigo-500" />
            <span>Open Display</span>
          </button>

          <button
            type="button"
            onClick={handleResetEntireQueue}
            className={`py-2 px-2 rounded-xl border border-dashed text-[9px] font-bold text-center text-rose-550 flex items-center justify-center gap-1 cursor-pointer transition-colors ${
              darkMode ? 'border-slate-800 hover:bg-rose-950/20' : 'border-rose-100 hover:bg-rose-500/10'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5 text-rose-500" />
            <span>Clear Queue</span>
          </button>
        </div>
      </div>
    </div>
  );

  const QRGenerationCard = () => (
    <div className={`p-4 rounded-3xl border text-left ${
      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-205 shadow-xs'
    }`} id="QRGenerationCard">
      <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
        <QrCode className="w-4 h-4 text-emerald-500" />
        <span>Station Desk QR Poster</span>
      </h4>

      <p className="text-[10.5px] text-slate-500 leading-relaxed mb-3 font-normal">
        Patients scan this desk QR to immediately open the Live Queue Standby tracker on their personal smartphones.
      </p>

      {/* Mini View QR */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center max-w-[120px] mx-auto mb-3 shadow-inner">
        <img 
          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(window.location.origin + '/patient')}`}
          alt="Desk Station QR"
          className="w-20 h-20 block rounded select-none"
        />
      </div>

      <button
        onClick={() => {
          // Trigger a dummy registered state so they can print/share full details receipt immediately
          handleTriggerMockSuccess();
        }}
        className={`w-full py-2.5 px-3 rounded-xl border text-[10px] font-extrabold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
          darkMode ? 'border-slate-800 hover:bg-slate-805 text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
        }`}
      >
        <Printer className="w-3.5 h-3.5 text-amber-500" />
        <span>Print Poster / Slip Ticket</span>
      </button>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-24 relative select-none" id="receptionist-premium-flow">
      
      {/* 
        -----------------------------------------
        1. RECEPTION HEADER WITH CLINIC LIVE BADGE
        -----------------------------------------
      */}
      <div className={`p-4 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 text-left ${
        darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/60 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-650 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/10">
            {receptionist.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-sans font-black text-sm text-slate-900 dark:text-slate-100 leading-tight">
                {receptionist.name}
              </h3>
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" title="Desk Station Online" />
            </div>
            <p className="text-[10px] text-blue-601 dark:text-blue-450 font-bold uppercase tracking-widest mt-0.5">
              🏥 Clinic Concierge • {receptionist.room}
            </p>
          </div>
        </div>
        
        {/* Actions header bar */}
        <div className="flex items-center gap-2">
          {/* Quick links to live output display */}
          <button 
            onClick={() => navigate('/display')}
            className={`p-2 rounded-xl border flex items-center gap-1 text-[10px] uppercase font-black tracking-wider transition-colors cursor-pointer ${
              darkMode ? 'border-slate-800 bg-slate-950 text-slate-350 hover:bg-slate-900' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
            title="Open public display status"
          >
            <Monitor className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Wait Display</span>
          </button>

          <button 
            onClick={() => {
              logoutReceptionist();
              navigate('/');
            }}
            className="text-[10px] uppercase font-black tracking-widest text-white bg-rose-600 hover:bg-rose-700 py-2 px-3.5 rounded-xl text-center cursor-pointer transition-colors shadow-xs shadow-rose-500/10"
            id="receptionist-logout-btn"
          >
            Exit desk
          </button>
        </div>
      </div>

      {/* 
        -----------------------------------------
        2. PROFESSIONAL RESPONSIVE BENTO GRID LAYOUT
        -----------------------------------------
        Mobile (<768px): Vertical stacked list.
        Tablet (>=768px & <1024px): 2 Column layout.
        Desktop (>=1024px & Up): 3 Column dashboard master layout.
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 text-left">
        
        {/* COLUMN 1: INTENT & CONTROLLERS (Span 4 on Desktop, 1 on Tablet, 1 on Mobile) */}
        <div className="space-y-4 lg:col-span-4 flex flex-col justify-between h-fit">
          <CurrentTokenCard />
          <AddPatientCard />
          <div className="space-y-3">
            <AverageTimeCard />
            <StatisticsCard />
          </div>
        </div>

        {/* COLUMN 2: ACTIVE STANDBY PATIENT REGISTRY (Span 5 on Desktop, 1 on Tablet, 1 on Mobile) */}
        <div className="lg:col-span-5 h-full flex flex-col justify-between">
          <QueueListCard />
        </div>

        {/* COLUMN 3: UTILITIES & SYSTEM RECEPTIONS (Span 3 on Desktop, 2 on Tablet, 1 on Mobile) */}
        <div className="md:col-span-2 lg:col-span-3 space-y-4 h-fit">
          <QuickActionsCard />
          <QRGenerationCard />
        </div>

      </div>

      {/* 
        -----------------------------------------
        3. FLOATING CALL NEXT PATIENT TRIGGER BUTTON
        -----------------------------------------
      */}
      <div className="fixed bottom-6 right-6 z-40">
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
        4. MEMBER REGISTRATION SUCCESS RECEIPTS (MODALOVERLAYS)
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
                  Patient Registered Successfully
                </p>
              </div>

              {/* Receipt body */}
              <div className="p-5 space-y-4">
                
                {/* Patient Information Section */}
                <div className={`p-4 rounded-2.5xl border ${
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
                    <Share2 className="w-4 h-4 text-indigo-501" />
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
                      <span className="text-[8px] opacity-75">Save PNG Image</span>
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
