import prisma from '../prisma/client';
import { emitToAll } from '../sockets/io';
import { transformPatient } from './patientService';
import { CustomError } from '../middleware/error';

export class QueueService {
  async callNextPatient(room: string) {
    // Fetch all patients in 'waiting' status, sorted by joinedAt ASC (oldest first)
    const waitingPatients = await prisma.patient.findMany({
      where: { status: 'waiting' },
      orderBy: { joinedAt: 'asc' },
    });

    if (waitingPatients.length === 0) {
      const err: CustomError = new Error('No patients waiting in queue');
      err.statusCode = 404;
      throw err;
    }

    // Scheduling Algorithm: Pick oldest urgent patient. If none, pick oldest normal patient.
    let nextPatient = waitingPatients.find((p) => p.priority === 'urgent');
    if (!nextPatient) {
      nextPatient = waitingPatients[0];
    }

    // Update the patient status to 'calling'
    const updated = await prisma.patient.update({
      where: { id: nextPatient.id },
      data: {
        status: 'calling',
        calledAt: new Date(),
        assignedRoom: room,
      },
    });

    const transformed = transformPatient(updated);

    // Broadcast socket updates
    emitToAll('currentTokenUpdated', { token: transformed.token });
    
    // Get updated list and broadcast
    const allPatients = await prisma.patient.findMany({
      orderBy: { joinedAt: 'asc' },
    });
    emitToAll('queueUpdated', allPatients.map(transformPatient));

    return transformed;
  }

  async getQueueStatus() {
    // 1. Get current calling token (most recently called patient who is currently 'calling')
    const activeCalling = await prisma.patient.findFirst({
      where: { status: 'calling' },
      orderBy: { calledAt: 'desc' },
    });

    const currentToken = activeCalling ? activeCalling.token : '';

    // 2. Get waiting and completed counts
    const waitingCount = await prisma.patient.count({
      where: { status: 'waiting' },
    });

    const completedCount = await prisma.patient.count({
      where: { status: 'completed' },
    });

    // 3. Get average consultation time setting
    let settings = await prisma.queueSettings.findUnique({
      where: { id: 'singleton' },
    });

    if (!settings) {
      settings = await prisma.queueSettings.create({
        data: {
          id: 'singleton',
          averageConsultationTime: 15,
        },
      });
    }

    return {
      currentToken,
      waitingCount,
      completedCount,
      averageConsultationTime: settings.averageConsultationTime,
    };
  }

  async updateAverageTime(minutes: number) {
    const settings = await prisma.queueSettings.upsert({
      where: { id: 'singleton' },
      update: { averageConsultationTime: minutes },
      create: { id: 'singleton', averageConsultationTime: minutes },
    });

    // Broadcast update
    emitToAll('averageTimeUpdated', { averageConsultationTime: settings.averageConsultationTime });

    return {
      averageConsultationTime: settings.averageConsultationTime,
    };
  }
}

export const queueService = new QueueService();
export default queueService;
