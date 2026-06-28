/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { QueueProvider } from './context/QueueContext';
import { AppRouter } from './router/AppRouter';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';

export default function App() {
  return (
    <QueueProvider>
      <AppRouter />
      <PWAUpdatePrompt />
    </QueueProvider>
  );
}
