import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { 
  Download, Check, Sparkles, 
  Info, Monitor, RefreshCw 
} from 'lucide-react';

// ==========================================
// 1. INSTALL STATUS BADGE COMPONENT
// ==========================================
export const InstallStatusBadge: React.FC = () => {
  const { installState, isInstalled } = usePWAInstall();

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-500/20">
        <Check className="w-3.5 h-3.5" />
        <span>Installed ✓</span>
      </span>
    );
  }

  switch (installState) {
    case 'prompting':
      return (
        <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-blue-500/20">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Prompt Open</span>
        </span>
      );
    case 'available':
      return (
        <span className="inline-flex items-center gap-1 bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-teal-500/20">
          <Download className="w-3.5 h-3.5" />
          <span>Available to Install</span>
        </span>
      );
    case 'dismissed':
      return (
        <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-500/20">
          <Info className="w-3.5 h-3.5" />
          <span>Install Dismissed</span>
        </span>
      );
    case 'unavailable':
    default:
      return (
        <span className="inline-flex items-center gap-1 bg-slate-500/10 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-slate-500/20">
          <Info className="w-3.5 h-3.5" />
          <span>Install Unavailable</span>
        </span>
      );
  }
};

// ==========================================
// 2. INSTALL APP BANNER COMPONENT
// ==========================================
export const InstallAppBanner: React.FC = () => {
  const { isInstallable, installState, installApp, dismissPrompt } = usePWAInstall();

  // If already installed or dismissed, do not render banner at all
  if (!isInstallable || installState === 'installed' || installState === 'dismissed') {
    return null;
  }

  const handleInstallClick = async () => {
    await installApp();
  };

  return (
    <div className="w-full bg-[#ECFDF5] dark:bg-emerald-950/20 border-b border-emerald-500/10 dark:border-emerald-500/20">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
        
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 flex-shrink-0 animate-pulse">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-[11px] font-black text-emerald-850 dark:text-emerald-400 uppercase tracking-widest leading-none">
              Get Queue Cure PWA
            </h5>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-semibold leading-none">
              Install Queue Cure on your device for instant offline tracker access from your home screen.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={dismissPrompt}
            className="px-3.5 py-2 rounded-xl text-[10px] font-black text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-200 uppercase tracking-wider transition-all cursor-pointer"
          >
            Maybe Later
          </button>
          <button
            onClick={handleInstallClick}
            disabled={installState === 'prompting'}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-650 hover:from-teal-600 hover:to-emerald-700 disabled:opacity-60 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{installState === 'prompting' ? 'Opening...' : 'Install App'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 3. INSTALL APP CARD COMPONENT
// ==========================================
export const InstallAppCard: React.FC = () => {
  const { isInstalled, isInstallable, installState, installApp } = usePWAInstall();

  const handleInstallClick = async () => {
    if (isInstalled || !isInstallable) return;
    await installApp();
  };

  return (
    <div 
      className="p-5 rounded-3xl border text-left bg-gradient-to-br from-teal-50/25 via-emerald-50/10 to-teal-50/25 dark:from-teal-950/10 dark:via-emerald-950/5 dark:to-slate-900 border-teal-500/20 shadow-xs flex flex-col justify-between h-[155px] relative overflow-hidden"
      id="pwa-install-metric-card"
    >
        {/* Decorative ambient bubble */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-xl pointer-events-none" />

        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest pl-0.5">
              STANDALONE DESKTOP
            </span>
            <p className="text-[8.5px] text-slate-400 font-semibold tracking-wider mt-0.5 uppercase pl-0.5">Offline Progressive Experience</p>
          </div>
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600">
            <Monitor className="w-4 h-4" />
          </div>
        </div>

        <div className="my-1">
          {isInstalled ? (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-450">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span className="font-extrabold text-sm tracking-tight">Active Installed Mode ✓</span>
            </div>
          ) : (
            <h5 className="text-xs md:text-[13px] font-black text-slate-850 dark:text-white leading-tight">
              Install Queue Cure Desktop
            </h5>
          )}
          <span className="text-[10.5px] text-slate-405 block leading-tight mt-0.5">
            {isInstalled 
              ? "Running in pristine native desktop performance." 
              : isInstallable
                ? "Launch directly from your desktop Taskbar, Start, or Dock."
                : "Browser install prompt will appear here when available."}
          </span>
        </div>

        <div className="flex justify-between items-center z-10">
          <span className="text-[10px] text-slate-400 font-medium">
            {isInstalled ? "Updates automatically" : isInstallable ? "Offline ready tool" : "Waiting for browser prompt"}
          </span>

          <button
            onClick={handleInstallClick}
            disabled={isInstalled || !isInstallable || installState === 'prompting'}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              isInstalled 
                ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450' 
                : isInstallable
                  ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs hover:shadow-md hover:shadow-teal-500/15'
                  : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed'
            }`}
          >
            {isInstalled ? 'Installed ✓' : installState === 'prompting' ? 'Opening...' : isInstallable ? 'Install' : 'Unavailable'}
          </button>
        </div>
      </div>
  );
};
