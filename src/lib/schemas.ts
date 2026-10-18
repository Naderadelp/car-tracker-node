import { z } from 'zod';

// "2026-10-18" -> Date at UTC midnight, which is what Prisma expects for @db.Date columns.
export const isoDate = z.iso.date().transform((value) => new Date(value));

// Postgres `integer` columns stop at 2,147,483,647. Bigger numbers must be a 422 from
// validation, not a 500 from the database.
const INT4_MAX = 2_147_483_647;

export const id = z.coerce.number().int().positive().max(INT4_MAX);

export const km = z.number().int().min(0).max(INT4_MAX);
