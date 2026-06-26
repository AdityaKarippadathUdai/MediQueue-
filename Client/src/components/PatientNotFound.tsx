import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, AlertCircle } from 'lucide-react';

export const PatientNotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center h-full min-h-[70vh]">
      <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-12 h-12 text-slate-400 dark:text-slate-500" />
      </div>
      
      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
        Registration Not Found
      </h2>
      
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs">
        This token is no longer active.
      </p>

      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 mb-8 w-full max-w-sm text-left border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Possible reasons:</h3>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Registration cancelled
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Consultation completed
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Invalid token number
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={() => navigate('/patient')}
          className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          Track Another Token
        </button>
        
        <button
          onClick={() => navigate('/')}
          className="w-full py-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Return Home
        </button>
      </div>
    </div>
  );
};
