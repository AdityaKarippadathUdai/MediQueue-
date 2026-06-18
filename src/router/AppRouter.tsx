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

// Wrapper layout that couples Header with Device mockup frame 
const GlobalLayout: React.FC = () => {
  const location = useLocation();

  return (
    <MobileContainer>
      <Header />
      
      {/* 
        Smooth Framer Motion route transitions.
        This gives a fluid, natural app sliding effect.
      */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="flex-1 flex flex-col"
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/patient" element={<Patient />} />
            <Route path="/reception-login" element={<ReceptionistLogin />} />
            <Route path="/receptionist" element={<Receptionist />} />
            <Route path="/display" element={<Display />} />
            
            {/* Catch-all safety routing going home */}
            <Route path="*" element={<Home />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </MobileContainer>
  );
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<GlobalLayout />} />
      </Routes>
    </BrowserRouter>
  );
};
