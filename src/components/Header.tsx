import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { LiveBadge } from './LiveBadge';
import { Sun, Moon, ArrowLeft, RefreshCw, Activity, HeartPulse, Settings, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstructionsModal } from './PWAInstallComponents';

export const Header: React.FC = () => {
  const { darkMode, toggleDarkMode, receptionist, logoutReceptionist } = useQueue();
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === '/';
  const showBackBtn = !isHome;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isInstalled, installState, installApp, resetDismissal, completeSimulatedInstall } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  const handleHeaderInstallClick = async () => {
    const result = await installApp();
    if (result.outcome === 'fallback') {
      setShowGuide(true);
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

          {/* Settings Custom trigger */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSettingsOpen(true)}
            className={`p-1.5 rounded-xl transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
            aria-label="Open settings panel"
            id="header-settings-button"
            title="Open applet configurations"
          >
            <Settings className="w-4.5 h-4.5" />
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

      {/* Settings Modal Overlay Drawer */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`relative w-full max-w-sm rounded-[24px] border p-5 shadow-2xl z-10 text-left ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
              id="global-settings-modal"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-sans font-black text-slate-900 dark:text-white text-[15px] flex items-center gap-2">
                  <Settings className="w-4.5 h-4.5 text-blue-500 animate-spin-slow" />
                  <span>Queue Cure Settings</span>
                </h3>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 rounded-full text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Settings Body Options */}
              <div className="space-y-4">
                
                {/* Theme toggle option */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">Theme Mode</span>
                    <span className="text-[10px] text-slate-400 font-medium">Eye-safe rendering mode</span>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                      darkMode 
                        ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20' 
                        : 'bg-slate-100 text-slate-705 hover:bg-slate-200'
                    }`}
                  >
                    {darkMode ? '🌙 Dark mode' : '☀️ Light mode'}
                  </button>
                </div>

                {/* Progressive Web App Configuration Setting Option */}
                <div className="py-2.5 border-t border-slate-100 dark:border-slate-850 pt-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">Install App</span>
                      <span className="text-[10px] text-slate-400 font-medium">Save to your launcher shortcuts</span>
                    </div>
                    
                    {isInstalled ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <Check className="w-3.5 h-3.5" />
                        <span>Installed ✓</span>
                      </span>
                    ) : (
                      <button
                        onClick={handleHeaderInstallClick}
                        className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase bg-teal-600 hover:bg-teal-700 text-white tracking-widest cursor-pointer shadow-xs transition-colors"
                      >
                        Install
                      </button>
                    )}
                  </div>

                  {/* Sandbox helper to reset/test flows */}
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 mt-1">
                    <span className="text-[9px] text-slate-450 font-medium">Test installer banner again</span>
                    <button
                      onClick={() => {
                        resetDismissal();
                        setIsSettingsOpen(false);
                        window.alert("Installer resets! Go to home to see install option.");
                      }}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 rounded text-[9px] font-bold text-slate-650 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      Reset State
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PWAInstructionsModal 
        isOpen={showGuide} 
        onClose={() => setShowGuide(false)}
        onSimulateInstall={completeSimulatedInstall}
      />
    </header>
  );
};
