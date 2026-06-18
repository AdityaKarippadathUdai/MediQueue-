import React, { useEffect, useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { Monitor, Volume2, ShieldAlert, BadgeInfo, BellRing, Sparkles, Compass, Clock, Tv, Tv2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Display: React.FC = () => {
  const { patients, darkMode } = useQueue();

  // Switch between "preset" (requested spec mode) and "live" (context-bound queue)
  const [tvSource, setTvSource] = useState<'preset' | 'live'>('preset');

  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [calledHistory, setCalledHistory] = useState<string[]>([]);
  const [playBuzzerRipple, setPlayBuzzerRipple] = useState(false);

  // Sync real-time clocks
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setDateStr(d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
      setTimeStr(d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter lists for Live Mode
  const liveCallingPatients = patients
    .filter(p => p.status === 'calling')
    .sort((a, b) => new Date(b.calledAt || 0).getTime() - new Date(a.calledAt || 0).getTime());

  const liveWaitingPatients = patients
    .filter(p => p.status === 'waiting')
    .sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });

  const latestLiveCalled = liveCallingPatients[0];

  // Synthesize soft medical acoustic chime beeper
  const triggerAudioBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const osc1 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 chime
      osc1.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      
      osc1.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.65);

      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gainNode2 = audioCtx.createGain();
        osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime); // A5 chime
        osc2.type = 'sine';
        gainNode2.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
        osc2.connect(gainNode2);
        gainNode2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.85);
      }, 150);

    } catch (e) {
      console.log('Audio Context played successfully.', e);
    }
  };

  // Trigger buzzer flash when a new ticket is called
  useEffect(() => {
    if (tvSource === 'live' && latestLiveCalled) {
      const ticketVal = latestLiveCalled.ticketNumber;
      if (!calledHistory.includes(ticketVal)) {
        triggerAudioBeep();
        setPlayBuzzerRipple(true);
        const pulseTimer = setTimeout(() => setPlayBuzzerRipple(false), 2400);
        setCalledHistory(prev => [...prev, ticketVal]);
        return () => clearTimeout(pulseTimer);
      }
    }
  }, [patients, latestLiveCalled, calledHistory, tvSource]);

  return (
    <div className="flex-1 flex flex-col pt-3 pb-20" id="lobby-announcement-board">
      
      {/* 
        -----------------------------------------
        TV BROADCAST CONTROLLER (Source Selector Tab)
        -----------------------------------------
      */}
      <div className="px-4 mb-3">
        <div className={`p-1 rounded-xl flex items-center justify-between border ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => {
              setTvSource('preset');
              triggerAudioBeep();
            }}
            className={`flex-1 text-center py-1.5 text-[10px] font-extrabold uppercase rounded-lg transition-all cursor-pointer ${
              tvSource === 'preset'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            📺 Preset TV Demo
          </button>
          <button
            onClick={() => {
              setTvSource('live');
              triggerAudioBeep();
            }}
            className={`flex-1 text-center py-1.5 text-[10px] font-extrabold uppercase rounded-lg transition-all cursor-pointer ${
              tvSource === 'live'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            📡 Live Patients Feed
          </button>
        </div>
      </div>

      {/* Modern High-contrast Clinic TV Frame Container */}
      <div className={`mx-4 rounded-3.5xl border border-blue-500/10 overflow-hidden relative shadow-2xl flex flex-col ${
        darkMode 
          ? 'bg-slate-950 text-slate-100' 
          : 'bg-radial from-slate-50 to-blue-50/50 text-slate-900'
      }`} id="clinic-tv-frame">
        
        {/* TV Status Header banner with Digital Time clock */}
        <div className="px-5 py-3 border-b border-blue-500/10 bg-blue-605 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="font-display font-extrabold text-[11px] tracking-widest uppercase">
              QUEUE CURE TV ANNOUNCEMENTS
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono text-blue-100">
            <span>{dateStr || 'Jun 18'}</span>
            <span className="font-bold bg-white/10 px-1.5 py-0.5 rounded text-white">{timeStr || '20:30'}</span>
          </div>
        </div>

        {/* 
          =======================================
          TV CARD LAYOUT: PRESET SPEC DEMO (Now Serving: 104, Next: 105, 106, 107)
          =======================================
        */}
        {tvSource === 'preset' ? (
          <div className="p-6 flex flex-col gap-6">
            
            {/* Now Serving Mega Panel */}
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-extrabold uppercase tracking-widest mb-3.5">
                <BellRing className="w-3.5 h-3.5 animate-bounce-slow" />
                <span>NOW SERVING</span>
              </div>

              {/* Mega Typography Display */}
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="py-1"
              >
                <h1 className="font-mono text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 tracking-tighter">
                  QC-104
                </h1>
                
                <p className="text-sm font-display font-extrabold text-blue-600 dark:text-blue-400 mt-2 uppercase tracking-wide">
                  Proceed to: <span className="underline decoration-wavy decoration-orange-500 font-black">Examination Room 1</span>
                </p>
                
                <p className="text-[10px] font-mono text-slate-450 uppercase tracking-widest mt-1">
                  PATIENT: Rahul S.
                </p>
              </motion.div>
            </div>

            <hr className="border-dashed border-slate-200 dark:border-slate-800" />

            {/* Upcoming Next Tokens Row with Auto-scroll cards appearance */}
            <div>
              <span className="text-[10.5px] font-extrabold text-slate-500 dark:text-slate-400 tracking-wider uppercase block mb-3 pl-1">
                UPCOMING QUEUED TOKENS
              </span>

              <div className="grid grid-cols-3 gap-3">
                
                {/* Token QC-105 Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
                  }`}
                >
                  <span className="text-[9px] font-extrabold text-indigo-500 uppercase block mb-1">UP NEXT</span>
                  <span className="font-mono text-2xl font-black text-slate-900 dark:text-white block">QC-105</span>
                  <span className="text-[9px] text-slate-450 block truncate">Priya</span>
                </motion.div>

                {/* Token QC-106 Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
                  }`}
                >
                  <span className="text-[9px] font-extrabold text-indigo-505 uppercase block mb-1">PREPARING</span>
                  <span className="font-mono text-2xl font-black text-slate-900 dark:text-white block">QC-106</span>
                  <span className="text-[9px] text-slate-455 block truncate">Amit</span>
                </motion.div>

                {/* Token QC-107 Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
                  }`}
                >
                  <span className="text-[9px] font-extrabold text-indigo-505 uppercase block mb-1">IN QUEUE</span>
                  <span className="font-mono text-2xl font-black text-slate-900 dark:text-white block">QC-107</span>
                  <span className="text-[9px] text-slate-455 block truncate">Sneha</span>
                </motion.div>

              </div>
            </div>

            {/* Immersive bottom notification crawl */}
            <div className={`p-2.5 rounded-xl text-[10px] text-center ${
              darkMode ? 'bg-slate-900/60' : 'bg-blue-50/50'
            }`}>
              🔊 Please ensure you have your printable check-in receipt ready.
            </div>

          </div>
        ) : (
          /* 
            =======================================
            TV CARD LAYOUT: LIVE CLINIC BACKEND
            =======================================
          */
          <div className="p-6 flex flex-col gap-5">
            
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-extrabold uppercase tracking-widest mb-3.5">
                <BellRing className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                <span>ACTIVE CALLED STREAM</span>
              </div>

              {latestLiveCalled ? (
                <motion.div 
                  layoutId="tv-now-serving"
                  animate={playBuzzerRipple ? { scale: [1, 1.03, 1] } : {}}
                  className="py-1"
                >
                  <h1 className="font-mono text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 tracking-tighter">
                    {latestLiveCalled.ticketNumber}
                  </h1>
                  
                  <p className="text-sm font-display font-extrabold text-blue-600 dark:text-blue-400 mt-2 uppercase tracking-wide">
                    Proceed to: <span className="underline decoration-wavy decoration-orange-500 font-black">{latestLiveCalled.assignedRoom || 'Examination Room 1'}</span>
                  </p>
                  
                  <p className="text-[10px] font-mono text-slate-450 uppercase tracking-widest mt-1">
                    PATIENT: {latestLiveCalled.name}
                  </p>
                </motion.div>
              ) : (
                <div className="py-6 text-slate-400">
                  <span className="text-3xl block filter saturate-50 mb-1">🛎️</span>
                  <div className="text-xs font-bold text-slate-655 dark:text-slate-350">No Called Tickets</div>
                  <p className="text-[11px] text-slate-455 max-w-[200px] mx-auto mt-1">Ready for staff to broadcast tokens from reception desk.</p>
                </div>
              )}
            </div>

            <hr className="border-dashed border-slate-200 dark:border-slate-800" />

            <div>
              <span className="text-[10.5px] font-extrabold text-slate-550 dark:text-slate-400 tracking-wider uppercase block mb-3 pl-1">
                UPCOMING STANDBY TICKETS
              </span>

              {liveWaitingPatients.length === 0 ? (
                <p className="text-[10px] text-slate-400 text-center py-4">No waiting tickets remain. Queue completely clear.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {liveWaitingPatients.slice(0, 3).map((pt, index) => (
                    <motion.div 
                      key={pt.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-3 rounded-2xl border text-center ${
                        pt.priority === 'urgent'
                          ? 'border-rose-500/20 bg-rose-500/5 text-rose-500'
                          : darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/50 shadow-xs'
                      }`}
                    >
                      <span className="text-[8.5px] font-bold block uppercase opacity-70 mb-1">
                        POSITION {index + 1}
                      </span>
                      <span className="font-mono text-xl font-black block">{pt.ticketNumber}</span>
                      <span className="text-[9px] opacity-75 truncate block">{pt.name.split(' ')[0]}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className={`p-2.5 rounded-xl text-[10px] text-center ${
              darkMode ? 'bg-slate-900/60' : 'bg-blue-50/50'
            }`}>
              📢 Please watch this board regularly. System syncs instantly with Nurse stations.
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
