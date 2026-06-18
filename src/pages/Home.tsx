import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { 
  ClipboardList, 
  User, 
  Monitor, 
  Heart, 
  Sparkles, 
  ArrowRight,
  Zap,
  TrendingUp,
  Smartphone,
  RefreshCw,
  QrCode,
  Wifi,
  Clock,
  Activity,
  Layers,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode } = useQueue();
  const [greeting, setGreeting] = useState('Welcome to Queue Cure');

  // Dynamic empathetic clinical greeting based on current local time
  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) {
      setGreeting('Good Morning • Ready for Clinic Standby');
    } else if (hr < 17) {
      setGreeting('Good Afternoon • Clinic Queue Portal');
    } else {
      setGreeting('Good Evening • Clinic Lounge Operational');
    }
  }, []);

  // Entrance animation configurations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 220, damping: 18 } 
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between px-5 pt-4 pb-8 relative overflow-hidden" id="home-portal-page">
      
      {/* Decorative High-Contrast Organic Ambient Glows */}
      <div className="absolute top-[-90px] right-[-50px] w-60 h-60 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-[250px] left-[-70px] w-48 h-48 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[30px] right-[-20px] w-40 h-40 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

      {/* ================= HERO SECTION (Healthcare illustrations & Professional clinic branding) ================= */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.97, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center pt-3 pb-4 z-10 flex flex-col items-center"
      >
        {/* Dynamic Empathy Greeting Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/15 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3.5 shadow-sm border border-blue-500/5">
          <Activity className="w-3 h-3 text-blue-500 animate-pulse" />
          <span>{greeting}</span>
        </div>

        {/* Animated Clinical Brand Logo / Core Heartbeat Illustration */}
        <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
          
          {/* Heartbeat pulse circles behind */}
          <div className="absolute inset-0 bg-blue-600/10 dark:bg-blue-500/10 rounded-full animate-ping pointer-events-none opacity-45" />
          <div className="absolute inset-2 bg-indigo-600/10 dark:bg-indigo-500/10 rounded-full animate-pulse pointer-events-none opacity-75" />
          
          {/* Main stylized icon */}
          <motion.div 
            whileHover={{ scale: 1.08, rotate: 5 }}
            className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-700 text-white rounded-2.5xl shadow-lg shadow-blue-500/25 flex items-center justify-center relative z-10"
          >
            <Heart className="w-6.5 h-6.5 fill-white/10 text-white" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center">
              <span className="text-[10px] text-white font-black leading-none">26</span>
            </div>
          </motion.div>
        </div>

        {/* Title & Slogan */}
        <h1 className="font-sans font-black text-2xl tracking-tight text-slate-900 dark:text-white leading-tight">
          Queue Cure <span className="text-blue-600 dark:text-blue-400">'2026</span>
        </h1>
        <p className="font-mono text-[10px] text-slate-450 dark:text-slate-500 uppercase tracking-widest mt-1 font-bold">
          🏥 Next-Generation Triage & Waiting Standby
        </p>
      </motion.div>

      {/* ================= CLINIC CARD OPTIONS GRID ================= */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4 z-10 my-2"
      >
        
        {/* RECEPTIONIST CARD */}
        <motion.div 
          variants={itemVariants}
          className={`p-4 rounded-3xl border transition-all duration-200 relative overflow-hidden group ${
            darkMode 
              ? 'bg-slate-950/80 border-slate-800' 
              : 'bg-white border-slate-150 shadow-xs hover:shadow-md'
          }`}
          id="portal-receptionist-card"
        >
          {/* Background card label code accent */}
          <div className="absolute top-3 right-4 font-mono text-[8px] font-black tracking-widest text-slate-350 dark:text-slate-700 uppercase">
            STATION 1 INTAKE
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/35 text-blue-600 dark:text-blue-404 flex-shrink-0 mt-0.5">
              <ClipboardList className="w-5.5 h-5.5" />
            </div>
            
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-extrabold text-blue-500 uppercase tracking-widest">Medical Staff</span>
                <span className="text-[9px] text-slate-300 dark:text-slate-800">|</span>
                <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-slate-400" /> Secure
                </span>
              </div>
              
              <h3 className="font-sans font-black text-[14.5px] text-slate-950 dark:text-white mt-0.5">
                Receptionist
              </h3>
              
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 leading-normal font-normal">
                Manage patient queues and call the next patient.
              </p>

              <button
                type="button"
                onClick={() => navigate('/reception-login')}
                className="mt-3.5 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 font-extrabold rounded-xl text-[11.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-blue-500/10 active:scale-[0.99] hover:translate-x-0.5"
              >
                <span>Access Reception</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-100" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* PATIENT CARD */}
        <motion.div 
          variants={itemVariants}
          className={`p-4 rounded-3xl border transition-all duration-200 relative overflow-hidden group ${
            darkMode 
              ? 'bg-slate-950/80 border-slate-800' 
              : 'bg-white border-slate-150 shadow-xs hover:shadow-md'
          }`}
          id="portal-patient-card"
        >
          {/* Background card label code accent */}
          <div className="absolute top-3 right-4 font-mono text-[8px] font-black tracking-widest text-slate-350 dark:text-slate-700 uppercase">
            GUEST STATUS
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/35 text-emerald-600 dark:text-emerald-404 flex-shrink-0 mt-0.5">
              <User className="w-5.5 h-5.5" />
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-extrabold text-emerald-500 uppercase tracking-widest">Self Service</span>
                <span className="text-[9px] text-slate-300 dark:text-slate-800">|</span>
                <span className="text-[9px] text-emerald-500 font-bold">QR Enabled</span>
              </div>

              <h3 className="font-sans font-black text-[14.5px] text-slate-950 dark:text-white mt-0.5">
                Patient
              </h3>

              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 leading-normal font-normal">
                Track your queue position using a token number or QR code.
              </p>

              <button
                type="button"
                onClick={() => navigate('/patient')}
                className="mt-3.5 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 font-extrabold rounded-xl text-[11.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-500/10 active:scale-[0.99] hover:translate-x-0.5"
              >
                <span>Track My Queue</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-100" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* PUBLIC DISPLAY CARD */}
        <motion.div 
          variants={itemVariants}
          className={`p-4 rounded-3xl border transition-all duration-200 relative overflow-hidden group ${
            darkMode 
              ? 'bg-slate-950/80 border-slate-800' 
              : 'bg-white border-slate-150 shadow-xs hover:shadow-md'
          }`}
          id="portal-display-card"
        >
          {/* Background card label code accent */}
          <div className="absolute top-3 right-4 font-mono text-[8px] font-black tracking-widest text-slate-350 dark:text-slate-700 uppercase">
            WAITING ROOM DISPLAY
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-900/35 text-indigo-600 dark:text-indigo-404 flex-shrink-0 mt-0.5">
              <Monitor className="w-5.5 h-5.5" />
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-extrabold text-indigo-505 uppercase tracking-widest">Waiting Lounge</span>
                <span className="text-[9px] text-slate-300 dark:text-slate-800">|</span>
                <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full"></span> Live
                </span>
              </div>

              <h3 className="font-sans font-black text-[14.5px] text-slate-950 dark:text-white mt-0.5">
                Public Display
              </h3>

              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 leading-normal font-normal">
                View live queue information for waiting rooms.
              </p>

              <button
                type="button"
                onClick={() => navigate('/display')}
                className="mt-3.5 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 font-extrabold rounded-xl text-[11.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-indigo-500/10 active:scale-[0.99] hover:translate-x-0.5"
              >
                <span>Open Display</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-100" />
              </button>
            </div>
          </div>
        </motion.div>

      </motion.div>

      {/* ================= SUPERCHARGED HEALTH SYSTEM INHERENT FEATURES ================= */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45 }}
        className={`mt-4 p-4.5 rounded-3xl border z-10 text-left ${
          darkMode ? 'bg-slate-900/40 border-slate-850' : 'bg-slate-50 border-slate-100'
        }`}
        id="portal-features-box"
      >
        <div className="flex items-center justify-between mb-3 border-b border-slate-200/50 dark:border-slate-800/50 pb-2">
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Feature Highlights</span>
          </span>
          
          <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/10">
            <CheckCircle2 className="w-3 h-3" /> Fully Operational
          </div>
        </div>

        {/* Interactive Responsive Grid of standard bullet items requested */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Live Updates */}
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
              <Wifi className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[11.5px] font-black text-slate-900 dark:text-slate-200 block">
                Live Updates
              </span>
              <span className="text-[9px] text-slate-400 block leading-tight">
                Synced push reports
              </span>
            </div>
          </div>

          {/* QR Tracking */}
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5">
              <QrCode className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[11.5px] font-black text-slate-900 dark:text-slate-200 block">
                QR Tracking
              </span>
              <span className="text-[9px] text-slate-400 block leading-tight">
                Scan guest receipts
              </span>
            </div>
          </div>

          {/* Wait Time Prediction */}
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[11.5px] font-black text-slate-900 dark:text-slate-200 block">
                Wait Prediction
              </span>
              <span className="text-[9px] text-slate-400 block leading-tight">
                AI delay forecasting
              </span>
            </div>
          </div>

          {/* Mobile Friendly */}
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[11.5px] font-black text-slate-900 dark:text-slate-200 block">
                Mobile Friendly
              </span>
              <span className="text-[9px] text-slate-400 block leading-tight">
                Responsive layouts
              </span>
            </div>
          </div>

          {/* PWA Ready */}
          <div className="flex items-start gap-2.5 col-span-2 border-t border-slate-105 dark:border-slate-800/40 pt-2.5 mt-0.5">
            <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[11.5px] font-black text-slate-900 dark:text-slate-200 block">
                PWA Ready Seamless Sandbox
              </span>
              <span className="text-[9.5px] text-slate-400 block leading-normal mt-0.5">
                Install as a mobile app launcher on iOS, Android & modern web containers.
              </span>
            </div>
          </div>

        </div>
      </motion.div>

      {/* ================= BRADING CLOUD FOOTER ================= */}
      <div className="pt-4 text-center select-none font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        Queue Cure '26 • Live Clinic Network Host
      </div>
      
    </div>
  );
};
