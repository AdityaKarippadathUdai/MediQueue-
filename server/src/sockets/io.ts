import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import config from '../config';
import { patientRepository } from '../repositories/patientRepository';
import { queueSettingsRepository } from '../repositories/queueSettingsRepository';
import { toPatientResponse } from '../services/patientService';

let io: SocketIOServer | null = null;

const TODAY = (): string => new Date().toISOString().split('T')[0];
const DEPT = 'GEN';

/**
 * Push the full current queue state to a single newly-connected socket.
 * This eliminates the need for initial HTTP polling on page load.
 */
const pushInitialState = async (socket: Socket): Promise<void> => {
  try {
    const today = TODAY();

    const [patients, settings] = await Promise.all([
      patientRepository.findAllForDate(today),
      queueSettingsRepository.getOrInitialize(DEPT, today),
    ]);

    const mappedPatients = patients.map(toPatientResponse);

    // Full queue list for all views
    socket.emit('queueUpdated', { patients: mappedPatients });

    // Current serving token for the display screen
    if (settings.currentToken > 0) {
      socket.emit('currentTokenUpdated', {
        token: settings.currentToken,
        displayToken: `QC-${settings.currentToken}`,
      });
    }

    // Average consultation time for EWT calculations
    socket.emit('averageTimeUpdated', {
      averageConsultationTime: settings.averageConsultationTime,
    });

    // Queue open/closed status
    socket.emit('queueStatusChanged', {
      isQueueOpen: settings.isQueueOpen,
    });
  } catch (err) {
    console.error(`[Socket] Failed to push initial state to ${socket.id}:`, err);
  }
};

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    // Prefer WebSocket, fall back to long-polling
    transports: ['websocket', 'polling'],
  });

  io.on('connection', async (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Immediately hydrate the new client with current queue state
    await pushInitialState(socket);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} (reason: ${reason})`);
    });

    socket.on('error', (err) => {
      console.error(`[Socket] Error from ${socket.id}:`, err);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initSocket first.');
  }
  return io;
};

/**
 * Broadcast an event and payload to ALL connected clients.
 * Called by services after every state mutation.
 */
export const emitToAll = (event: string, data: unknown): void => {
  try {
    getIO().emit(event, data);
  } catch (err) {
    console.error(`[Socket] Emit failed for event "${event}":`, err);
  }
};
