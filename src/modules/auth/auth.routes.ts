import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.ts';
import { validate } from '../../middleware/validate.ts';
import * as controller from './auth.controller.ts';
import { loginBody, registerBody } from './auth.schemas.ts';

export const authRouter = Router();

authRouter.post('/register', validate({ body: registerBody }), controller.register);
authRouter.post('/login', validate({ body: loginBody }), controller.login);
authRouter.get('/me', authenticate, controller.me);
