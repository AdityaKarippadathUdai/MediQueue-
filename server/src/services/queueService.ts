import prisma from '../prisma/client';
import { emitToAll } from '../sockets/io';
import { transformPatient } from './patientService';
import { CustomError } from '../middleware/error';
import { TokenStatus } from '@prisma/client';

export class QueueService {
  async getDefaultDepartment() {
    let dept = await prisma.department.findUnique({
      where: { code: 'GEN' },
    });
    if (!dept) {
      dept = await prisma.department.create({
        data: { name: 'General Medicine', code: 'GEN' },
      });
    }
    return dept;
  }

  async getOrResetSettings(departmentId: string, today: string) {
    let settings = await prisma.queueSettings.findUnique({
      where: { departmentId },
    });

    if (!settings) {
      settings = await prisma.queueSettings.create({
        data: {
          currentToken: 0,
          lastIssuedToken: 0,
          resetDate: today,
          departmentId,
        },
      });
    } else if (settings.resetDate !== today) {
      settings = await prisma.queueSettings.update({
        where: { departmentId },
        data: {
          currentToken: 0,
          lastIssuedToken: 0,
          resetDate: today,
        },
      });
    }

    return settings;
  }

  async callNextPatient(room: string) {
    const today = new Date().toISOString().split('T')[0];
    const dept = await this.getDefaultDepartment();

    // Ensure settings are synced/reset
    await this.getOrResetSettings(dept.id, today);

    // Fetch the next waiting token (sorted by tokenNumber ASC)
    const nextToken = await prisma.queueToken.findFirst({
      where: {
        status: TokenStatus.WAITING,
        date: today,
        departmentId: dept.id,
      },
      orderBy: { tokenNumber: 'asc' },
    });

    if (!nextToken) {
      const err: CustomError = new Error('No patients waiting in queue');
      err.statusCode = 404;
      throw err;
    }

    // Update token status to CALLED
    const updatedToken = await prisma.queueToken.update({
      where: { id: nextToken.id },
      data: { status: TokenStatus.CALLED },
    });

    const transformed = transformPatient(updatedToken);

    // Update settings currentToken
    await prisma.queueSettings.update({
      where: { departmentId: dept.id },
      data: { currentToken: transformed.token },
    });

    // Broadcast socket updates
    emitToAll('currentTokenUpdated', { token: transformed.token });

    // Retrieve today's updated tokens in order
    const tokens = await prisma.queueToken.findMany({
      where: {
        date: today,
        departmentId: dept.id,
      },
      orderBy: { tokenNumber: 'asc' },
    });
    emitToAll('queueUpdated', tokens.map(transformPatient));

    return transformed;
  }

  async getQueueStatus() {
    const today = new Date().toISOString().split('T')[0];
    const dept = await this.getDefaultDepartment();

    const settings = await this.getOrResetSettings(dept.id, today);

    const waitingCount = await prisma.queueToken.count({
      where: {
        status: TokenStatus.WAITING,
        date: today,
        departmentId: dept.id,
      },
    });

    const completedCount = await prisma.queueToken.count({
      where: {
        status: TokenStatus.COMPLETED,
        date: today,
        departmentId: dept.id,
      },
    });

    return {
      currentToken: settings.currentToken > 0 ? settings.currentToken : '',
      waitingCount,
      completedCount,
      averageConsultationTime: 15, // Return default 15m as it is no longer stored in QueueSettings
    };
  }

  async updateAverageTime(minutes: number) {
    // Since settings table does not store average consultation time anymore, we mock it for frontend compatibility
    emitToAll('averageTimeUpdated', { averageConsultationTime: minutes });
    return {
      averageConsultationTime: minutes,
    };
  }
}

export const queueService = new QueueService();
export default queueService;
