import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, ZapOff, Camera, AlertTriangle, CheckCircle2, RefreshCw, Smartphone, CameraOff, Lock } from 'lucide-react';
import { useQRCodeScanner } from '../../hooks/useQRCodeScanner';
import { getPatient } from '../../services/api';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [scanState, setScanState] = useState<'scanning' | 'verifying' | 'success' | 'error'>('scanning');
  const [errorMessage, setErrorMessage] = useState('');

  const handleScan = async (data: string) => {
    if (scanState !== 'scanning') return;
    
    // Extract token if it's a deep link URL
    let token = data.trim();
    if (token.startsWith('http')) {
      try {
        const url = new URL(token);
        const parts = url.pathname.split('/');
        token = parts[parts.length - 1];
      } catch {
        setScanState('error');
        setErrorMessage('Malformed URL in QR code.');
        setTimeout(() => setScanState('scanning'), 3000);
        return;
      }
    }

    if (!token || !/^\d+$/.test(token)) {
      setScanState('error');
      setErrorMessage('Invalid QR code format.');
      setTimeout(() => setScanState('scanning'), 3000);
      return;
    }

    setScanState('verifying');
    try {
      await getPatient(token);
      setScanState('success');
      setTimeout(() => {
        onSuccess(token);
        onClose();
      }, 1000);
    } catch (err: any) {
      setScanState('error');
      if (err.response?.status === 404) {
        setErrorMessage('Token not found. Do NOT navigate.');
      } else {
        setErrorMessage('Validation failed.');
      }
      setTimeout(() => setScanState('scanning'), 3000);
    }
  };

  const { videoRef, start, stop, error, isLoading, hasFlash, flashOn, toggleFlash } = useQRCodeScanner(handleScan);

  useEffect(() => {
    if (isOpen) {
      setScanState('scanning');
      setErrorMessage('');
      start();
    } else {
      stop();
    }
  }, [isOpen, start, stop]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-center p-0 m-0 overflow-hidden" id="real-qr-scanner">
      {/* Top App Bar */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-30 bg-gradient-to-b from-slate-950/80 to-transparent">
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>
        {hasFlash && !error && (
          <button
            onClick={toggleFlash}
            className={`p-2.5 rounded-full cursor-pointer transition-colors backdrop-blur-md ${
              flashOn ? 'bg-amber-400/90 text-slate-900 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {flashOn ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
          </button>
        )}
      </div>

      {/* Main Viewfinder Area */}
      <div className="relative w-full h-full max-w-md mx-auto flex flex-col justify-center items-center px-6">
        
        {/* Title & Instruction */}
        <div className="absolute top-[12vh] inset-x-0 text-center px-4 z-20">
          <h2 className="text-white font-black text-xl tracking-tight mb-2">Scan Ticket</h2>
          <p className="text-slate-300 text-sm font-medium">
            Align the QR code inside the frame.
          </p>
        </div>

        {/* Video & Scanner Frame container */}
        <div className="relative w-full aspect-[4/5] max-h-[65vh] rounded-[2rem] overflow-hidden bg-slate-900 border-2 border-slate-800/80 shadow-2xl">
          
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Overlays based on state */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10">
            {isLoading && !error && (
              <div className="flex flex-col items-center">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-4" />
                <p className="text-white font-bold tracking-wider uppercase text-xs">Opening Camera...</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center text-center p-6 bg-slate-900/90 backdrop-blur-md inset-4 absolute rounded-[1.5rem] justify-center">
                {error === 'not-https' ? (
                  <>
                    <Lock className="w-12 h-12 text-rose-500 mb-4" />
                    <h3 className="text-white font-bold text-lg mb-2">Insecure Origin</h3>
                    <p className="text-slate-400 text-sm mb-6">Camera requires HTTPS. Please switch to a secure connection.</p>
                  </>
                ) : error === 'permission-denied' ? (
                  <>
                    <CameraOff className="w-12 h-12 text-rose-500 mb-4" />
                    <h3 className="text-white font-bold text-lg mb-2">Camera access denied.</h3>
                    <p className="text-slate-400 text-sm mb-6">Please allow camera permission in your browser settings.</p>
                    <div className="flex gap-3 w-full">
                      <button onClick={start} className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold text-sm">
                        Try Again
                      </button>
                      <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm">
                        Enter Token Instead
                      </button>
                    </div>
                  </>
                ) : error === 'no-camera' ? (
                  <>
                    <Camera className="w-12 h-12 text-rose-500 mb-4" />
                    <h3 className="text-white font-bold text-lg mb-2">No camera detected.</h3>
                    <p className="text-slate-400 text-sm mb-6">Your device does not appear to have a supported camera.</p>
                    <button onClick={onClose} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm">
                      Use token entry instead
                    </button>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
                    <h3 className="text-white font-bold text-lg mb-2">Camera Error</h3>
                    <p className="text-slate-400 text-sm mb-6">An unexpected error occurred while accessing the camera.</p>
                    <div className="flex gap-3 w-full">
                      <button onClick={start} className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold text-sm">
                        Try Again
                      </button>
                      <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm">
                        Enter Token
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {!isLoading && !error && (
              <>
                {/* Clear center area for scanning view (mask effect) */}
                <div className="absolute inset-0 shadow-[0_0_0_4000px_rgba(0,0,0,0.45)] z-0" />
                
                {/* Scanner Frame / Bounding Box */}
                <div className="relative w-3/4 aspect-square z-10">
                  {/* Animated Corner Guides */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

                  {/* Green Scan Line Animation */}
                  {scanState === 'scanning' && (
                    <motion.div
                      className="absolute inset-x-0 h-[2px] bg-emerald-400 shadow-[0_0_15px_#34d399]"
                      initial={{ top: '10%' }}
                      animate={{ top: '90%' }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
                    />
                  )}
                  
                  {/* Status Overlays */}
                  <AnimatePresence>
                    {scanState === 'verifying' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm"
                      >
                        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-3" />
                        <span className="text-white font-bold text-xs uppercase tracking-wider">Verifying...</span>
                      </motion.div>
                    )}

                    {scanState === 'success' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-500/20 rounded-xl backdrop-blur-sm"
                      >
                        <div className="p-3 bg-emerald-500 rounded-full mb-3">
                          <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-emerald-400 font-bold text-sm uppercase tracking-wider">Success</span>
                      </motion.div>
                    )}

                    {scanState === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-4 bottom-4 p-3 bg-rose-500/90 text-white rounded-xl text-center shadow-lg backdrop-blur-md"
                      >
                        <span className="font-bold text-sm">{errorMessage}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Fallback Button */}
        <div className="absolute bottom-[8vh] inset-x-0 px-8 flex justify-center z-20">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold backdrop-blur-md transition-colors"
          >
            <Smartphone className="w-5 h-5" />
            <span>Enter Token Manually</span>
          </button>
        </div>
      </div>
    </div>
  );
};
