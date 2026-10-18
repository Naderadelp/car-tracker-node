import type { Request, Response } from 'express';
import type { Pagination } from '../../lib/pagination.ts';
import { currentUser } from '../../middleware/authenticate.ts';
import type { CarParams } from '../cars/cars.schemas.ts';
import type { CreateLogInput, LogParams, UpdateLogInput } from './car-logs.schemas.ts';
import * as logsService from './car-logs.service.ts';

export async function index(req: Request, res: Response) {
  const { carId } = req.validated.params as CarParams;
  res.json(await logsService.listLogs(currentUser(req).id, carId, req.validated.query as Pagination));
}

export async function store(req: Request, res: Response) {
  const { carId } = req.validated.params as CarParams;
  const log = await logsService.createLog(currentUser(req).id, carId, req.validated.body as CreateLogInput);
  res.status(201).json({ data: log });
}

export async function show(req: Request, res: Response) {
  const { carId, logId } = req.validated.params as LogParams;
  res.json({ data: await logsService.findLog(currentUser(req).id, carId, logId) });
}

export async function update(req: Request, res: Response) {
  const { carId, logId } = req.validated.params as LogParams;
  const log = await logsService.updateLog(currentUser(req).id, carId, logId, req.validated.body as UpdateLogInput);
  res.json({ data: log });
}

export async function destroy(req: Request, res: Response) {
  const { carId, logId } = req.validated.params as LogParams;
  await logsService.deleteLog(currentUser(req).id, carId, logId);
  res.status(204).end();
}
