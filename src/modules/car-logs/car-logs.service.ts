import type { Prisma } from '../../generated/prisma/client.ts';
import { NotFoundError } from '../../lib/errors.ts';
import { paginated, toSkipTake, type Pagination } from '../../lib/pagination.ts';
import { prisma } from '../../lib/prisma.ts';
import { findOwnedCar } from '../cars/cars.service.ts';
import type { CreateLogInput, UpdateLogInput } from './car-logs.schemas.ts';

// Raise the car's odometer to `km`, never lower it. The condition lives in the WHERE
// clause, so two logs saved at once can't overwrite each other with a smaller value.
async function advanceOdometer(tx: Prisma.TransactionClient, carId: number, km: number) {
  await tx.car.updateMany({ where: { id: carId, currentKm: { lt: km } }, data: { currentKm: km } });
}

export async function findLog(userId: number, carId: number, logId: number) {
  await findOwnedCar(userId, carId);
  const log = await prisma.carLog.findFirst({ where: { id: logId, carId } });
  if (!log) throw new NotFoundError('Log not found');
  return log;
}

export async function listLogs(userId: number, carId: number, page: Pagination) {
  await findOwnedCar(userId, carId);
  const where = { carId };
  const [logs, total] = await prisma.$transaction([
    prisma.carLog.findMany({
      where,
      orderBy: [{ performedAt: 'desc' }, { id: 'desc' }],
      ...toSkipTake(page),
    }),
    prisma.carLog.count({ where }),
  ]);
  return paginated(logs, total, page);
}

export async function createLog(userId: number, carId: number, input: CreateLogInput) {
  await findOwnedCar(userId, carId);
  return prisma.$transaction(async (tx) => {
    const log = await tx.carLog.create({ data: { ...input, carId } });
    await advanceOdometer(tx, carId, input.odometerAtService);
    return log;
  });
}

export async function updateLog(userId: number, carId: number, logId: number, input: UpdateLogInput) {
  await findLog(userId, carId, logId);
  return prisma.$transaction(async (tx) => {
    const log = await tx.carLog.update({ where: { id: logId }, data: input });
    if (input.odometerAtService !== undefined) {
      await advanceOdometer(tx, carId, input.odometerAtService);
    }
    return log;
  });
}

// Deleting a log never lowers the car's odometer.
export async function deleteLog(userId: number, carId: number, logId: number) {
  await findLog(userId, carId, logId);
  await prisma.carLog.delete({ where: { id: logId } });
}
