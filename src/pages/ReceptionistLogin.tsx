import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Check, 
  Heart, 
  KeyRound,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ReceptionistLogin: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsReceptionist, darkMode } = useQueue();

  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');

  // Animation variants for the shake effect
  const shakeVariants = {
    shake: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.4, ease: 'easeInOut' }
    }
  };

  const [shakeTrigger, setShakeTrigger] = useState(false);

  const handleDigitClick = (digit: string) => {
    if (status === 'verifying' || status === 'success') return;
    setError('');
    setStatus('idle');
    if (pin.length < 4) {
      setPin(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (status === 'verifying' || status === 'success') return;
    setError('');
    setStatus('idle');
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (status === 'verifying' || status === 'success') return;
    setError('');
    setStatus('idle');
    setPin('');
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (status === 'verifying' || status === 'success') return;

    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN.');
      setStatus('error');
      setShakeTrigger(prev => !prev);
      return;
    }

    setStatus('verifying');
    setError('');

    // Simulate verification delay
    setTimeout(() => {
      if (pin === '1234') {
        setStatus('success');
        // Persist local storage as requested
        localStorage.setItem('receptionAccess', 'true');
        
        // Log in as standard receptionist Sarah to pass Route Protection in receptionist.tsx
        loginAsReceptionist('sarah_triage', 'Nurse Sarah', 'Triage Desk A');

        // Redirect after showing success animation
        setTimeout(() => {
          navigate('/receptionist');
        }, 1200);
      } else {
        setStatus('error');
        setError('Incorrect Access PIN. Please try again.');
        setShakeTrigger(prev => !prev);
      }
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col justify-between px-5 pt-3 pb-6 relative overflow-hidden" id="clinic-pin-portal">
      {/* Background Ambient Aesthetics */}
      <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20px] left-[-30px] w-40 h-40 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

      {/* Security Info Header */}
      <div className="z-10 py-3 text-center">
        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
          Queue Cure • Administration Security
        </span>
        <div className="h-0.5 w-12 bg-blue-500 mx-auto mt-2 rounded-full" />
      </div>

      <motion.div
        animate={shakeTrigger ? "shake" : ""}
        variants={shakeVariants}
        className="flex-1 flex flex-col justify-center max-w-[380px] mx-auto w-full z-10"
      >
        {/* Main Lock Card */}
        <div className={`p-5 rounded-3xl border transition-all duration-300 ${
          darkMode 
            ? 'bg-slate-900 border-slate-800 shadow-xl' 
            : 'bg-white border-slate-100 shadow-md shadow-slate-100/70'
        }`}>
          {/* Header Layout requested */}
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-1 text-slate-450 dark:text-slate-500 text-[11px] font-bold tracking-tight mb-2.5">
              <Heart className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />
              <span>Queue Cure</span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-500 dark:text-blue-400">Reception Access</span>
            </div>

            {/* Custom Icon status animates */}
            <motion.div 
              animate={{ 
                scale: status === 'success' ? [1, 1.15, 1] : 1,
              }}
              className={`p-3.5 rounded-2xl mb-3 flex items-center justify-center transition-all duration-300 ${
                status === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : status === 'error'
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                    : 'bg-blue-50/80 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
              }`}
            >
              {status === 'success' ? (
                <Unlock className="w-6.5 h-6.5" />
              ) : (
                <Lock className="w-6.5 h-6.5" />
              )}
            </motion.div>

            {/* Title / Desc requested */}
            <h2 className="font-sans font-extrabold text-[18px] text-slate-900 dark:text-white tracking-tight">
              Clinic Access Required
            </h2>
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 max-w-[260px] leading-relaxed">
              Enter clinic PIN to manage the queue.
            </p>
          </div>

          {/* Form and Input Area */}
          <form onSubmit={handleVerify} className="mt-5 space-y-4">
            
            {/* PIN Input with Show / Hide Toggle */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  4-Digit Access PIN
                </label>
              </div>

              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type={showPin ? "text" : "password"}
                  value={pin}
                  readOnly
                  maxLength={4}
                  placeholder="••••"
                  className={`w-full pl-10 pr-12 py-3 rounded-2xl text-center text-lg select-all font-mono tracking-[0.4em] border focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 transition-all ${
                    status === 'error'
                      ? 'border-rose-450 bg-rose-50/10 dark:bg-rose-950/10 text-rose-600'
                      : status === 'success'
                        ? 'border-emerald-450 bg-emerald-50/10 dark:bg-emerald-950/10 text-emerald-600 font-bold'
                        : darkMode 
                          ? 'bg-slate-955 border-slate-800 text-white focus:border-blue-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                  }`}
                />
                
                {/* Show/Hide PIN toggle requested */}
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors cursor-pointer rounded-lg"
                  title={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Verification Status Banner */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-semibold flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center justify-center gap-2"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                  >
                    <Check className="w-4 h-4" />
                  </motion.span>
                  <span>Access Granted! Redirecting...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Access Button with states requested */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={status === 'verifying' || status === 'success'}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                status === 'success'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                  : status === 'verifying'
                    ? 'bg-slate-300 dark:bg-slate-850 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 dark:bg-blue-500 dark:hover:bg-blue-600'
              }`}
            >
              {status === 'verifying' ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4.5 w-4.5 text-slate-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verifying...</span>
                </div>
              ) : status === 'success' ? (
                <span>Access Granted</span>
              ) : (
                <span>Access Queue</span>
              )}
            </motion.button>
          </form>

          {/* Large touch-friendly numpad */}
          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-3 gap-2 text-center">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitClick(digit)}
                  className={`py-3 rounded-xl font-sans font-bold text-base transition-colors cursor-pointer select-none ${
                    darkMode
                      ? 'bg-slate-950 hover:bg-slate-850 text-white border border-slate-850'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-750'
                  }`}
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className={`py-3 rounded-xl font-semibold text-xs tracking-wide transition-colors cursor-pointer select-none ${
                  darkMode
                    ? 'bg-slate-955 hover:bg-slate-850 text-slate-400'
                    : 'bg-slate-100/50 hover:bg-slate-100 text-slate-500'
                }`}
              >
                CLEAR
              </button>
              <button
                type="button"
                onClick={() => handleDigitClick('0')}
                className={`py-3 rounded-xl font-sans font-bold text-base transition-colors cursor-pointer select-none ${
                  darkMode
                    ? 'bg-slate-950 hover:bg-slate-850 text-white border border-slate-850'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-750'
                }`}
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className={`py-3 rounded-xl font-semibold text-xs tracking-wide transition-colors cursor-pointer select-none ${
                  darkMode
                    ? 'bg-slate-955 hover:bg-slate-850 text-slate-400'
                    : 'bg-slate-100/50 hover:bg-slate-100 text-slate-500'
                }`}
                title="Backspace"
              >
                ⌫
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="pt-4 text-center select-none font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
        Queue Cure '26 • Real-time Triage v1.2
      </div>
    </div>
  );
};
