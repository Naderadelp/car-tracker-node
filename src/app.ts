import express, { Router } from 'express';
import { NotFoundError } from './lib/errors.ts';
import { authenticate } from './middleware/authenticate.ts';
import { errorHandler } from './middleware/error-handler.ts';
import { authRouter } from './modules/auth/auth.routes.ts';
import { carLogsRouter } from './modules/car-logs/car-logs.routes.ts';
import { carsRouter } from './modules/cars/cars.routes.ts';

export const app = express();

app.use(express.json());

const api = Router();

api.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});
api.use('/auth', authRouter);

// Everything below needs a logged-in user, like Route::middleware('auth:sanctum')->group(...).
api.use(authenticate);
api.use('/cars', carsRouter);
api.use('/cars/:carId/logs', carLogsRouter);

app.use('/api', api);

app.use(() => {
  throw new NotFoundError('Route not found');
});
app.use(errorHandler);
