import { Router } from 'express';
import { paginationQuery } from '../../lib/pagination.ts';
import { validate } from '../../middleware/validate.ts';
import * as controller from './cars.controller.ts';
import { carParams, createCarBody, updateCarBody } from './cars.schemas.ts';

export const carsRouter = Router();

carsRouter.get('/', validate({ query: paginationQuery }), controller.index);
carsRouter.post('/', validate({ body: createCarBody }), controller.store);
carsRouter.get('/:carId', validate({ params: carParams }), controller.show);
carsRouter.patch('/:carId', validate({ params: carParams, body: updateCarBody }), controller.update);
carsRouter.delete('/:carId', validate({ params: carParams }), controller.destroy);
