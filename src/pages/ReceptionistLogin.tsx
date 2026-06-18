import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import { ShieldCheck, User, Compass, KeyRound, AlertTriangle, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const ReceptionistLogin: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsReceptionist, darkMode } = useQueue();

  const [username, setUsername] = useState('sarah_triage');
  const [name, setName] = useState('Nurse Sarah');
  const [room, setRoom] = useState('Triage Desk A');
  const [password, setPassword] = useState('••••••••');
  const [error, setError] = useState('');

  // Quick select login preset pills
  const staffPresets = [
    { username: 'sarah_triage', name: 'Nurse Sarah', room: 'Triage Desk A' },
    { username: 'dr_alistair', name: 'Dr. Alistair', room: 'Consultation Room 3' },
    { username: 'admin_pete', name: 'Clerk Peter', room: 'Intake counter 1' }
  ];

  const handleApplyPreset = (preset: typeof staffPresets[0]) => {
    setUsername(preset.username);
    setName(preset.name);
    setRoom(preset.room);
    setPassword('demopass123');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !name.trim() || !room.trim()) {
      setError('Please fill out all staff identification inputs.');
      return;
    }
    setError('');
    loginAsReceptionist(username, name, room);
    navigate('/receptionist');
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-5 py-6" id="staff-auth-page">
      <div className="mb-6 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-3.5">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="font-display font-extrabold text-[22px] tracking-tight text-slate-900 dark:text-white">
          Staff Authentication
        </h2>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 max-w-[280px] mx-auto leading-relaxed">
          Log in with mock credentials to manage the check-in list and call queues.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-qc-danger/10 border border-qc-danger/20 text-qc-danger text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-qc-danger flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Staff Quick presets toggles */}
        <div className="space-y-2">
          <label className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Quick-Select Staff Profiles
          </label>
          <div className="flex flex-wrap gap-2">
            {staffPresets.map((preset) => (
              <button
                key={preset.username}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`py-2 px-3 text-[11px] font-bold rounded-xl border text-left transition-all flex-1 ${
                  username === preset.username
                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : darkMode 
                      ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                      : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <div className="font-semibold">{preset.name}</div>
                <div className="text-[9px] opacity-75">{preset.room}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Input box: Username */}
        <div className="space-y-1.5">
          <label className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. sarah_triage"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 transition-all ${
                darkMode 
                  ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500' 
                  : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500 shadow-xs'
              }`}
            />
          </div>
        </div>

        {/* Input box: Full Name */}
        <div className="space-y-1.5">
          <label className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Staff Display Name
          </label>
          <div className="relative">
            <Compass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nurse Sarah"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 transition-all ${
                darkMode 
                  ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500' 
                  : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500 shadow-xs'
              }`}
            />
          </div>
        </div>

        {/* Input box: Room Assignment */}
        <div className="space-y-1.5">
          <label className={`text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Assigned Desk / Consultation Room
          </label>
          <select
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className={`w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 transition-all ${
              darkMode 
                ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500' 
                : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500 shadow-xs'
            }`}
          >
            <option value="Triage Desk A">Triage Desk A</option>
            <option value="Consultation Room 3">Consultation Room 3</option>
            <option value="Pediatrics Room B">Pediatrics Room B</option>
            <option value="Exam Room 1">Exam Room 1</option>
            <option value="Emergency Bay 4">Emergency Bay 4</option>
          </select>
        </div>

        {/* Mock safety lock note */}
        <div className="flex gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 text-[11px] items-center">
          <KeyRound className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <span>Demo sandboxed credentials are hard-integrated for testing. Use any key.</span>
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 mt-4 cursor-pointer"
          id="staff-login-submit"
        >
          Check-In to Desk
        </motion.button>
      </form>
    </div>
  );
};
