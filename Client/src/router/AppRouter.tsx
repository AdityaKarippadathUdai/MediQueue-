import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Home } from '../pages/Home';
import { Patient } from '../pages/Patient';
import { Receptionist } from '../pages/Receptionist';
import { ReceptionistLogin } from '../pages/ReceptionistLogin';
import { Display } from '../pages/Display';
import { Header } from '../components/Header';
import { MobileContainer } from '../components/MobileContainer';
import { useQueue } from '../context/QueueContext';
import { motion, AnimatePresence } from 'motion/react';

// Patient layout wrapping Home, Entry, and Waiting tracker inside highly realistic mobile device frames
const PatientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MobileContainer>
      <Header />
      {children}
    </MobileContainer>
  );
};

// Full-screen layout with full responsive width for receptionist, receptionist-login, and live displays
const FullWidthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { darkMode } = useQueue();

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${
      darkMode ? 'bg-slate-950 text-slate-150' : 'bg-[#F8FAFC] text-slate-800'
    } flex flex-col`}>
      <main className="flex-1 flex flex-col w-full h-full">
        {children}
      </main>
    </div>
  );
};

const RootRouter: React.FC = () => {
  const location = useLocation();
  
  // High reliability pattern to detect if the route should be full-screen on desktop
  const isFullWidth = /^\/(receptionist|reception-login|display)/i.test(location.pathname);

  // Smooth route transitions
  const animationProps = {
    initial: { opacity: 0, y: isFullWidth ? 8 : 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: isFullWidth ? -8 : -12 },
    transition: { duration: 0.25, ease: 'easeInOut' },
    className: "flex-1 flex flex-col w-full"
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} {...animationProps}>
        <Routes location={location}>
          {/* Full-width responsive desktop screens */}
          <Route path="/reception-login" element={<FullWidthLayout><ReceptionistLogin /></FullWidthLayout>} />
          <Route path="/receptionist" element={<FullWidthLayout><Receptionist /></FullWidthLayout>} />
          <Route path="/display" element={<FullWidthLayout><Display /></FullWidthLayout>} />

          {/* Patient simulation mobile layout screens */}
          <Route path="/" element={<PatientLayout><Home /></PatientLayout>} />
          <Route path="/patient" element={<PatientLayout><Patient /></PatientLayout>} />
          <Route path="/patient/:tokenId" element={<PatientLayout><Patient /></PatientLayout>} />
          
          {/* Fallback to Home wrapped in safe Patient frame */}
          <Route path="*" element={<PatientLayout><Home /></PatientLayout>} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

export const AppRouter: React.FC = () => {
  const { toasts, removeToast, isOnline } = useQueue();

  return (
    <BrowserRouter>
      <RootRouter />

      {/* Offline Notice Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-rose-600 text-white p-2 text-center text-xs font-bold shadow-md flex justify-center items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            You are currently offline. Realtime updates are paused.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global animated floating toast notification drawer */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-55 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-[380px] pointer-events-none">
        <AnimatePresence>
          {toasts && toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 25, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className={`p-3 px-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center justify-between gap-3 pointer-events-auto ${
                t.type === 'error'
                  ? 'bg-rose-600 border-rose-500 text-white'
                  : 'bg-emerald-600 border-emerald-500 text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{t.type === 'error' ? '⚠️' : '✨'}</span>
                <span>{t.message}</span>
              </div>
              <button 
                onClick={() => removeToast(t.id)}
                className="text-white/60 hover:text-white px-2 cursor-pointer font-bold select-none text-sm leading-none"
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
};
