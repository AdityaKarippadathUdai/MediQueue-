import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { 
  ClipboardList, 
  User, 
  Monitor, 
  CheckCircle2, 
  Heart, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  Zap,
  TrendingUp,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode } = useQueue();

  // Entrance animation containers
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 260, damping: 20 } 
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between px-5 pt-3 pb-6 relative overflow-hidden" id="home-portal-page">
      {/* Dynamic Ambient Background Shapes matching Android Medical Feel */}
      <div className="absolute top-[-80px] right-[-40px] w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-[220px] left-[-60px] w-40 h-40 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[40px] right-[-30px] w-36 h-36 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

      {/* Hero Header Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="text-center pt-5 pb-5 z-10"
      >
        {/* Animated App Logo Icon */}
        <div className="inline-flex justify-center items-center mb-3">
          <motion.div 
            animate={{ 
              scale: [1, 1.06, 1],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 3, 
              ease: "easeInOut" 
            }}
            className="p-3.5 rounded-2xl bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center"
          >
            <Heart className="w-6 h-6 fill-white/15" />
          </motion.div>
        </div>

        <h1 className="font-sans font-extrabold text-[26px] tracking-tight text-slate-900 dark:text-white leading-tight">
          Queue Cure '26
        </h1>
        <p className="font-sans font-semibold text-xs text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-wider">
          Smart Queue Management for Modern Clinics
        </p>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2 max-w-[320px] mx-auto leading-relaxed font-normal">
          Track patient queues in real time and reduce waiting uncertainty.
        </p>
      </motion.div>

      {/* Role Selection Container */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-3.5 z-10 my-1"
      >
        {/* RECEPTIONIST CARD */}
        <motion.div 
          variants={itemVariants}
          whileTap={{ scale: 0.985 }}
          className={`p-4 rounded-2xl border transition-all duration-200 group relative overflow-hidden ${
            darkMode 
              ? 'bg-slate-900/90 hover:bg-slate-850 border-slate-800' 
              : 'bg-white hover:bg-slate-50 border-slate-100 shadow-sm hover:shadow-md'
          }`}
          id="portal-receptionist-card"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <ClipboardList className="w-5.5 h-5.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Medical Staff</span>
              <h3 className="font-sans font-bold text-[15px] text-slate-900 dark:text-white mt-0.5">
                Receptionist
              </h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                Manage patient flow and call the next patient.
              </p>
              
              <button
                type="button"
                onClick={() => navigate('/reception-login')}
                className="mt-3.5 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 font-semibold rounded-xl text-[12px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Access Reception</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* PATIENT CARD */}
        <motion.div 
          variants={itemVariants}
          whileTap={{ scale: 0.985 }}
          className={`p-4 rounded-2xl border transition-all duration-200 group relative overflow-hidden ${
            darkMode 
              ? 'bg-slate-900/90 hover:bg-slate-850 border-slate-800' 
              : 'bg-white hover:bg-slate-50 border-slate-100 shadow-sm hover:shadow-md'
          }`}
          id="portal-patient-card"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <User className="w-5.5 h-5.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">General Access</span>
              <h3 className="font-sans font-bold text-[15px] text-slate-900 dark:text-white mt-0.5">
                Patient
              </h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                Track your token and estimated waiting time.
              </p>

              <button
                type="button"
                onClick={() => navigate('/patient')}
                className="mt-3.5 w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 font-semibold rounded-xl text-[12px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Track Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* PUBLIC DISPLAY CARD */}
        <motion.div 
          variants={itemVariants}
          whileTap={{ scale: 0.985 }}
          className={`p-4 rounded-2xl border transition-all duration-200 group relative overflow-hidden ${
            darkMode 
              ? 'bg-slate-900/90 hover:bg-slate-850 border-slate-800' 
              : 'bg-white hover:bg-slate-50 border-slate-100 shadow-sm hover:shadow-md'
          }`}
          id="portal-display-card"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Monitor className="w-5.5 h-5.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Waiting Lounge</span>
              <h3 className="font-sans font-bold text-[15px] text-slate-900 dark:text-white mt-0.5">
                Public Display
              </h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                Live queue display for clinic waiting areas.
              </p>

              <button
                type="button"
                onClick={() => navigate('/display')}
                className="mt-3.5 w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 font-semibold rounded-xl text-[12px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Open Display</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Features Showcase Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`mt-4 p-4 rounded-2xl border z-10 ${
          darkMode ? 'bg-slate-900/40 border-slate-850' : 'bg-slate-50 border-slate-100 shadow-inner'
        }`}
        id="portal-features-box"
      >
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-2.5 block text-center">
          Supercharged Health System Features
        </span>
        
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 truncate">
              Live Queue Updates
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 truncate">
              Wait Estimation
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 truncate">
              Mobile Friendly
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-350 truncate">
              Instant Sync
            </span>
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
