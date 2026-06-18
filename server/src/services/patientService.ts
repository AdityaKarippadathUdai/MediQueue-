import prisma from '../prisma/client';
import { emitToAll } from '../sockets/io';
import { CustomError } from '../middleware/error';
import { QueueToken, TokenStatus } from '@prisma/client';

export const transformPatient = (pt: QueueToken) => {
  // Map database enum to client status strings
  let clientStatus: 'waiting' | 'calling' | 'completed' | 'no-show' = 'waiting';
  if (pt.status === TokenStatus.CALLED) {
    clientStatus = 'calling';
  } else if (pt.status === TokenStatus.COMPLETED) {
    clientStatus = 'completed';
  } else if (pt.status === TokenStatus.CANCELLED) {
    clientStatus = 'no-show';
  }

  return {
    id: pt.id,
    _id: pt.id, // Support client expectations
    name: pt.patientName,
    token: pt.tokenNumber,
    status: clientStatus,
    purpose: `Phone: ${pt.patientPhone}`, // Map phone to purpose for visual UI rendering
    priority: 'normal' as 'normal' | 'urgent',
    joinedAt: pt.createdAt.toISOString(),
    calledAt: pt.status === TokenStatus.CALLED || pt.status === TokenStatus.COMPLETED ? pt.updatedAt.toISOString() : undefined,
    assignedRoom: 'Examination Room 1',
  };
};

export class PatientService {
  // Helper to get default department
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

  // Helper to get or reset QueueSettings for a department
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
      // Daily reset: Date has changed, start tokens back at 0
      settings = await prisma.queueSettings.update({
        where: { departmentId },
        data: {
          currentToken: 0,
          lastIssuedToken: 0,
          resetDate: today,
        },
      });
      console.log(`Daily reset executed for department ${departmentId} on date ${today}.`);
    }

    return settings;
  }

  async getPatients() {
    const today = new Date().toISOString().split('T')[0];
    const dept = await this.getDefaultDepartment();

    // Retrieve today's tokens in order
    const tokens = await prisma.queueToken.findMany({
      where: {
        date: today,
        departmentId: dept.id,
      },
      orderBy: { tokenNumber: 'asc' },
    });

    return tokens.map(transformPatient);
  }

  async getPatientById(id: string) {
    const token = await prisma.queueToken.findUnique({
      where: { id },
    });
    if (!token) {
      const err: CustomError = new Error('Token not found');
      err.statusCode = 404;
      throw err;
    }
    return transformPatient(token);
  }

  async addPatient(payload: { name: string; purpose?: string }) {
    const today = new Date().toISOString().split('T')[0];
    const dept = await this.getDefaultDepartment();

    // Get current settings (with automatic daily reset logic)
    const settings = await this.getOrResetSettings(dept.id, today);

    // Increment lastIssuedToken
    const nextTokenNumber = settings.lastIssuedToken + 1;

    // Update settings in database
    await prisma.queueSettings.update({
      where: { id: settings.id },
      data: { lastIssuedToken: nextTokenNumber },
    });

    // Extract purpose string to use as phone number
    const phone = payload.purpose && payload.purpose.trim() ? payload.purpose : '000-000-0000';

    // Create the QueueToken
    const token = await prisma.queueToken.create({
      data: {
        tokenNumber: nextTokenNumber,
        patientName: payload.name,
        patientPhone: phone,
        status: TokenStatus.WAITING,
        date: today,
        departmentId: dept.id,
      },
    });

    const transformed = transformPatient(token);

    // Broadcast socket updates
    emitToAll('patientAdded', transformed);
    const allPatients = await this.getPatients();
    emitToAll('queueUpdated', allPatients);

    return transformed;
  }

  async updatePatientStatus(id: string, payload: { status: string }) {
    const existing = await prisma.queueToken.findUnique({
      where: { id },
    });

    if (!existing) {
      const err: CustomError = new Error('Token not found');
      err.statusCode = 404;
      throw err;
    }

    // Map client status string back to database enum
    let dbStatus: TokenStatus = TokenStatus.WAITING;
    if (payload.status === 'calling') {
      dbStatus = TokenStatus.CALLED;
    } else if (payload.status === 'completed') {
      dbStatus = TokenStatus.COMPLETED;
    } else if (payload.status === 'no-show' || payload.status === 'cancelled') {
      dbStatus = TokenStatus.CANCELLED;
    }

    const updated = await prisma.queueToken.update({
      where: { id },
      data: { status: dbStatus },
    });

    const transformed = transformPatient(updated);

    // Broadcast updates
    if (dbStatus === TokenStatus.CALLED) {
      // Update the settings currentToken
      await prisma.queueSettings.update({
        where: { departmentId: existing.departmentId },
        data: { currentToken: transformed.token },
      });
      emitToAll('currentTokenUpdated', { token: transformed.token });
    } else if (dbStatus === TokenStatus.COMPLETED) {
      emitToAll('patientCompleted', transformed);
    }

    const allPatients = await this.getPatients();
    emitToAll('queueUpdated', allPatients);

    return transformed;
  }

  async deletePatient(id: string) {
    const existing = await prisma.queueToken.findUnique({
      where: { id },
    });

    if (!existing) {
      const err: CustomError = new Error('Token not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.queueToken.delete({
      where: { id },
    });

    // Broadcast updates
    const allPatients = await this.getPatients();
    emitToAll('queueUpdated', allPatients);
  }
}

export const patientService = new PatientService();
export default patientService;
