import { NotFoundError, ValidationError } from '../../lib/errors.ts';
import { paginated, toSkipTake, type Pagination } from '../../lib/pagination.ts';
import { prisma } from '../../lib/prisma.ts';
import { findOwnedCar } from '../cars/cars.service.ts';
import type { CreateReminderInput, UpdateReminderInput } from './reminders.schemas.ts';

export async function findReminder(userId: number, carId: number, reminderId: number) {
  await findOwnedCar(userId, carId);
  const reminder = await prisma.reminder.findFirst({ where: { id: reminderId, carId } });
  if (!reminder) throw new NotFoundError('Reminder not found');
  return reminder;
}

export async function listReminders(userId: number, carId: number, page: Pagination) {
  await findOwnedCar(userId, carId);
  const where = { carId };
  const [reminders, total] = await prisma.$transaction([
    prisma.reminder.findMany({ where, orderBy: { id: 'asc' }, ...toSkipTake(page) }),
    prisma.reminder.count({ where }),
  ]);
  return paginated(reminders, total, page);
}

export async function createReminder(userId: number, carId: number, input: CreateReminderInput) {
  await findOwnedCar(userId, carId);
  return prisma.reminder.create({ data: { ...input, carId } });
}

export async function updateReminder(
  userId: number,
  carId: number,
  reminderId: number,
  input: UpdateReminderInput,
) {
  const existing = await findReminder(userId, carId, reminderId);
  // The create rule (date or km) must still hold after the update is applied.
  const remindOn = input.remindOn === undefined ? existing.remindOn : input.remindOn;
  const remindAtKm = input.remindAtKm === undefined ? existing.remindAtKm : input.remindAtKm;
  if (remindOn == null && remindAtKm == null) {
    throw new ValidationError('Provide remindOn, remindAtKm, or both');
  }
  return prisma.reminder.update({ where: { id: reminderId }, data: input });
}

export async function deleteReminder(userId: number, carId: number, reminderId: number) {
  await findReminder(userId, carId, reminderId);
  await prisma.reminder.delete({ where: { id: reminderId } });
}
