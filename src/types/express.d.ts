import type { PublicUser } from '../modules/auth/auth.service.ts';

declare global {
  namespace Express {
    interface Request {
      // Set by the authenticate middleware.
      user?: PublicUser;
      // Set by the validate middleware: the parsed and coerced request input.
      validated: { body: unknown; params: unknown; query: unknown };
    }
  }
}

export {};
