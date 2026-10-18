import { register } from '../src/modules/auth/auth.service.ts';

let counter = 0;

// Creates a user through the real register logic and returns a ready-to-use auth header.
export async function createUser(overrides: { name?: string; email?: string; password?: string } = {}) {
  counter += 1;
  const { user, token } = await register({
    name: overrides.name ?? `User ${counter}`,
    email: overrides.email ?? `user${counter}@example.com`,
    password: overrides.password ?? 'password123',
  });
  return { user, token, auth: `Bearer ${token}` };
}
