import { Router, type Request, type Response } from 'express';
import { currentUser } from '../../middleware/authenticate.ts';
import { listDueReminders } from './due-reminders.service.ts';

export const dueRemindersRouter = Router();

dueRemindersRouter.get('/due', async (req: Request, res: Response) => {
  res.json({ data: await listDueReminders(currentUser(req).id) });
});
