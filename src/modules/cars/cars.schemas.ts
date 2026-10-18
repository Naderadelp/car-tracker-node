import { z } from 'zod';
import { id, isoDate } from '../../lib/schemas.ts';

export const carParams = z.object({ carId: id });

// Unknown keys (e.g. "userId") are stripped by z.object, which is what $fillable does in Laravel.
export const createCarBody = z.object({
  make: z.string().trim().min(1).max(50),
  model: z.string().trim().min(1).max(50),
  color: z.string().trim().min(1).max(30).nullish(),
  currentKm: z.number().int().min(0).optional(),
  tankSize: z.number().positive().max(9999.99).nullish(),
  purchasedAt: isoDate.nullish(),
});

// No .default() anywhere above: in Zod 4 defaults still apply inside .partial(),
// which would silently reset fields on every PATCH.
export const updateCarBody = createCarBody.partial();

export type CarParams = z.infer<typeof carParams>;
export type CreateCarInput = z.infer<typeof createCarBody>;
export type UpdateCarInput = z.infer<typeof updateCarBody>;
