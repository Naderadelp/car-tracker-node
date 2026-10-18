import { z } from 'zod';
import { id, isoDate, km } from '../../lib/schemas.ts';
import { carParams } from '../cars/cars.schemas.ts';

export const logParams = carParams.extend({ logId: id });

export const createLogBody = z.object({
  title: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(50).nullish(),
  odometerAtService: km,
  actualCost: z.number().min(0).max(99999999.99).nullish(),
  performedAt: isoDate,
  notes: z.string().max(5000).nullish(),
});

export const updateLogBody = createLogBody.partial();

export type LogParams = z.infer<typeof logParams>;
export type CreateLogInput = z.infer<typeof createLogBody>;
export type UpdateLogInput = z.infer<typeof updateLogBody>;
