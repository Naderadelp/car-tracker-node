import { NotFoundError } from '../../lib/errors.ts';
import { paginated, toSkipTake, type Pagination } from '../../lib/pagination.ts';
import { prisma } from '../../lib/prisma.ts';
import type { CreateCarInput, UpdateCarInput } from './cars.schemas.ts';

// The ownership check used by every /cars/:carId route. Someone else's car is a 404,
// not a 403, so the API never confirms that it exists.
export async function findOwnedCar(userId: number, carId: number) {
  const car = await prisma.car.findFirst({ where: { id: carId, userId } });
  if (!car) throw new NotFoundError('Car not found');
  return car;
}

export async function listCars(userId: number, page: Pagination) {
  const where = { userId };
  const [cars, total] = await prisma.$transaction([
    prisma.car.findMany({ where, orderBy: { id: 'asc' }, ...toSkipTake(page) }),
    prisma.car.count({ where }),
  ]);
  return paginated(cars, total, page);
}

export function createCar(userId: number, input: CreateCarInput) {
  return prisma.car.create({ data: { ...input, userId } });
}

export async function updateCar(userId: number, carId: number, input: UpdateCarInput) {
  await findOwnedCar(userId, carId);
  return prisma.car.update({ where: { id: carId }, data: input });
}

export async function deleteCar(userId: number, carId: number) {
  await findOwnedCar(userId, carId);
  await prisma.car.delete({ where: { id: carId } });
}
