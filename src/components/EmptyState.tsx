import React from 'react';
import { ClipboardCheck, Users, HelpCircle, Activity } from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { motion } from 'motion/react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: 'clipboard' | 'users' | 'activity';
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'clipboard',
  actionLabel,
  onAction
}) => {
  const { darkMode } = useQueue();

  const renderIcon = () => {
    switch (icon) {
      case 'users':
        return <Users className="w-10 h-10 text-slate-400 dark:text-slate-500" />;
      case 'activity':
        return <Activity className="w-10 h-10 text-emerald-500 animate-pulse" />;
      default:
        return <ClipboardCheck className="w-10 h-10 text-blue-500 dark:text-blue-400" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`p-8 rounded-3xl border border-dashed text-center flex flex-col items-center justify-center gap-4 ${
        darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-slate-50/40'
      }`}
      id="empty-state-card"
    >
      <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800/60' : 'bg-slate-100'}`}>
        {renderIcon()}
      </div>
      
      <div className="space-y-1.5 max-w-[280px]">
        <h3 className="font-display font-semibold text-[16px] text-slate-950 dark:text-slate-100">
          {title}
        </h3>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-normal">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="mt-2 px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 cursor-pointer"
          id="empty-state-action-button"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
};
