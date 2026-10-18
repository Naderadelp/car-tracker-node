import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email());

export const registerBody = z.object({
  name: z.string().trim().min(1).max(100),
  email,
  // bcrypt only looks at the first 72 bytes, so longer passwords are rejected.
  password: z.string().min(8).max(72),
});

export const loginBody = z.object({
  email,
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerBody>;
export type LoginInput = z.infer<typeof loginBody>;
