import { io, Socket } from 'socket.io-client';

// Get backend URL from environment variables
const SOCKET_URL = (import.meta as any).env?.VITE_SOCKET_URL || (import.meta as any).env?.VITE_API_URL || '';

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket'],
    });
  }
  return socketInstance;
};
