import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import config from '../config';
import { registerQueueHandlers } from './queueSocket';

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO on top of the HTTP server.
 * Enables Connection State Recovery to gracefully handle client reconnects
 * and preserve room memberships automatically.
 */
export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    // Notify client of connection status, highlighting whether the session was recovered
    if (socket.recovered) {
      console.log(`[Socket] Session recovered for client: ${socket.id}`);
      socket.emit('connectionStatus', { status: 'recovered', socketId: socket.id });
    } else {
      console.log(`[Socket] New client connected: ${socket.id}`);
      socket.emit('connectionStatus', { status: 'connected', socketId: socket.id });
    }

    // Register queue management handlers
    registerQueueHandlers(io!, socket);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} (reason: ${reason})`);
    });

    socket.on('error', (err) => {
      console.error(`[Socket] Error on socket ${socket.id}:`, err);
    });
  });

  return io;
};

/**
 * Get the initialized Socket.IO server instance.
 */
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initSocket first.');
  }
  return io;
};

/**
 * Broadcast an event to ALL connected clients across all rooms.
 */
export const emitToAll = (event: string, data: unknown): void => {
  try {
    getIO().emit(event, data);
  } catch (err) {
    console.error(`[Socket] Broadcast to all failed for "${event}":`, err);
  }
};

/**
 * Send an event to all clients in a specific room (e.g. 'reception', 'display', 'patients').
 */
export const emitToRoom = (room: string, event: string, data: unknown): void => {
  try {
    getIO().to(room).emit(event, data);
  } catch (err) {
    console.error(`[Socket] Send to room "${room}" failed for event "${event}":`, err);
  }
};

/**
 * Send an event specifically to a patient's personal device room.
 */
export const emitToPatient = (patientId: string, event: string, data: unknown): void => {
  try {
    getIO().to(`patient:${patientId}`).emit(event, data);
  } catch (err) {
    console.error(`[Socket] Send to patient room "patient:${patientId}" failed for event "${event}":`, err);
  }
};
