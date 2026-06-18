import prisma from '../prisma/client';
import { hashPassword, comparePassword, signToken } from '../utils/auth';
import { CustomError } from '../middleware/error';

export class AuthService {
  async register(payload: { username: string; password: string; name: string }) {
    const existingUser = await prisma.receptionist.findUnique({
      where: { username: payload.username },
    });

    if (existingUser) {
      const err: CustomError = new Error('Username already taken');
      err.statusCode = 400;
      throw err;
    }

    const hashedPassword = await hashPassword(payload.password);
    const user = await prisma.receptionist.create({
      data: {
        username: payload.username,
        passwordHash: hashedPassword,
        name: payload.name,
      },
    });

    // Generate JWT
    const token = signToken({
      userId: user.id,
      username: user.username,
      role: 'Receptionist', // Default role
      room: 'Examination Room 1', // Default room
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: 'Receptionist',
        room: 'Examination Room 1',
      },
    };
  }

  async login(payload: { username: string; password: string }) {
    const user = await prisma.receptionist.findUnique({
      where: { username: payload.username },
    });

    if (!user) {
      const err: CustomError = new Error('Invalid username or password');
      err.statusCode = 401;
      throw err;
    }

    const isPasswordValid = await comparePassword(payload.password, user.passwordHash);
    if (!isPasswordValid) {
      const err: CustomError = new Error('Invalid username or password');
      err.statusCode = 401;
      throw err;
    }

    // Generate JWT
    const token = signToken({
      userId: user.id,
      username: user.username,
      role: 'Receptionist',
      room: 'Examination Room 1',
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: 'Receptionist',
        room: 'Examination Room 1',
      },
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.receptionist.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const err: CustomError = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: 'Receptionist',
      room: 'Examination Room 1',
    };
  }
}

export const authService = new AuthService();
export default authService;
