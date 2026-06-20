import { Server, Socket } from 'socket.io';
import { queueService } from '../services/queueService';

/**
 * Registers Socket.IO event handlers for queue operations.
 * Maps client events to consolidated queue service operations.
 */
export const registerQueueHandlers = (io: Server, socket: Socket): void => {
  /**
   * joinReception
   * Join the receptionist dashboard room.
   * Immediately hydrates the receptionist client with full dashboard state.
   */
  socket.on('joinReception', async () => {
    try {
      await socket.join('reception');
      console.log(`[Socket] Client ${socket.id} joined room: reception`);

      const [status, stats, patients] = await Promise.all([
        queueService.getQueueStatus(),
        queueService.getDashboardStatistics(),
        queueService.getPatients(),
      ]);

      // Seed the connecting client with initial states
      socket.emit('queueUpdated', { patients });
      if (status.currentToken) {
        socket.emit('currentTokenUpdated', {
          token: status.currentToken,
          displayToken: `QC-${status.currentToken}`,
        });
      }
      socket.emit('averageTimeUpdated', { averageConsultationTime: status.averageConsultationTime });
      socket.emit('queueStatusChanged', { isQueueOpen: status.isQueueOpen });
      socket.emit('dashboardStatsUpdated', stats);
    } catch (err) {
      console.error(`[Socket] Error during joinReception for socket ${socket.id}:`, err);
    }
  });

  /**
   * joinPatient
   * Join the patient queue room.
   * If a patientId is supplied, registers client in patient-specific status room.
   */
  socket.on('joinPatient', async (payload?: { patientId?: string }) => {
    try {
      await socket.join('patients');
      console.log(`[Socket] Client ${socket.id} joined room: patients`);

      const status = await queueService.getQueueStatus();
      socket.emit('averageTimeUpdated', { averageConsultationTime: status.averageConsultationTime });
      socket.emit('queueStatusChanged', { isQueueOpen: status.isQueueOpen });
      if (status.currentToken) {
        socket.emit('currentTokenUpdated', {
          token: status.currentToken,
          displayToken: `QC-${status.currentToken}`,
        });
      }

      if (payload?.patientId) {
        const patientRoom = `patient:${payload.patientId}`;
        await socket.join(patientRoom);
        console.log(`[Socket] Client ${socket.id} joined room: ${patientRoom}`);

        const patientStatus = await queueService.getPatientStatus(payload.patientId);
        socket.emit('patientStatusUpdated', patientStatus);
      }
    } catch (err) {
      console.error(`[Socket] Error during joinPatient for socket ${socket.id}:`, err);
    }
  });

  /**
   * joinDisplay
   * Join the clinic TV display room.
   * Hydrates display with current token info and active queue list.
   */
  socket.on('joinDisplay', async () => {
    try {
      await socket.join('display');
      console.log(`[Socket] Client ${socket.id} joined room: display`);

      const [status, patients] = await Promise.all([
        queueService.getQueueStatus(),
        queueService.getPatients(),
      ]);

      socket.emit('queueUpdated', { patients });
      if (status.currentToken) {
        socket.emit('currentTokenUpdated', {
          token: status.currentToken,
          displayToken: `QC-${status.currentToken}`,
        });
      }
      socket.emit('queueStatusChanged', { isQueueOpen: status.isQueueOpen });
    } catch (err) {
      console.error(`[Socket] Error during joinDisplay for socket ${socket.id}:`, err);
    }
  });

  /**
   * callNext (Client -> Server trigger)
   * Allows receptionists to trigger calling next patient directly over WebSocket connection.
   */
  socket.on('callNext', async (payload?: { room?: string }) => {
    try {
      const patient = await queueService.callNextPatient(payload?.room);
      socket.emit('callNextAck', { success: true, patient });
    } catch (err: any) {
      console.error(`[Socket] callNext event failed for ${socket.id}:`, err.message);
      socket.emit('callNextAck', {
        success: false,
        message: err.message || 'Failed to call next patient',
        statusCode: err.statusCode || 500,
      });
    }
  });

  /**
   * addPatient (Client -> Server trigger)
   * Allows registration kiosks or receptionists to register patients over WebSocket.
   */
  socket.on('addPatient', async (payload: any) => {
    try {
      const patient = await queueService.addPatient(payload);
      socket.emit('addPatientAck', { success: true, patient });
    } catch (err: any) {
      console.error(`[Socket] addPatient event failed for ${socket.id}:`, err.message);
      socket.emit('addPatientAck', {
        success: false,
        message: err.message || 'Failed to register patient',
        statusCode: err.statusCode || 500,
      });
    }
  });

  /**
   * changeAverageTime (Client -> Server trigger)
   * Allows receptionists to manually set target average consultation time over WebSocket.
   */
  socket.on('changeAverageTime', async (payload: { averageConsultationTime: number }) => {
    try {
      const result = await queueService.updateAverageTime(payload.averageConsultationTime);
      socket.emit('changeAverageTimeAck', { success: true, ...result });
    } catch (err: any) {
      console.error(`[Socket] changeAverageTime event failed for ${socket.id}:`, err.message);
      socket.emit('changeAverageTimeAck', {
        success: false,
        message: err.message || 'Failed to change average time',
      });
    }
  });
};
