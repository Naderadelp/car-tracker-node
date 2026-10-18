import { Router } from 'express';
import { paginationQuery } from '../../lib/pagination.ts';
import { validate } from '../../middleware/validate.ts';
import { carParams } from '../cars/cars.schemas.ts';
import * as controller from './reminders.controller.ts';
import { createReminderBody, reminderParams, updateReminderBody } from './reminders.schemas.ts';

export const carRemindersRouter = Router({ mergeParams: true });

carRemindersRouter.get('/', validate({ params: carParams, query: paginationQuery }), controller.index);
carRemindersRouter.post('/', validate({ params: carParams, body: createReminderBody }), controller.store);
carRemindersRouter.get('/:reminderId', validate({ params: reminderParams }), controller.show);
carRemindersRouter.patch(
  '/:reminderId',
  validate({ params: reminderParams, body: updateReminderBody }),
  controller.update,
);
carRemindersRouter.delete('/:reminderId', validate({ params: reminderParams }), controller.destroy);
