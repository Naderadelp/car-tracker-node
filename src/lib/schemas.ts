import { z } from 'zod';

// "2026-10-18" -> Date at UTC midnight, which is what Prisma expects for @db.Date columns.
export const isoDate = z.iso.date().transform((value) => new Date(value));

export const id = z.coerce.number().int().positive();
