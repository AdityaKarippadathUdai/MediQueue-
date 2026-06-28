import { useState, useEffect, useRef, useCallback } from 'react';
import QrScanner from 'qr-scanner';

export type ScannerError = 'not-https' | 'no-camera' | 'permission-denied' | 'already-in-use' | 'unsupported' | 'unknown';

export const useQRCodeScanner = (onResult: (result: string) => void) => {
  const [error, setError] = useState<ScannerError | null>(null);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  const start = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setError('not-https');
      setIsLoading(false);
      return;
    }

    try {
      const hasCam = await QrScanner.hasCamera();
      if (!hasCam) {
        setError('no-camera');
        setIsLoading(false);
        return;
      }

      if (videoRef.current) {
        scannerRef.current = new QrScanner(
          videoRef.current,
          result => {
            onResult(result.data);
          },
          {
            highlightScanRegion: false,
            highlightCodeOutline: false,
            maxScansPerSecond: 5,
            preferredCamera: 'environment'
          }
        );
        
        try {
          await scannerRef.current.start();
          const flash = await scannerRef.current.hasFlash();
          setHasFlash(flash);
          setIsLoading(false);
        } catch (e: any) {
          console.error('Scanner start error:', e);
          const errStr = e.toString().toLowerCase();
          const errName = e.name ? e.name.toLowerCase() : '';
          
          if (errStr.includes('camera not found') || errName === 'notfounderror') {
             setError('no-camera');
          } else if (errStr.includes('notallowed') || errName === 'notallowederror' || errName === 'permissiondeniederror') {
             setError('permission-denied');
          } else if (errStr.includes('notreadable') || errName === 'notreadableerror') {
             setError('already-in-use');
          } else {
             setError('unknown');
          }
          setIsLoading(false);
        }
      }
    } catch (err: any) {
      console.error('Camera check error:', err);
      setError('unknown');
      setIsLoading(false);
    }
  }, [onResult]);

  const stop = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
  }, []);

  const toggleFlash = useCallback(async () => {
    if (scannerRef.current && hasFlash) {
      try {
        if (flashOn) {
          await scannerRef.current.turnFlashOff();
          setFlashOn(false);
        } else {
          await scannerRef.current.turnFlashOn();
          setFlashOn(true);
        }
      } catch (err) {
        console.warn('Flash toggle failed', err);
      }
    }
  }, [hasFlash, flashOn]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    videoRef,
    start,
    stop,
    error,
    isLoading,
    hasFlash,
    flashOn,
    toggleFlash
  };
};
