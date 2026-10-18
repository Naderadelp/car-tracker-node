import express, { Router } from 'express';
import { NotFoundError } from './lib/errors.ts';
import { errorHandler } from './middleware/error-handler.ts';

export const app = express();

app.use(express.json());

const api = Router();

api.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', api);

app.use(() => {
  throw new NotFoundError('Route not found');
});
app.use(errorHandler);
