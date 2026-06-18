import React from 'react';
import { useQueue } from '../context/QueueContext';
import { Wifi, WifiOff } from 'lucide-react';

export const LiveBadge: React.FC = () => {
  const { socketStatus } = useQueue();

  if (socketStatus === 'connected') {
    return (
      <div id="live-connection-badge" className="flex items-center">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Wifi className="w-3.5 h-3.5 min-w-[14px]" />
          <span className="text-[10px] sm:text-xs">Live Connected</span>
        </div>
      </div>
    );
  }

  if (socketStatus === 'connecting') {
    return (
      <div id="live-connection-badge" className="flex items-center">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <Wifi className="w-3.5 h-3.5 min-w-[14px] animate-pulse" />
          <span className="text-[10px] sm:text-xs">Connecting...</span>
        </div>
      </div>
    );
  }

  // disconnected
  return (
    <div id="live-connection-badge" className="flex items-center">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold select-none">
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        <WifiOff className="w-3.5 h-3.5 min-w-[14px]" />
        <span className="text-[10px] sm:text-xs">Disconnected</span>
      </div>
    </div>
  );
};
