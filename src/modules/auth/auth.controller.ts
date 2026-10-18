import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/authenticate.ts';
import type { LoginInput, RegisterInput } from './auth.schemas.ts';
import * as authService from './auth.service.ts';

export async function register(req: Request, res: Response) {
  const result = await authService.register(req.validated.body as RegisterInput);
  res.status(201).json({ data: result });
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.validated.body as LoginInput);
  res.json({ data: result });
}

export function me(req: Request, res: Response) {
  res.json({ data: currentUser(req) });
}
