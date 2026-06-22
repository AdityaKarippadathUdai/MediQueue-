import {registerSW} from 'virtual:pwa-register';

export const registerServiceWorker = () => {
  registerSW({
    immediate: true,
    onRegisterError(error) {
      console.error('Service worker registration failed:', error);
    },
  });
};
