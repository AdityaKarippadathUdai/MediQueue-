import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { LiveBadge } from './LiveBadge';
import { Sun, Moon, ArrowLeft, RefreshCw, Activity, HeartPulse } from 'lucide-react';
import { motion } from 'motion/react';

export const Header: React.FC = () => {
  const { darkMode, toggleDarkMode, resetQueue, receptionist, logoutReceptionist } = useQueue();
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === '/';
  const showBackBtn = !isHome;

  const handleReset = () => {
    if (window.confirm('Reset the queue state back to mock admissions?')) {
      resetQueue();
    }
  };

  const handlesBackClick = () => {
    if (location.pathname === '/receptionist') {
      // If logging out receptionist
      logoutReceptionist();
      navigate('/');
    } else {
      navigate('/');
    }
  };

  return (
    <header className={`px-4 py-3 border-b sticky top-0 z-30 transition-colors duration-300 backdrop-blur-md 
      ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200/80'}`}
    >
      <div className="flex items-center justify-between">
        {/* Navigation / Brand block */}
        <div className="flex items-center gap-2">
          {showBackBtn ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handlesBackClick}
              className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
              aria-label="Go back"
              id="header-back-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
              className="p-1.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/25"
            >
              <HeartPulse className="w-5 h-5" />
            </motion.div>
          )}

          <div 
            onClick={() => navigate('/')} 
            className="cursor-pointer select-none"
            id="header-brand-logo"
          >
            <h1 className="font-display font-extrabold text-[15px] leading-tight tracking-tight text-blue-600 dark:text-blue-400">
              Queue Cure <span className="text-emerald-500 font-bold">'26</span>
            </h1>
            <p className={`text-[9px] font-medium tracking-wide uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Speedy Clinic Triage
            </p>
          </div>
        </div>

        {/* Action Widgets */}
        <div className="flex items-center gap-2">
          {/* Reset simulation helper helpful for review */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleReset}
            className={`p-1.5 rounded-xl transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
            title="Reset to default mock queue"
            id="header-reset-state-button"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>

          {/* Theme custom pill toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleDarkMode}
            className={`p-1.5 rounded-xl transition-colors ${darkMode ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-100 text-slate-600'}`}
            aria-label="Toggle theme mode"
            id="header-theme-toggle-button"
          >
            {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </motion.button>

          <LiveBadge />
        </div>
      </div>

      {/* Context-aware Sub-header Bar displaying logged user if receptionist */}
      {receptionist && location.pathname === '/receptionist' && (
        <div className="mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Room: <strong className="text-blue-600 dark:text-blue-400 font-semibold">{receptionist.room}</strong></span>
          </div>
          <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">Staff: {receptionist.name}</span>
        </div>
      )}
    </header>
  );
};
