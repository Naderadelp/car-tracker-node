import type { Request, Response } from 'express';
import type { Pagination } from '../../lib/pagination.ts';
import { currentUser } from '../../middleware/authenticate.ts';
import type { CarParams } from '../cars/cars.schemas.ts';
import type { CreateReminderInput, ReminderParams, UpdateReminderInput } from './reminders.schemas.ts';
import * as remindersService from './reminders.service.ts';

export async function index(req: Request, res: Response) {
  const { carId } = req.validated.params as CarParams;
  res.json(await remindersService.listReminders(currentUser(req).id, carId, req.validated.query as Pagination));
}

export async function store(req: Request, res: Response) {
  const { carId } = req.validated.params as CarParams;
  const reminder = await remindersService.createReminder(
    currentUser(req).id,
    carId,
    req.validated.body as CreateReminderInput,
  );
  res.status(201).json({ data: reminder });
}

export async function show(req: Request, res: Response) {
  const { carId, reminderId } = req.validated.params as ReminderParams;
  res.json({ data: await remindersService.findReminder(currentUser(req).id, carId, reminderId) });
}

export async function update(req: Request, res: Response) {
  const { carId, reminderId } = req.validated.params as ReminderParams;
  const reminder = await remindersService.updateReminder(
    currentUser(req).id,
    carId,
    reminderId,
    req.validated.body as UpdateReminderInput,
  );
  res.json({ data: reminder });
}

export async function destroy(req: Request, res: Response) {
  const { carId, reminderId } = req.validated.params as ReminderParams;
  await remindersService.deleteReminder(currentUser(req).id, carId, reminderId);
  res.status(204).end();
}
