import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useQueue } from '../context/QueueContext';

export const PWAUpdatePrompt: React.FC = () => {
  const { darkMode } = useQueue();
  
  // Need to disable TypeScript checks for the virtual module if it complains, but vite-plugin-pwa provides types.
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
        >
          <div className={`p-4 rounded-2xl shadow-2xl border flex flex-col gap-3 ${
            darkMode 
              ? 'bg-slate-900 border-slate-700/80 shadow-slate-900/50' 
              : 'bg-white border-slate-200 shadow-slate-200/50'
          }`}>
            
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[13px] text-slate-900 dark:text-white uppercase tracking-wider">
                    New Version Available
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    An update has been downloaded in the background.
                  </p>
                </div>
              </div>
              
              <button 
                onClick={close}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => updateServiceWorker(true)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Update Now</span>
              </button>
              <button
                onClick={close}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  darkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Later
              </button>
            </div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
