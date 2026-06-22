import {useEffect, useState} from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type InstallState = 'unavailable' | 'available' | 'prompting' | 'installed' | 'dismissed';

type InstallResult = {
  success: boolean;
  outcome: 'accepted' | 'dismissed' | 'unavailable' | 'installed';
};

type InstallSnapshot = {
  installState: InstallState;
  isInstalled: boolean;
  isInstallable: boolean;
  isStandalone: boolean;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installState: InstallState = 'unavailable';
let isStandalone = false;
let isListening = false;

const subscribers = new Set<() => void>();

const getStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as Navigator & {standalone?: boolean}).standalone === true;

const emit = () => {
  subscribers.forEach((subscriber) => subscriber());
};

const setInstallState = (nextState: InstallState) => {
  installState = nextState;
  emit();
};

const getSnapshot = (): InstallSnapshot => ({
  installState,
  isInstalled: installState === 'installed' || isStandalone,
  isInstallable: installState === 'available' && deferredPrompt !== null,
  isStandalone,
});

const setupInstallListeners = () => {
  if (typeof window === 'undefined' || isListening) return;

  isListening = true;
  isStandalone = getStandaloneMode();
  installState = isStandalone ? 'installed' : 'unavailable';

  const standaloneQuery = window.matchMedia('(display-mode: standalone)');

  const handleStandaloneChange = () => {
    isStandalone = getStandaloneMode();
    if (isStandalone) {
      deferredPrompt = null;
      setInstallState('installed');
    } else if (!deferredPrompt && installState === 'installed') {
      setInstallState('unavailable');
    } else {
      emit();
    }
  };

  const handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;

    if (!getStandaloneMode()) {
      setInstallState('available');
    }
  };

  const handleAppInstalled = () => {
    deferredPrompt = null;
    isStandalone = true;
    setInstallState('installed');
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);
  standaloneQuery.addEventListener('change', handleStandaloneChange);
};

const subscribe = (callback: () => void) => {
  setupInstallListeners();
  subscribers.add(callback);

  return () => {
    subscribers.delete(callback);
  };
};

export const usePWAInstall = () => {
  const [snapshot, setSnapshot] = useState<InstallSnapshot>(() => {
    if (typeof window !== 'undefined') {
      setupInstallListeners();
    }

    return getSnapshot();
  });

  useEffect(() => subscribe(() => setSnapshot(getSnapshot())), []);

  const installApp = async (): Promise<InstallResult> => {
    if (snapshot.isInstalled) {
      return {success: true, outcome: 'installed'};
    }

    if (!deferredPrompt) {
      setInstallState('unavailable');
      return {success: false, outcome: 'unavailable'};
    }

    const promptEvent = deferredPrompt;
    setInstallState('prompting');

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      deferredPrompt = null;

      if (choice.outcome === 'accepted') {
        setInstallState('installed');
        return {success: true, outcome: 'accepted'};
      }

      setInstallState('dismissed');
      return {success: false, outcome: 'dismissed'};
    } catch (error) {
      console.error('PWA installation prompt failed:', error);
      setInstallState('unavailable');
      return {success: false, outcome: 'unavailable'};
    }
  };

  const dismissPrompt = () => {
    setInstallState('dismissed');
  };

  const resetDismissal = () => {
    if (isStandalone || getStandaloneMode()) {
      isStandalone = true;
      setInstallState('installed');
    } else if (deferredPrompt) {
      setInstallState('available');
    } else {
      setInstallState('unavailable');
    }
  };

  return {
    ...snapshot,
    installApp,
    dismissPrompt,
    resetDismissal,
  };
};
