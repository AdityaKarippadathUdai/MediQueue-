import prisma from '../prisma/client';
import { emitToAll } from '../sockets/io';
import { CustomError } from '../middleware/error';
import { Patient } from '@prisma/client';

export const transformPatient = (pt: Patient) => {
  return {
    ...pt,
    _id: pt.id, // For frontend compatibility (ApiPatientResponse expectations)
    token: pt.token,
    joinedAt: pt.joinedAt.toISOString(),
    calledAt: pt.calledAt ? pt.calledAt.toISOString() : undefined,
  };
};

export class PatientService {
  async getPatients() {
    const patients = await prisma.patient.findMany({
      orderBy: [
        { joinedAt: 'asc' },
      ],
    });
    return patients.map(transformPatient);
  }

  async getPatientById(id: string) {
    const patient = await prisma.patient.findUnique({
      where: { id },
    });
    if (!patient) {
      const err: CustomError = new Error('Patient not found');
      err.statusCode = 404;
      throw err;
    }
    return transformPatient(patient);
  }

  async addPatient(payload: { name: string; purpose?: string; priority?: 'normal' | 'urgent' }) {
    const patient = await prisma.patient.create({
      data: {
        name: payload.name,
        purpose: payload.purpose || 'General Consultation',
        priority: payload.priority || 'normal',
        status: 'waiting',
      },
    });

    const transformed = transformPatient(patient);

    // Broadcast socket events
    emitToAll('patientAdded', transformed);
    const allPatients = await this.getPatients();
    emitToAll('queueUpdated', allPatients);

    return transformed;
  }

  async updatePatientStatus(id: string, payload: { status: string; assignedRoom?: string }) {
    const existing = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existing) {
      const err: CustomError = new Error('Patient not found');
      err.statusCode = 404;
      throw err;
    }

    const dataToUpdate: any = {
      status: payload.status,
    };

    if (payload.status === 'calling') {
      dataToUpdate.calledAt = new Date();
      if (payload.assignedRoom) {
        dataToUpdate.assignedRoom = payload.assignedRoom;
      }
    } else if (payload.status === 'completed' || payload.status === 'no-show') {
      // Keep assigned room or clean it up if necessary. Keeping is usually fine for records.
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: dataToUpdate,
    });

    const transformed = transformPatient(updated);

    // Broadcast updates
    if (payload.status === 'calling') {
      emitToAll('currentTokenUpdated', { token: transformed.token });
    } else if (payload.status === 'completed') {
      emitToAll('patientCompleted', transformed);
    }

    const allPatients = await this.getPatients();
    emitToAll('queueUpdated', allPatients);

    return transformed;
  }

  async deletePatient(id: string) {
    const existing = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existing) {
      const err: CustomError = new Error('Patient not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.patient.delete({
      where: { id },
    });

    // Broadcast updates
    const allPatients = await this.getPatients();
    emitToAll('queueUpdated', allPatients);
  }
}

export const patientService = new PatientService();
export default patientService;
