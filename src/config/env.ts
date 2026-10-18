import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  // A number of seconds, or a number plus a unit jsonwebtoken understands, e.g. "7d", "12h".
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+(ms|s|m|h|d|w|y)?$/, 'Use a duration like 7d, 12h or 3600')
    .default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
});

// Parsed once at startup: a missing or invalid variable crashes the app immediately
// instead of failing later in the middle of a request.
export const env = envSchema.parse(process.env);
