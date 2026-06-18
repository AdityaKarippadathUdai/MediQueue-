import { useState, useEffect, useCallback } from 'react';

// Custom types for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type InstallState = 'available' | 'installing' | 'installed' | 'dismissed';

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installState, setInstallState] = useState<InstallState>('dismissed');
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIframe, setIsIframe] = useState<boolean>(false);

  // Check if app is already running as standalone or loaded in iframe
  const checkEnvironment = useCallback(() => {
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    setIsStandalone(isStandaloneMode);

    const insideIframe = window.self !== window.top;
    setIsIframe(insideIframe);

    return { isStandaloneMode, insideIframe };
  }, []);

  useEffect(() => {
    const { isStandaloneMode } = checkEnvironment();

    // Check if dismissed previously in localStorage
    const isDismissed = localStorage.getItem('pwa_install_dismissed') === 'true';

    if (isStandaloneMode) {
      setInstallState('installed');
    } else if (isDismissed) {
      setInstallState('dismissed');
    } else {
      setInstallState('available');
    }

    // Capture standard PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      const dismissed = localStorage.getItem('pwa_install_dismissed') === 'true';
      if (!isStandaloneMode && !dismissed) {
        setInstallState('available');
      }
    };

    // Listen to standard install confirmation
    const handleAppInstalled = () => {
      setInstallState('installed');
      setDeferredPrompt(null);
      setIsStandalone(true);
      localStorage.setItem('pwa_installed_state', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Initial check in case it's custom browser mode
    if (localStorage.getItem('pwa_installed_state') === 'true') {
      setInstallState('installed');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [checkEnvironment]);

  // Execute PWA Prompt or provide step-by-step instructions fallback
  const installApp = async (): Promise<{ success: boolean; outcome: 'accepted' | 'dismissed' | 'fallback' }> => {
    if (!deferredPrompt) {
      // Return fallback state if standard prompt is unavailable (e.g. inside a container/iframe, or not met PWA conditions)
      setInstallState('installing');
      
      // Simulate/trigger custom user modal or instructions
      return new Promise((resolve) => {
        setTimeout(() => {
          // Fallback simulation: we simulate successful installer if they are test-running,
          // but we let them know it's fallback.
          resolve({ success: false, outcome: 'fallback' });
        }, 500);
      });
    }

    try {
      setInstallState('installing');
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setInstallState('installed');
        setDeferredPrompt(null);
        localStorage.setItem('pwa_installed_state', 'true');
        return { success: true, outcome: 'accepted' };
      } else {
        setInstallState('available');
        return { success: false, outcome: 'dismissed' };
      }
    } catch (error) {
      console.error('Trigger PWA installation error:', error);
      setInstallState('available');
      return { success: false, outcome: 'dismissed' };
    }
  };

  // Temporarily dismiss installer banner/card
  const dismissPrompt = useCallback(() => {
    localStorage.setItem('pwa_install_dismissed', 'true');
    setInstallState('dismissed');
  }, []);

  // Force trigger resetting the prompt state for settings menu or re-triggering tests
  const resetDismissal = useCallback(() => {
    localStorage.removeItem('pwa_install_dismissed');
    localStorage.removeItem('pwa_installed_state');
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    if (isStandaloneMode) {
      setInstallState('installed');
    } else {
      setInstallState('available');
    }
  }, []);

  // Simulate complete install on browser (mainly for gorgeous interactive demo flow)
  const completeSimulatedInstall = useCallback(() => {
    setInstallState('installed');
    localStorage.setItem('pwa_installed_state', 'true');
    setIsStandalone(true);
  }, []);

  return {
    isInstallable: installState === 'available' || !!deferredPrompt,
    isInstalled: installState === 'installed' || isStandalone,
    installState,
    isIframe,
    installApp,
    dismissPrompt,
    resetDismissal,
    completeSimulatedInstall,
  };
};
