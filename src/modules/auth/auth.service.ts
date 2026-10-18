import bcrypt from 'bcryptjs';
import { env } from '../../config/env.ts';
import { Prisma } from '../../generated/prisma/client.ts';
import { ConflictError, UnauthorizedError } from '../../lib/errors.ts';
import { prisma } from '../../lib/prisma.ts';
import type { LoginInput, RegisterInput } from './auth.schemas.ts';
import { signToken } from './token.ts';

// Every column except passwordHash. Like $hidden on a Laravel model, but explicit per query.
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError('Email is already registered');

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
  try {
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash },
      select: publicUserSelect,
    });
    return { user, token: signToken(user.id) };
  } catch (err) {
    // Two registrations with the same email at the same moment: the unique index wins.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('Email is already registered');
    }
    throw err;
  }
}

export async function login(input: LoginInput) {
  const found = await prisma.user.findUnique({ where: { email: input.email } });
  // Same error for "no such user" and "wrong password", so the API doesn't reveal which emails exist.
  if (!found || !(await bcrypt.compare(input.password, found.passwordHash))) {
    throw new UnauthorizedError('Invalid email or password');
  }
  const { passwordHash: _passwordHash, ...user } = found;
  return { user, token: signToken(user.id) };
}

export function findPublicUser(id: number) {
  return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
}
