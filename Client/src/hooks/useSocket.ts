import {useCallback, useEffect, useState} from 'react';
import {Socket} from 'socket.io-client';
import {getSocket} from '../services/socket';

export type SocketStatus = 'connected' | 'connecting' | 'disconnected';
export type QueueSocketRoom = 'reception' | 'patients' | 'display';

const joinedRooms = new Set<QueueSocketRoom>();

const emitRoomJoin = (socket: Socket, room: QueueSocketRoom) => {
  if (room === 'reception') {
    socket.emit('joinReception');
  } else if (room === 'patients') {
    socket.emit('joinPatient');
  } else if (room === 'display') {
    socket.emit('joinDisplay');
  }
};

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<SocketStatus>('connecting');

  useEffect(() => {
    const s = getSocket();
    setSocket(s);
    setStatus(s.connected ? 'connected' : 'connecting');

    const onConnect = () => {
      setStatus('connected');
      joinedRooms.forEach((room) => emitRoomJoin(s, room));
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

    if (s.connected) {
      onConnect();
    }

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
    };
  }, []);

  const joinRoom = useCallback((room: QueueSocketRoom) => {
    joinedRooms.add(room);
    const s = socket ?? getSocket();
    if (s.connected) {
      emitRoomJoin(s, room);
    }
  }, [socket]);

  return {socket, status, isConnected: status === 'connected', joinRoom};
};
