import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { 
  Download, Smartphone, Laptop, Check, X, Sparkles, 
  Info, Bookmark, Heart, Monitor, ExternalLink, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
    case 'installing':
      return (
        <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-blue-500/20">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Installing...</span>
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
    default:
      return (
        <span className="inline-flex items-center gap-1 bg-slate-500/10 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-slate-500/20">
          <Info className="w-3.5 h-3.5" />
          <span>Not Installed</span>
        </span>
      );
  }
};

// ==========================================
// 2. MANUAL PWA INSTRUCTIONS DIALOG/MODAL
// ==========================================
interface PWAInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateInstall: () => void;
}

export const PWAInstructionsModal: React.FC<PWAInstructionsModalProps> = ({ 
  isOpen, 
  onClose,
  onSimulateInstall
}) => {
  const [activeTab, setActiveTab] = useState<'safari' | 'chrome' | 'android'>('chrome');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 text-left overflow-hidden"
        >
          {/* Header decorative band */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-blue-600" />

          {/* Close trigger */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex gap-4 items-start mb-5">
            <div className="p-3 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-2xl flex-shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">Manual Installation Guide</h3>
              <p className="text-xs text-slate-405 dark:text-slate-400 mt-1">
                Queue Cure is ready for direct installation. Follow these easy steps to put it on your system home screen or taskbar.
              </p>
            </div>
          </div>

          {/* Operating System Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 mb-4 text-xs font-bold gap-3">
            <button
              onClick={() => setActiveTab('chrome')}
              className={`pb-2.5 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'chrome' 
                  ? 'border-teal-500 text-teal-600 dark:text-teal-450' 
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>Chrome & Edge (Desktop)</span>
            </button>
            <button
              onClick={() => setActiveTab('android')}
              className={`pb-2.5 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'android' 
                  ? 'border-teal-500 text-teal-600 dark:text-teal-450' 
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Android (Chrome)</span>
            </button>
            <button
              onClick={() => setActiveTab('safari')}
              className={`pb-2.5 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'safari' 
                  ? 'border-teal-500 text-teal-600 dark:text-teal-450' 
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>iPhone & iPad (Safari)</span>
            </button>
          </div>

          {/* Instructions Box */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 text-xs text-slate-650 dark:text-slate-300 space-y-3">
            {activeTab === 'chrome' && (
              <ol className="list-decimal pl-4 space-y-2 leading-relaxed">
                <li>Look at the far right of Google Chrome's address bar at the top of your screen.</li>
                <li>Click the <strong className="text-teal-600 dark:text-teal-400">Install Arrow Icon</strong> next to the bookmark star.</li>
                <li>Or, click the <strong className="text-teal-600 dark:text-teal-400">Three dots (Menu)</strong> → <strong className="font-semibold text-slate-800 dark:text-white">Save and Share</strong> → <strong className="font-semibold text-slate-805 dark:text-white">Install App...</strong></li>
                <li>Accept the prompt to place Queue Cure on your desktop taskbar.</li>
              </ol>
            )}

            {activeTab === 'android' && (
              <ol className="list-decimal pl-4 space-y-2 leading-relaxed">
                <li>Open the page in Google Chrome on your Android smartphone.</li>
                <li>Tap the <strong className="text-teal-600 dark:text-teal-400">Three vertical dots (Menu)</strong> next to the URL input field.</li>
                <li>Tap <strong className="font-semibold text-slate-800 dark:text-white">Add to Home Screen</strong> or <strong className="font-semibold text-slate-800 dark:text-white">Install App</strong>.</li>
                <li>A shortcut tile is instantly generated with Queue Cure's medical icon.</li>
              </ol>
            )}

            {activeTab === 'safari' && (
              <ol className="list-decimal pl-4 space-y-2 leading-relaxed">
                <li>Load this tracker URL in your default <strong className="text-sky-650">Safari Browser</strong>.</li>
                <li>Tap the <strong className="text-teal-601 font-semibold dark:text-teal-400">Share Button</strong> (square icon with an arrow pointing upward) in the browser bottom dock.</li>
                <li>Scroll down the action sheets and select <strong className="font-semibold text-slate-800 dark:text-white">Add to Home Screen</strong>.</li>
                <li>Tap <strong className="text-teal-600 dark:text-teal-400 font-extrabold">Add</strong> in the top right to complete iOS shortcut configuration.</li>
              </ol>
            )}
          </div>

          <div className="flex items-center justify-between mt-5 gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
            <span className="text-[10px] text-slate-400 font-medium leading-tight">
              🛠️ Sandbox Preview detected. Testing locally? Try the simulator button.
            </span>

            <div className="flex gap-2">
              <button
                onClick={onSimulateInstall}
                className="px-3.5 py-2 rounded-xl text-[10px] font-black uppercase bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-450 tracking-wider transition-colors cursor-pointer"
              >
                Simulate Done ✅
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-100 hover:bg-slate-150 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 tracking-wider transition-all cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


// ==========================================
// 3. INSTALL APP BANNER COMPONENT
// ==========================================
export const InstallAppBanner: React.FC = () => {
  const { isInstallable, installState, installApp, dismissPrompt, completeSimulatedInstall } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already installed or dismissed, do not render banner at all
  if (!isInstallable || installState === 'installed' || installState === 'dismissed') {
    return null;
  }

  const handleInstallClick = async () => {
    const result = await installApp();
    if (result.outcome === 'fallback') {
      setShowGuide(true);
    }
  };

  return (
    <>
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
                Install Queue Cure on your device for instant offline tracker access from your home screen!
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
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-650 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          </div>
        </div>
      </div>

      <PWAInstructionsModal 
        isOpen={showGuide} 
        onClose={() => setShowGuide(false)} 
        onSimulateInstall={() => {
          completeSimulatedInstall();
          setShowGuide(false);
        }}
      />
    </>
  );
};


// ==========================================
// 4. INSTALL APP CARD COMPONENT
// ==========================================
export const InstallAppCard: React.FC = () => {
  const { isInstalled, installState, installApp, completeSimulatedInstall } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  const handleInstallClick = async () => {
    if (isInstalled) return;
    const result = await installApp();
    if (result.outcome === 'fallback') {
      setShowGuide(true);
    }
  };

  return (
    <>
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
              : "Launch directly from your desktop Taskbar, Start, or Dock."}
          </span>
        </div>

        <div className="flex justify-between items-center z-10">
          <span className="text-[10px] text-slate-400 font-medium">
            {isInstalled ? "Updates automatically" : "Offline ready tool"}
          </span>

          <button
            onClick={handleInstallClick}
            disabled={isInstalled}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              isInstalled 
                ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450' 
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs hover:shadow-md hover:shadow-teal-500/15'
            }`}
          >
            {isInstalled ? 'Installed ✓' : 'Install'}
          </button>
        </div>
      </div>

      <PWAInstructionsModal 
        isOpen={showGuide} 
        onClose={() => setShowGuide(false)} 
        onSimulateInstall={() => {
          completeSimulatedInstall();
          setShowGuide(false);
        }}
      />
    </>
  );
};
