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
  const isFullWidth = ['/reception-login', '/receptionist', '/display'].includes(location.pathname);

  // Smooth route transitions
  const animationProps = {
    initial: { opacity: 0, y: isFullWidth ? 8 : 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: isFullWidth ? -8 : -12 },
    transition: { duration: 0.25, ease: 'easeInOut' },
    className: "flex-1 flex flex-col w-full"
  };

  if (isFullWidth) {
    return (
      <FullWidthLayout>
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} {...animationProps}>
            <Routes location={location}>
              <Route path="/reception-login" element={<ReceptionistLogin />} />
              <Route path="/receptionist" element={<Receptionist />} />
              <Route path="/display" element={<Display />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </FullWidthLayout>
    );
  }

  return (
    <PatientLayout>
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} {...animationProps}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/patient" element={<Patient />} />
            <Route path="/patient/:tokenId" element={<Patient />} />
            {/* Catch-all safety routing going to patient home portal */}
            <Route path="*" element={<Home />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </PatientLayout>
  );
};

export const AppRouter: React.FC = () => {
  const { toasts, removeToast } = useQueue();

  return (
    <BrowserRouter>
      <RootRouter />

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
