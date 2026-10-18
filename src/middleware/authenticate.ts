import type { Request, RequestHandler } from 'express';
import { UnauthorizedError } from '../lib/errors.ts';
import { findPublicUser, type PublicUser } from '../modules/auth/auth.service.ts';
import { verifyToken } from '../modules/auth/token.ts';

// Like `auth:sanctum`: reject the request unless it carries a valid Bearer token.
export const authenticate: RequestHandler = async (req, _res, next) => {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new UnauthorizedError();

  const userId = verifyToken(token);
  if (userId === null) throw new UnauthorizedError();

  const user = await findPublicUser(userId);
  if (!user) throw new UnauthorizedError();

  req.user = user;
  next();
};

// Like $request->user(), for routes behind authenticate.
export function currentUser(req: Request): PublicUser {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}
