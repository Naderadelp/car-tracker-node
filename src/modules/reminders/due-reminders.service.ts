import { prisma } from '../../lib/prisma.ts';

export type DueReminder = {
  id: number;
  carId: number;
  title: string;
  description: string | null;
  remindOn: Date | null;
  remindAtKm: number | null;
  currentKm: number;
  dueBy: 'date' | 'km' | 'both';
};

// A reminder is due when its date has arrived OR its car has reached the target km.
// The km half compares two columns (cars.current_km vs reminders.remind_at_km), which
// Prisma's query API can't express across a relation, so this is raw SQL. The ${userId}
// placeholder is sent as a bound parameter, not pasted into the string, so it's injection-safe.
export function listDueReminders(userId: number) {
  return prisma.$queryRaw<DueReminder[]>`
    SELECT r.id,
           r.car_id       AS "carId",
           r.title,
           r.description,
           r.remind_on    AS "remindOn",
           r.remind_at_km AS "remindAtKm",
           c.current_km   AS "currentKm",
           CASE
             WHEN r.remind_on <= CURRENT_DATE AND c.current_km >= r.remind_at_km THEN 'both'
             WHEN r.remind_on <= CURRENT_DATE THEN 'date'
             ELSE 'km'
           END AS "dueBy"
    FROM reminders r
    JOIN cars c ON c.id = r.car_id
    WHERE c.user_id = ${userId}
      AND r.notified_at IS NULL
      AND (r.remind_on <= CURRENT_DATE OR c.current_km >= r.remind_at_km)
    ORDER BY r.remind_on ASC NULLS LAST, r.id ASC
  `;
}
