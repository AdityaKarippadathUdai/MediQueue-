import React from 'react';
import { useQueue } from '../context/QueueContext';

interface MobileContainerProps {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  const { darkMode } = useQueue();

  return (
    <div className={`flex justify-center items-center min-h-screen w-full transition-colors duration-300 ${darkMode ? 'bg-[#0B0F19]' : 'bg-slate-100/70 p-0 sm:py-6 md:py-8'}`}>
      {/* 
        This acts as the physical-like wrapper shell for the app. 
        Highly optimized to deliver a 100% immersive app layout on smaller touchscreens, 
        and a gorgeous rounded simulation module on desktop displays.
      */}
      <div 
        id="mobile-device-shell"
        className={`w-full max-w-[420px] md:max-w-[700px] lg:max-w-[900px] min-h-screen md:min-h-[600px] md:h-auto sm:min-h-[840px] sm:h-[840px] flex flex-col relative transition-all duration-300 
          ${darkMode ? 'bg-[#0F172A] text-slate-100 border-slate-800' : 'bg-[#F8FAFC] text-slate-800 border-slate-200/60'} 
          sm:rounded-[40px] sm:shadow-[0_24px_50px_-12px_rgba(15,23,42,0.15)] sm:border overflow-hidden`}
      >
        {/* Soft virtual notch indicator representing hardware alignment */}
        <div className="hidden sm:flex md:hidden justify-center absolute top-0 left-0 right-0 z-50 pointer-events-none">
          <div className={`w-32 h-[18px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} rounded-b-2xl border-x border-b shadow-sm flex items-center justify-center`}>
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
          </div>
        </div>

        {/* Space reserved for top hardware details simulation (Battery, Time, WiFi) */}
        <div className="hidden sm:flex md:hidden justify-between items-center px-6 pt-5 pb-2 text-[11px] font-medium tracking-tight select-none z-40 pointer-events-none">
          <div className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>9:41 AM</div>
          <div className="flex items-center gap-1.5">
            {/* WiFi Line Strength */}
            <svg className={`w-3.5 h-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} fill="currentColor" viewBox="0 0 16 16">
              <path d="M15.384 6.115a.485.485 0 0 0-.047-.736A12.444 12.444 0 0 0 8 3 12.44 12.44 0 0 0 .663 5.379a.485.485 0 0 0-.048.736.518.518 0 0 0 .668.05A11.448 11.448 0 0 1 8 4c2.507 0 4.827.802 6.716 2.164.205.148.49.13.668-.049z"/>
              <path d="M13.229 8.271a.482.482 0 0 0-.063-.745A9.455 9.455 0 0 0 8 6c-1.905 0-3.68.56-5.166 1.526a.48.48 0 0 0-.063.745.525.525 0 0 0 .652.065A8.46 8.46 0 0 1 8 7a8.46 8.46 0 0 1 4.577 1.336c.205.132.48.108.652-.065zm-2.183 2.183c.226-.226.185-.605-.1-.75A6.473 6.473 0 0 0 8 9c-1.187 0-2.302.318-3.264.873-.285.165-.326.544-.1.75l.15.15c.18.18.472.161.62-.041A5.478 5.478 0 0 1 8 10c1.093 0 2.103.32 2.95.865.147.202.44.22.62.041l.15-.15z"/>
              <path d="M8.5 11.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"/>
            </svg>
            {/* Battery Indicator */}
            <div className={`w-5 h-2.5 rounded-[3px] border ${darkMode ? 'border-slate-500' : 'border-slate-400'} p-[1px] flex`}>
              <div className="w-3/4 h-full bg-qc-success rounded-[1px]"></div>
            </div>
          </div>
        </div>

        {/* Content stream area */}
        <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar pt-2 sm:pt-0 pb-6 md:pb-8">
          {children}
        </div>

        {/* Virtual Bottom Pill Button (Simulating premium devices navigation swipe bar) */}
        <div className="hidden sm:flex md:hidden justify-center pb-2.5 pt-1 bg-transparent pointer-events-none select-none">
          <div className={`w-32 h-1.5 ${darkMode ? 'bg-slate-700' : 'bg-slate-300'} rounded-full`}></div>
        </div>
      </div>
    </div>
  );
};
