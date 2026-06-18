import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { User, ShieldAlert, Monitor, Clock, Users, ArrowRight, HeartPulse, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { patients, averageWaitTime, darkMode } = useQueue();

  const waitingList = patients.filter(p => p.status === 'waiting');
  const callingList = patients.filter(p => p.status === 'calling');

  const cardsContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex-1 flex flex-col justify-between px-4 pt-4 pb-8" id="home-portal-page">
      {/* Clinic Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        classclassName="text-center pt-2 pb-5"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold mb-3.5">
          <HeartPulse className="w-3.5 h-3.5" />
          <span>Hackathon Build '26</span>
        </div>
        <h2 className="font-display font-extrabold text-[24px] tracking-tight text-slate-900 dark:text-white leading-tight">
          Smart Healthcare,<br />No Idle Waiting.
        </h2>
        <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-2 max-w-[340px] mx-auto leading-relaxed">
          Queue Cure modernizes wait rooms into real-time, touch-active digital triage flows. Choose a screen mock to begin testing.
        </p>
      </motion.div>

      {/* Real-time Triage Stat Badges */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.div 
          whileHover={{ y: -2 }}
          className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-colors ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/60 shadow-sm'
          }`}
          id="home-stat-waiting"
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <Users className="w-4 h-4 text-blue-500" />
            <span>Currently Waiting</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-black text-slate-900 dark:text-white">
              {waitingList.length}
            </span>
            <span className="text-[11px] text-slate-450 font-medium">patients</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-colors ${
            darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/60 shadow-sm'
          }`}
          id="home-stat-wait-time"
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>Est. Wait Time</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-black text-slate-900 dark:text-white">
              {averageWaitTime}
            </span>
            <span className="text-[11px] text-slate-450 font-medium">mins</span>
          </div>
        </motion.div>
      </div>

      {/* Role selection paths */}
      <motion.div 
        variants={cardsContainer}
        initial="hidden"
        animate="show"
        className="space-y-3.5 flex-1 flex flex-col justify-center"
      >
        {/* PATIENT CARD */}
        <motion.div 
          variants={cardItem}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/patient')}
          className={`p-4 rounded-2.5xl border border-blue-500/15 cursor-pointer flex items-start gap-4 transition-all duration-200 hover:border-blue-500/40 ${
            darkMode ? 'bg-slate-900/60 hover:bg-slate-900 text-slate-100' : 'bg-white hover:bg-slate-50 text-slate-800 shadow-sm hover:shadow-md'
          }`}
          id="role-patient-card"
        >
          <div className="p-3.5 rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/25">
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1 pr-1">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-[16px] text-slate-950 dark:text-white">Patient Intake App</h3>
              <ArrowRight className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-[13px] text-slate-550 dark:text-slate-400 mt-1 lines-clamp-2 leading-relaxed">
              Join the live waitlist, generate a digital queue ticket, and track live room updates from your phone.
            </p>
          </div>
        </motion.div>

        {/* RECEPTIONIST CARD */}
        <motion.div 
          variants={cardItem}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/receptionist')}
          className={`p-4 rounded-2.5xl border cursor-pointer flex items-start gap-4 transition-all duration-200 ${
            darkMode ? 'bg-slate-900/60 border-slate-850 hover:bg-slate-900 hover:border-slate-700' : 'bg-white border-slate-200/70 hover:bg-slate-50 hover:border-slate-350 shadow-sm hover:shadow-md'
          }`}
          id="role-receptionist-card"
        >
          <div className="p-3.5 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="flex-1 pr-1">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-[16px] text-slate-950 dark:text-white">Reception & Triage Staff</h3>
              <ArrowRight className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-[13px] text-slate-550 dark:text-slate-400 mt-1 lines-clamp-2 leading-relaxed">
              Check in arrived patients, edit categories, call the next patient ticket, and assign consultation rooms.
            </p>
          </div>
        </motion.div>

        {/* DISPLAY LOBBY CARD */}
        <motion.div 
          variants={cardItem}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/display')}
          className={`p-4 rounded-2.5xl border cursor-pointer flex items-start gap-4 transition-all duration-200 ${
            darkMode ? 'bg-slate-900/60 border-slate-850 hover:bg-slate-900 hover:border-slate-700' : 'bg-white border-slate-200/70 hover:bg-slate-50 hover:border-slate-350 shadow-sm hover:shadow-md'
          }`}
          id="role-display-card"
        >
          <div className="p-3.5 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/25">
            <Monitor className="w-6 h-6" />
          </div>
          <div className="flex-1 pr-1">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-[16px] text-slate-950 dark:text-white">Lobby TV Board</h3>
              <ArrowRight className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-[13px] text-slate-550 dark:text-slate-400 mt-1 lines-clamp-2 leading-relaxed">
              A high-visibility TV lounge screen that broadcasts "Now Calling" tickets with auditory beep alerts.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer credits adhering to visual limits */}
      <div className="pt-6 text-center select-none font-mono text-[10px] text-slate-400 dark:text-slate-500">
        Queue Care '26 • Foundation Core v1.0
      </div>
    </div>
  );
};
