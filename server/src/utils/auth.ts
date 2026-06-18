import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config';
import { UserPayload } from '../types';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const signToken = (payload: UserPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
};

export const verifyToken = (token: string): UserPayload => {
  return jwt.verify(token, config.jwtSecret) as UserPayload;
};
