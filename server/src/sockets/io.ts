import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import config from '../config';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Please call initSocket first.');
  }
  return io;
};

export const emitToAll = (event: string, data: any) => {
  try {
    const ioInstance = getIO();
    ioInstance.emit(event, data);
  } catch (err) {
    console.error(`Socket emit failed for event "${event}":`, err);
  }
};
