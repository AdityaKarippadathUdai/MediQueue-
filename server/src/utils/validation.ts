import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    username: z
      .string({ required_error: 'Username is required' })
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must not exceed 30 characters')
      .trim(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
    name: z
      .string({ required_error: 'Full name is required' })
      .min(2, 'Name must be at least 2 characters')
      .trim(),
    room: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    username: z.string({ required_error: 'Username is required' }).trim(),
    password: z.string({ required_error: 'Password is required' }),
  }),
});

export const addPatientSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Patient name is required' })
      .min(1, 'Patient name cannot be empty')
      .trim(),
    purpose: z.string().optional(),
    priority: z.enum(['normal', 'urgent']).optional(),
  }),
});

export const updatePatientStatusSchema = z.object({
  body: z.object({
    status: z.enum(['waiting', 'calling', 'completed', 'no-show'], {
      required_error: 'Status is required',
    }),
    assignedRoom: z.string().optional(),
  }),
});

export const callNextPatientSchema = z.object({
  body: z.object({
    room: z.string().optional(),
  }),
});

export const updateAverageTimeSchema = z.object({
  body: z.object({
    averageConsultationTime: z
      .number({ required_error: 'Average consultation time in minutes is required' })
      .int()
      .min(1, 'Average consultation time must be at least 1 minute'),
  }),
});
