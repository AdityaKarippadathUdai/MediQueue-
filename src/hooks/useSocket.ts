import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket } from '../services/socket';

export type SocketStatus = 'connected' | 'connecting' | 'disconnected';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>('connecting');

  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    // Initial status check
    setStatus(s.connected ? 'connected' : 'connecting');

    const onConnect = () => {
      setStatus('connected');
    };

    const onDisconnect = () => {
      setStatus('disconnected');
    };

    const onConnectError = () => {
      setStatus('disconnected');
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);

    // If already connected, trigger check
    if (s.connected) {
      setStatus('connected');
    }

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
    };
  }, []);

  return { socket, status, isConnected: status === 'connected' };
};
