import React, { useEffect, useState, useRef } from 'react';
import { useQueue } from '../context/QueueContext';
import { 
  Monitor, Volume2, VolumeX, BellRing, Sparkles, Clock, 
  Tv, Play, Shield, RefreshCw, ChevronRight, Activity, HelpCircle, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Static simulation list of clinic tokens to cycle through in Demo Preset mode
// TODO: Real-time Socket.IO / REST API integration points for queue displays
interface PresetCall {
  ticketNumber: string;
  name: string;
  room: string;
  purpose: string;
  priority: 'normal' | 'urgent';
}

const PRESET_CALLS: PresetCall[] = [];

export const Display: React.FC = () => {
  const { patients, darkMode, loading, error } = useQueue();

  // Screen layout modes - default to 'live' feed for real backend integration
  const [tvSource, setTvSource] = useState<'preset' | 'live'>('live');
  const [presetIndex, setPresetIndex] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [playBuzzerRipple, setPlayBuzzerRipple] = useState(false);
  const [calledHistory, setCalledHistory] = useState<string[]>([]);
  
  // Real-time time & date states
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');

  // Audio Synth Context reference
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sync real-time clocks
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setDateStr(d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }));
      setTimeStr(d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter lists for live clinic staff feed
  const liveCallingPatients = [...patients]
    .filter(p => p.status === 'calling')
    .sort((a, b) => new Date(b.calledAt || 0).getTime() - new Date(a.calledAt || 0).getTime());

  const liveWaitingPatients = [...patients]
    .filter(p => p.status === 'waiting')
    .sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });

  // Get current active hero token depending on mode
  const currentHero: PresetCall | null = (() => {
    if (tvSource === 'preset') {
      return PRESET_CALLS[presetIndex] || null;
    } else {
      const topLive = liveCallingPatients[0];
      if (topLive) {
        return {
          ticketNumber: topLive.ticketNumber.startsWith('QC-') ? topLive.ticketNumber : `QC-${topLive.ticketNumber}`,
          name: topLive.name,
          room: topLive.assignedRoom || 'Consultation Room 1',
          purpose: topLive.purpose || 'General Consultation',
          priority: topLive.priority
        };
      }
      return null;
    }
  })();

  // Audio beeping sound synthesizer (Chime sound)
  const triggerAudioBeep = () => {
    if (isAudioMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // First Chime note (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.06, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.55);

      // Second Chime note (A5)
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.frequency.setValueAtTime(880.00, ctx.currentTime);
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.06, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.75);
      }, 160);

    } catch (e) {
      console.warn('Web Audio synthesis blocked by browser security.', e);
    }
  };

  // Speaks the called token using standard Web Speech API
  const speakTokenAnnouncement = (token: string, name: string, room: string) => {
    if (isAudioMuted) return;
    try {
      window.speechSynthesis.cancel(); // cancel any active readings
      
      const cleanToken = token.replace('-', ' '); // 'QC 104' instead of 'QC-104'
      const textToSpeak = `Ticket number ${cleanToken}, ${name}. Please proceed to ${room}.`;
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      
      // Attempt to pick a natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVo = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'));
      if (preferredVo) {
        utterance.voice = preferredVo;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis cancelled or not supported by this container framework.', err);
    }
  };

  // Trigger buzzer flashing + audio beeps + spoken words when new tokens are received
  useEffect(() => {
    if (!currentHero) return;
    
    const key = `${tvSource}-${currentHero.ticketNumber}-${currentHero.room}`;
    if (!calledHistory.includes(key)) {
      triggerAudioBeep();
      speakTokenAnnouncement(currentHero.ticketNumber, currentHero.name, currentHero.room);
      setPlayBuzzerRipple(true);
      const timer = setTimeout(() => setPlayBuzzerRipple(false), 3000);
      setCalledHistory((prev) => [...prev, key].slice(-20)); // Keep history lean
      return () => clearTimeout(timer);
    }
  }, [currentHero, tvSource, isAudioMuted]);

  return (
    <div 
      className={`w-screen h-screen max-w-full max-h-full overflow-hidden flex flex-col relative font-sans select-none transition-colors duration-300 ${
        darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`} 
      id="public-tv-display-root"
    >
      
      {/* BACKGROUND DECORATIVE GLOWS */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* 
        =============================================================
        HEADLINE NAV / HEADER SECTION (High resolution TV optimized)
        =============================================================
      */}
      <header className="relative z-10 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md">
        
        {/* Brand logo & status badge */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-500/20">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-black text-lg md:text-xl text-slate-950 dark:text-white uppercase tracking-tight">
                Queue Cure <span className="text-blue-600 dark:text-blue-400">'26</span>
              </h1>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold mt-0.5">
              Live Lounge Announcement Board
            </p>
          </div>
        </div>

        {/* CONTROLS PLUG: Mute & Source selectors beautifully displayed */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Audio Chime/Voice Status Pill */}
          <button
            onClick={() => {
              setIsAudioMuted(!isAudioMuted);
              triggerAudioBeep();
            }}
            className={`px-3.5 py-1.8 rounded-xl border text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
              !isAudioMuted 
                ? 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'bg-rose-500/10 hover:bg-rose-500/15 border-rose-500/20 text-rose-600 dark:text-rose-455'
            }`}
            title="Toggle Lobby Audio Announcements"
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
            <span className="hidden sm:inline">{isAudioMuted ? 'Muted / Click to Unmute' : 'Voice Chimes Enabled'}</span>
            <span className="sm:hidden">{isAudioMuted ? 'Mute' : 'Live Voice'}</span>
          </button>

          {/* Preset / Live Feed Switcher */}
          <div className="p-0.8 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-80s flex">
            <button
              onClick={() => {
                setTvSource('preset');
                triggerAudioBeep();
              }}
              className={`px-3 py-1.5 text-[10.5px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                tvSource === 'preset'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
              }`}
            >
              Preset Demo
            </button>
            <button
              onClick={() => {
                setTvSource('live');
                triggerAudioBeep();
              }}
              className={`px-3 py-1.5 text-[10.5px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                tvSource === 'live'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700'
              }`}
            >
              Live Feed
            </button>
          </div>

          {/* Quick Demo Next Button (only when in Preset mode) */}
          {tvSource === 'preset' && (
            <button
              onClick={() => {
                setPresetIndex((prev) => (prev + 1) % PRESET_CALLS.length);
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                darkMode ? 'border-slate-800 bg-slate-900 hover:bg-slate-800' : 'border-slate-200 bg-white hover:bg-slate-50'
              } text-blue-500`}
              title="Next Preset Call"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

        </div>

        {/* Real-time elegant Clock widget */}
        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-3 md:pt-0 md:pl-5 text-left md:text-right">
          <Clock className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <div>
            <div className="font-mono text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {timeStr || '12:00:00 PM'}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
              {dateStr || 'Jun 18, 2026'}
            </p>
          </div>
        </div>

      </header>

      {/* 
        =============================================================
        MAIN LOBBY GRID (Optimized with responsive Flex-Layouts)
        - Mobile: Single dynamic stack
        - Tablet (>=768px): Dual column structure
        - Desktop / TV (>=1024px): 65% Hero call screen vs 35% Lobby queue log
        =============================================================
      */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">
        
        {/* HERO ANNOUNCEMENT ZONE (Left 7-columns) */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {currentHero ? (
              <motion.div
                key={currentHero.ticketNumber}
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -15 }}
                transition={{ duration: 0.4, type: 'spring', damping: 26, stiffness: 180 }}
                className={`flex-1 rounded-[32px] border flex flex-col justify-between p-6 md:p-8 text-center relative overflow-hidden shadow-xl ${
                  playBuzzerRipple 
                    ? 'border-blue-500/40 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-blue-500/10'
                    : darkMode 
                      ? 'bg-slate-900/60 border-slate-800' 
                      : 'bg-white border-slate-150 shadow-sm'
                }`}
              >
                
                {/* Visual pulse rings on new calls */}
                {playBuzzerRipple && (
                  <div className="absolute inset-0 pointer-events-none bg-blue-500/2 animate-[pulse_1.2s_infinite] rounded-3xl" />
                )}

                {/* Top call status ribbon */}
                <div className="flex items-center justify-center gap-2">
                  <motion.div 
                    animate={currentHero.priority === 'urgent' ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={`inline-flex items-center gap-1.5 px-4.5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                      currentHero.priority === 'urgent'
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    <BellRing className={`w-4 h-4 ${currentHero.priority === 'urgent' ? 'animate-bounce' : 'animate-pulse'}`} />
                    <span>{currentHero.priority === 'urgent' ? '🚨 EMERGENCY PRIORITY CALL' : '🛎️ NOW SERVING'}</span>
                  </motion.div>
                </div>

                {/* MEGA MASSIVE TYPOGRAPHY (Perfect for huge TV visibility) */}
                <div className="my-8 md:my-10">
                  <motion.div
                    animate={playBuzzerRipple ? { y: [0, -10, 0] } : {}}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="flex justify-center"
                  >
                    <span className="font-mono text-8xl md:text-[11rem] lg:text-[14rem] font-black leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-650 to-blue-700 dark:from-blue-400 dark:via-indigo-300 dark:to-blue-400 filter drop-shadow-[0_2px_10px_rgba(37,99,235,0.08)]">
                      {currentHero.ticketNumber}
                    </span>
                  </motion.div>

                  {/* Room indicator */}
                  <div className="mt-8">
                    <p className="text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest font-black">
                      Please Proceed Straight To:
                    </p>
                    <motion.h2 
                      animate={playBuzzerRipple ? { scale: [1, 1.05, 1] } : {}}
                      className="text-2xl md:text-4xl lg:text-5xl font-black font-sans text-slate-905 dark:text-white uppercase tracking-tight mt-1.5"
                    >
                      {currentHero.room}
                    </motion.h2>
                  </div>
                </div>

                {/* Patient footer segment */}
                <div className={`p-4 rounded-2xl max-w-lg mx-auto w-full flex items-center justify-between gap-4 border text-left ${
                  darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Patient Called</span>
                    <strong className="text-sm md:text-base font-black text-slate-850 dark:text-white capitalize">
                      {currentHero.name}
                    </strong>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Triage Intake Category</span>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {currentHero.purpose}
                    </span>
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className={`flex-1 rounded-[32px] border border-dashed flex flex-col items-center justify-center p-12 text-center ${
                darkMode ? 'bg-slate-900/20 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <Activity className="w-16 h-16 text-slate-350 animate-pulse mb-3" />
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">Announcements Channel Standby</h3>
                <p className="text-xs text-slate-400 max-w-[280px] mt-1.5 leading-relaxed">
                  Lobby terminal is online. New patients appear here automatically when staff triggers 'Call' at the receptionist desk.
                </p>
                <button
                  onClick={() => setTvSource('preset')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white font-extrabold text-xs uppercase rounded-xl cursor-pointer hover:bg-blue-700 transition"
                >
                  Load Simulation Carousel
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* LOBBY SIDEBAR QUEUE WATCH (Right 4-columns) */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <div className="flex flex-col h-full space-y-4">
            
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>Next preparing standby list</span>
              </h4>
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                {tvSource === 'preset' ? 'Demo mode' : `${liveWaitingPatients.length} Waiting`}
              </span>
            </div>

            {/* Scrollable container of waiting tickets */}
            <div className={`flex-1 p-5 rounded-[32px] border flex flex-col overflow-hidden text-left ${
              darkMode ? 'bg-slate-900/60 border-slate-800/80 shadow-inner' : 'bg-white border-slate-200/50 shadow-xs'
            }`}>
              
              {tvSource === 'preset' ? (
                // PRESET MODE SIMULATED WAITLIST
                <div className="space-y-3 my-auto">
                  
                  {/* Item 1 */}
                  <div className={`p-4 rounded-2.5xl border flex items-center justify-between transition-all ${
                    darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-black text-indigo-500 dark:text-indigo-400">
                        QC-105
                      </span>
                      <div>
                        <strong className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Priya Patel</strong>
                        <span className="text-[10px] text-slate-400 block leading-tight">Immunization triage</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase py-0.5 px-2 rounded-lg bg-indigo-500/10 text-indigo-600">Up Next</span>
                  </div>

                  {/* Item 2 */}
                  <div className={`p-4 rounded-2.5xl border flex items-center justify-between transition-all ${
                    darkMode ? 'bg-slate-955/60 border-slate-800/80' : 'bg-slate-50 border-slate-100/80'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-black text-slate-800 dark:text-slate-300">
                        QC-106
                      </span>
                      <div>
                        <strong className="text-xs font-bold text-slate-800 dark:text-slate-150 block">Amit Kumar</strong>
                        <span className="text-[10px] text-slate-455 block leading-tight">Cardiac lab</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase py-0.5 px-2 rounded-lg bg-rose-500/10 text-rose-500">Urgent</span>
                  </div>

                  {/* Item 3 */}
                  <div className={`p-4 rounded-2.5xl border flex items-center justify-between transition-all ${
                    darkMode ? 'bg-slate-955/60 border-slate-800/80' : 'bg-slate-50 border-slate-100/80'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-black text-slate-800 dark:text-slate-350">
                        QC-107
                      </span>
                      <div>
                        <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Sneha Reddy</strong>
                        <span className="text-[10px] text-slate-455 block leading-tight">Physiotherapy rehab</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase py-0.5 px-2 rounded-lg bg-slate-200 text-slate-600">Prepared</span>
                  </div>

                </div>
              ) : (
                // LIVE MODE DYNAMIC FEED
                <div className="flex-1 flex flex-col justify-between">
                  {liveWaitingPatients.length === 0 ? (
                    <div className="my-auto text-center text-slate-400">
                      <Sparkles className="w-10 h-10 mx-auto mb-2 text-slate-300 animate-pulse" />
                      <p className="text-xs font-semibold">Vacant Standby Queue</p>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto">Standby queue list is empty. Add elements via concierge intake receptionist desk.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <AnimatePresence initial={false}>
                        {liveWaitingPatients.slice(0, 5).map((pt, index) => {
                          const priorityColor = pt.priority === 'urgent'
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600';

                          return (
                            <motion.div
                              key={pt.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className={`p-3 rounded-2.5xl border flex items-center justify-between ${
                                darkMode ? 'bg-slate-950/60 border-slate-805' : 'bg-slate-50 border-slate-105'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-lg font-black text-blue-600 dark:text-blue-400">
                                  {pt.ticketNumber}
                                </span>
                                <div>
                                  <strong className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                                    {pt.name}
                                  </strong>
                                  <span className="text-[10px] text-slate-400 block leading-tight">{pt.purpose}</span>
                                </div>
                              </div>

                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg border ${priorityColor}`}>
                                {pt.priority === 'urgent' ? 'Urgent' : `Pos ${index + 1}`}
                              </span>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}

              {/* Informative bottom card within sidebar */}
              <div className={`mt-4 p-3.5 rounded-2xl border text-center relative overflow-hidden ${
                darkMode ? 'bg-slate-950 border-slate-805' : 'bg-slate-50 border-slate-105'
              }`}>
                <div className="absolute top-2 right-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 animate-pulse"></span>
                  </span>
                </div>
                <h5 className="text-[11px] font-extrabold text-blue-650 dark:text-blue-400 uppercase tracking-wider">
                  Clinic Counter Load status
                </h5>
                <p className="text-[9.5px] text-slate-450 leading-relaxed mt-1">
                  Estimated consultation duration currently: <strong className="font-bold">12 mins</strong>. Watch tickers carefully.
                </p>
              </div>

            </div>

          </div>
        </div>

      </main>

      {/* 
        =============================================================
        BOTTOM MARQUEE CLOCK TICKER TAPE
        =============================================================
      */}
      <footer className="relative z-10 w-full overflow-hidden bg-blue-600 text-white border-t border-blue-500 py-3 uppercase text-[10.5px] font-extrabold tracking-widest leading-none select-none">
        
        {/* Animated Infinite Slide Content */}
        <div className="flex w-max whitespace-nowrap animate-[marquee_25s_linear_infinite] gap-10">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>Welcome to Queue Cure '26 Clinic Center</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span>Protect our clinic family: Please sanitize hands at station counters upon arrival</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span>Scan the physical station desk QR codes to track queue standby progress on your smartphones</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
            <span>Active Station 1: Dr. Rahul Sharma • Room 2: Nurse Maya Sen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>Estimated waiting standby average: 12 minutes per consultation</span>
          </div>

          {/* Repeat exact values for flawless loop gap cover */}
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>Welcome to Queue Cure '26 Clinic Center</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span>Protect our clinic family: Please sanitize hands at station counters upon arrival</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span>Scan the physical station desk QR codes to track queue standby progress on your smartphones</span>
          </div>
        </div>
      </footer>

      {/* Embedded direct CSS keyframe rules for pixel-perfect loop translations */}
      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-33.3%, 0, 0); }
        }
      `}</style>

    </div>
  );
};
