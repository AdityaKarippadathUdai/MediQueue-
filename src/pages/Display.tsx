import React, { useEffect, useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { Monitor, Volume2, ShieldAlert, BadgeInfo, BellRing, Sparkles, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmptyState } from '../components/EmptyState';

export const Display: React.FC = () => {
  const { patients, darkMode } = useQueue();
  const [calledHistory, setCalledHistory] = useState<string[]>([]);
  const [playBuzzerRipple, setPlayBuzzerRipple] = useState(false);

  const callingPatients = patients
    .filter(p => p.status === 'calling')
    // newest called patient first
    .sort((a, b) => new Date(b.calledAt || 0).getTime() - new Date(a.calledAt || 0).getTime());

  const waitingPatients = patients
    .filter(p => p.status === 'waiting')
    // sort similar to general priority checks
    .sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });

  const latestCalled = callingPatients[0];

  // Synthesize soft medical acoustic chime beeper
  const triggerAudioBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Note oscillator 1 (high pitch pleasant tone)
      const osc1 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 chime
      osc1.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      
      osc1.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.65);

      // Delayed Note oscillator 2 for authentic major chime step
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gainNode2 = audioCtx.createGain();
        osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime); // A5 chime
        osc2.type = 'sine';
        gainNode2.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
        osc2.connect(gainNode2);
        gainNode2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.85);
      }, 150);

    } catch (e) {
      console.log('Audio Context muted by security sandboxing permissions.', e);
    }
  };

  // Play audio chime when a new patient gets added to "Calling" active list
  useEffect(() => {
    if (latestCalled) {
      const ticketVal = latestCalled.ticketNumber;
      if (!calledHistory.includes(ticketVal)) {
        // Trigger auto beeper alert on new entries
        triggerAudioBeep();
        setPlayBuzzerRipple(true);
        const pulseTimer = setTimeout(() => setPlayBuzzerRipple(false), 2500);

        setCalledHistory(prev => [...prev, ticketVal]);
        return () => clearTimeout(pulseTimer);
      }
    }
  }, [patients, latestCalled, calledHistory]);

  return (
    <div className="flex-1 flex flex-col px-4 pt-4" id="lobby-announcement-board">
      
      {/* Simulation Header */}
      <div className="text-center pt-1 pb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 text-[11px] font-extrabold uppercase mb-2">
          <Monitor className="w-3.5 h-3.5" />
          <span>Patient Lounge TV Broadcast</span>
        </div>
        <p className={`text-[12px] ${darkMode ? 'text-slate-400' : 'text-slate-500'} max-w-[310px] mx-auto leading-relaxed`}>
          This display is typically broadcasted onto large LCD monitors in the clinic waiting area.
        </p>
      </div>

      {/* Primary BROADCAST Station: NOW CALLING */}
      <div className="mb-5 space-y-2.5">
        <div className="flex justify-between items-center px-1">
          <span className="text-[11px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            Loudspeaker Broadcast
          </span>
          
          <button 
            onClick={() => {
              triggerAudioBeep();
              setPlayBuzzerRipple(true);
              setTimeout(() => setPlayBuzzerRipple(false), 2000);
            }}
            className={`text-[11px] font-extrabold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1 p-1 hover:underline cursor-pointer`}
            id="test-chime-button"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Test Chime</span>
          </button>
        </div>

        {latestCalled ? (
          /* Live Showcase Module */
          <motion.div
            layoutId="main-called-broadcast"
            animate={playBuzzerRipple ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 0.6, repeat: playBuzzerRipple ? 2 : 0 }}
            className={`p-6 rounded-3.5xl border text-center transition-all relative ${
              playBuzzerRipple
                ? 'border-indigo-500 bg-gradient-to-br from-indigo-500/15 via-blue-600/10 to-indigo-500/15 ring-2 ring-indigo-500/40'
                : darkMode 
                  ? 'bg-slate-905 border-slate-800' 
                  : 'bg-white border-slate-200/70 shadow-md shadow-indigo-100/45'
            }`}
          >
            {/* Pulsing indicator */}
            <div className="absolute top-4 right-4 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </div>

            <div className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
              NOW ADMITTING TICKET
            </div>

            {/* Giant Glowing Code */}
            <h3 className="font-mono text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 tracking-tighter mt-3.5">
              {latestCalled.ticketNumber}
            </h3>

            {/* Target Clinic Room Designation */}
            <div className="mt-4 px-4 py-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/15 inline-block">
              <span className="text-[11px] font-bold text-indigo-750 dark:text-indigo-300 mr-1 opacity-75">REPORT TO:</span>
              <span className="text-sm font-extrabold font-display text-indigo-600 dark:text-indigo-400 uppercase">
                {latestCalled.assignedRoom}
              </span>
            </div>

            <p className="text-[11.5px] text-slate-450 dark:text-slate-505 font-mono mt-3 uppercase tracking-wide">
              Patient: {latestCalled.name.split(' ')[0]}***
            </p>
          </motion.div>
        ) : (
          /* Empty calling display state */
          <div className={`p-8 rounded-3.5xl border border-dashed text-slate-450 text-center ${
            darkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50/60 border-slate-200/80'
          }`}>
            <BellRing className="w-8 h-8 text-slate-350 dark:text-slate-650 mx-auto mb-2.5 animate-bounce" />
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300">All Registered Patients Seated</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[260px] mx-auto mt-1">
              There are no active patient ticket calls. Waiting patients, please watch the waitlist board below.
            </p>
          </div>
        )}
      </div>

      {/* Up Next List Board slider */}
      <div className="space-y-2 flex-1 flex flex-col pb-16">
        <h4 className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest flex items-center justify-between px-1">
          <span>Triage Waitlist Queue</span>
          <span className="font-mono text-[10px] font-medium opacity-65 text-slate-500">{waitingPatients.length} tickets pending</span>
        </h4>

        <div className={`flex-1 rounded-3.5xl border p-3 min-h-[220px] transition-colors ${
          darkMode ? 'bg-slate-905 border-slate-800/80' : 'bg-white border-slate-205/60 shadow-xs'
        }`}>
          {waitingPatients.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center p-6 text-center">
              <span className="text-2xl mb-1.5">👏</span>
              <h5 className="font-display font-semibold text-xs text-slate-800 dark:text-slate-200">Zero Patient Waitlist</h5>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[200px] mt-1">
                Lobby queue backlog is completely clear.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <AnimatePresence initial={false}>
                {waitingPatients.slice(0, 8).map((pt, idx) => (
                  <motion.div
                    key={pt.id}
                    layoutId={`lobby-queued-${pt.id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`p-2.5 rounded-2xl flex items-center justify-between border transition-all ${
                      pt.priority === 'urgent'
                        ? 'border-red-500/25 bg-red-500/5 text-red-600 dark:text-red-400'
                        : darkMode 
                          ? 'bg-slate-900 border-slate-800 text-slate-300' 
                          : 'bg-slate-50 border-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase py-0.5 px-2 bg-slate-200/50 dark:bg-slate-850 rounded-lg">
                        {idx + 1}
                      </span>
                      <span className="font-mono text-sm font-extrabold">
                        {pt.ticketNumber}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[8.5px] font-bold block uppercase tracking-wide opacity-50">
                        {pt.priority}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
