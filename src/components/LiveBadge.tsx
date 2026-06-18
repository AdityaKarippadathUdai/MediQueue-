import React from 'react';
import { useQueue } from '../context/QueueContext';
import { ShieldCheck, Wifi, WifiOff } from 'lucide-react';

export const LiveBadge: React.FC = () => {
  const { isOnline } = useQueue();

  return (
    <div id="live-connection-badge" className="flex items-center">
      {isOnline ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Wifi className="w-3 h-3 min-w-[12px]" />
          <span className="text-[10px] sm:text-xs">Live Triage</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <WifiOff className="w-3 h-3 min-w-[12px]" />
          <span className="text-[10px] sm:text-xs">Reconnecting...</span>
        </div>
      )}
    </div>
  );
};
