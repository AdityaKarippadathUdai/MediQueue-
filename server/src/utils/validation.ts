import { z } from 'zod';

// ─────────────────────────────────────────────
// PIN Authentication
// ─────────────────────────────────────────────

export const verifyPinSchema = z.object({
  body: z.object({
    pin: z
      .string({ required_error: 'PIN is required' })
      .min(4, 'PIN must be exactly 4 digits')
      .max(4, 'PIN must be exactly 4 digits')
      .regex(/^\d{4}$/, 'PIN must be numeric'),
  }),
});

// ─────────────────────────────────────────────
// Patient Management
// ─────────────────────────────────────────────

export const addPatientSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Patient name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters')
      .trim(),
    purpose: z
      .string()
      .max(200, 'Purpose must not exceed 200 characters')
      .trim()
      .optional(),
    phone: z
      .string()
      .regex(/^[\d\s\-\+\(\)]{7,15}$/, 'Invalid phone number format')
      .optional(),
    priority: z.enum(['normal', 'urgent']).optional().default('normal'),
  }),
});

export const updatePatientStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid patient ID format'),
  }),
  body: z.object({
    status: z.enum(['waiting', 'active', 'completed', 'no-show'], {
      required_error: 'Status is required',
    }),
    assignedRoom: z.string().trim().optional(),
  }),
});

export const patientIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid patient ID format'),
  }),
});

// ─────────────────────────────────────────────
// Queue Controls
// ─────────────────────────────────────────────

export const callNextPatientSchema = z.object({
  body: z.object({
    room: z.string().trim().optional(),
  }),
});

export const updateAverageTimeSchema = z.object({
  body: z.object({
    averageConsultationTime: z
      .number({ required_error: 'Average consultation time is required' })
      .int('Must be a whole number of minutes')
      .min(1, 'Must be at least 1 minute')
      .max(120, 'Must not exceed 120 minutes'),
  }),
});

export const setQueueOpenSchema = z.object({
  body: z.object({
    isQueueOpen: z.boolean({ required_error: 'isQueueOpen boolean is required' }),
  }),
});
