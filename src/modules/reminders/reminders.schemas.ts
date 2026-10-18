import { z } from 'zod';
import { id, isoDate } from '../../lib/schemas.ts';
import { carParams } from '../cars/cars.schemas.ts';

export const reminderParams = carParams.extend({ reminderId: id });

const reminderFields = {
  title: z.string().trim().min(1).max(100),
  description: z.string().max(5000).nullish(),
  remindOn: isoDate.nullish(),
  remindAtKm: z.number().int().min(0).nullish(),
};

export const createReminderBody = z
  .object(reminderFields)
  .refine((r) => r.remindOn != null || r.remindAtKm != null, {
    message: 'Provide remindOn, remindAtKm, or both',
    path: ['remindOn'],
  });

export const updateReminderBody = z
  .object({
    ...reminderFields,
    notifiedAt: z.iso.datetime().transform((value) => new Date(value)).nullish(),
  })
  .partial();

export type ReminderParams = z.infer<typeof reminderParams>;
export type CreateReminderInput = z.infer<typeof createReminderBody>;
export type UpdateReminderInput = z.infer<typeof updateReminderBody>;
