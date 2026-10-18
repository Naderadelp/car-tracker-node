import type { Request, Response } from 'express';
import type { Pagination } from '../../lib/pagination.ts';
import { currentUser } from '../../middleware/authenticate.ts';
import type { CarParams, CreateCarInput, UpdateCarInput } from './cars.schemas.ts';
import * as carsService from './cars.service.ts';

export async function index(req: Request, res: Response) {
  res.json(await carsService.listCars(currentUser(req).id, req.validated.query as Pagination));
}

export async function store(req: Request, res: Response) {
  const car = await carsService.createCar(currentUser(req).id, req.validated.body as CreateCarInput);
  res.status(201).json({ data: car });
}

export async function show(req: Request, res: Response) {
  const { carId } = req.validated.params as CarParams;
  res.json({ data: await carsService.findOwnedCar(currentUser(req).id, carId) });
}

export async function update(req: Request, res: Response) {
  const { carId } = req.validated.params as CarParams;
  const car = await carsService.updateCar(currentUser(req).id, carId, req.validated.body as UpdateCarInput);
  res.json({ data: car });
}

export async function destroy(req: Request, res: Response) {
  const { carId } = req.validated.params as CarParams;
  await carsService.deleteCar(currentUser(req).id, carId);
  res.status(204).end();
}
