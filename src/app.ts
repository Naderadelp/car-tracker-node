import express, { Router } from 'express';
import { NotFoundError } from './lib/errors.ts';
import { errorHandler } from './middleware/error-handler.ts';
import { authRouter } from './modules/auth/auth.routes.ts';

export const app = express();

app.use(express.json());

const api = Router();

api.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
api.use('/auth', authRouter);

app.use('/api', api);

app.use(() => {
  throw new NotFoundError('Route not found');
});
app.use(errorHandler);
