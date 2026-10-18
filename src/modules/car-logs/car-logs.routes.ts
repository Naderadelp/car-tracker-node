import { Router } from 'express';
import { paginationQuery } from '../../lib/pagination.ts';
import { validate } from '../../middleware/validate.ts';
import { carParams } from '../cars/cars.schemas.ts';
import * as controller from './car-logs.controller.ts';
import { createLogBody, logParams, updateLogBody } from './car-logs.schemas.ts';

// mergeParams lets this router see :carId from the path it is mounted on.
export const carLogsRouter = Router({ mergeParams: true });

carLogsRouter.get('/', validate({ params: carParams, query: paginationQuery }), controller.index);
carLogsRouter.post('/', validate({ params: carParams, body: createLogBody }), controller.store);
carLogsRouter.get('/:logId', validate({ params: logParams }), controller.show);
carLogsRouter.patch('/:logId', validate({ params: logParams, body: updateLogBody }), controller.update);
carLogsRouter.delete('/:logId', validate({ params: logParams }), controller.destroy);
