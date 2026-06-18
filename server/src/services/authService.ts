import prisma from '../prisma/client';
import { hashPassword, comparePassword, signToken } from '../utils/auth';
import { CustomError } from '../middleware/error';

export class AuthService {
  async register(payload: { username: string; password: string; name: string; room?: string }) {
    const existingUser = await prisma.user.findUnique({
      where: { username: payload.username },
    });

    if (existingUser) {
      const err: CustomError = new Error('Username already taken');
      err.statusCode = 400;
      throw err;
    }

    const hashedPassword = await hashPassword(payload.password);
    const user = await prisma.user.create({
      data: {
        username: payload.username,
        password: hashedPassword,
        name: payload.name,
        room: payload.room || 'Examination Room 1',
      },
    });

    // Generate JWT
    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      room: user.room,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        room: user.room,
      },
    };
  }

  async login(payload: { username: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { username: payload.username },
    });

    if (!user) {
      const err: CustomError = new Error('Invalid username or password');
      err.statusCode = 401;
      throw err;
    }

    const isPasswordValid = await comparePassword(payload.password, user.password);
    if (!isPasswordValid) {
      const err: CustomError = new Error('Invalid username or password');
      err.statusCode = 401;
      throw err;
    }

    // Generate JWT
    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      room: user.room,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        room: user.room,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
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
      role: user.role,
      room: user.room,
    };
  }
}

export const authService = new AuthService();
export default authService;
