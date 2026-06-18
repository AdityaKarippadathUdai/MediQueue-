import React from 'react';
import { useQueue } from '../context/QueueContext';

export const StatsSkeleton: React.FC = () => {
  const { darkMode } = useQueue();

  return (
    <div className={`grid grid-cols-2 gap-3 p-4 rounded-3xl border animate-pulse ${darkMode ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200/60'}`}>
      <div className="space-y-2">
        <div className={`h-3 w-1/2 rounded ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
        <div className={`h-8 w-3/4 rounded-lg ${darkMode ? 'bg-slate-600' : 'bg-slate-300'}`} />
      </div>
      <div className="space-y-2">
        <div className={`h-3 w-2/3 rounded ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
        <div className={`h-8 w-1/2 rounded-lg ${darkMode ? 'bg-slate-600' : 'bg-slate-300'}`} />
      </div>
    </div>
  );
};

export const PatientCardSkeleton: React.FC = () => {
  const { darkMode } = useQueue();

  return (
    <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 animate-pulse ${darkMode ? 'bg-slate-800/30 border-slate-800' : 'bg-white border-slate-100'}`}>
      <div className="flex items-center gap-3 w-full">
        {/* Token symbol simulator */}
        <div className={`w-12 h-12 rounded-xl flex-shrink-0 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
        
        {/* Texts simulator */}
        <div className="space-y-2 w-full">
          <div className="flex items-center gap-2">
            <div className={`h-4 w-1/3 rounded ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <div className={`h-3 w-12 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`} />
          </div>
          <div className={`h-3.5 w-1/2 rounded ${darkMode ? 'bg-slate-800' : 'bg-slate-150'}`} />
        </div>
      </div>
      {/* Right action button simulator */}
      <div className={`w-16 h-8 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
    </div>
  );
};

export const ListSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      <PatientCardSkeleton />
      <PatientCardSkeleton />
      <PatientCardSkeleton />
    </div>
  );
};
