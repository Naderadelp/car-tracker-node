import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCar, createUser } from '../../../tests/helpers.ts';
import { app } from '../../app.ts';
import { prisma } from '../../lib/prisma.ts';

function reminder(carId: number, data: { remindOn?: string; remindAtKm?: number; notifiedAt?: Date }) {
  return prisma.reminder.create({
    data: {
      carId,
      title: 'Reminder',
      remindOn: data.remindOn ? new Date(data.remindOn) : null,
      remindAtKm: data.remindAtKm ?? null,
      notifiedAt: data.notifiedAt ?? null,
    },
  });
}

// The test database runs in UTC (Docker default), so "today" is the UTC date.
const today = new Date().toISOString().slice(0, 10);

describe('GET /api/reminders/due', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/reminders/due');

    expect(res.status).toBe(401);
  });

  it('includes reminders due by date, by km, and by both', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id, { currentKm: 60000 });
    const byDate = await reminder(car.id, { remindOn: '2020-01-01' });
    const byKm = await reminder(car.id, { remindAtKm: 60000 });
    const byBoth = await reminder(car.id, { remindOn: '2021-01-01', remindAtKm: 50000 });

    const res = await request(app).get('/api/reminders/due').set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body.data.map((r: { id: number; dueBy: string }) => [r.id, r.dueBy])).toEqual([
      [byDate.id, 'date'],
      [byBoth.id, 'both'],
      [byKm.id, 'km'],
    ]);
    expect(res.body.data[0]).toMatchObject({ carId: car.id, currentKm: 60000 });
  });

  it('treats a reminder dated today as due', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id);
    await reminder(car.id, { remindOn: today });

    const res = await request(app).get('/api/reminders/due').set('Authorization', auth);

    expect(res.body.data).toHaveLength(1);
  });

  it('excludes future dates, unreached km, and already-notified reminders', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id, { currentKm: 60000 });
    await reminder(car.id, { remindOn: '2099-01-01' });
    await reminder(car.id, { remindAtKm: 60001 });
    await reminder(car.id, { remindOn: '2099-01-01', remindAtKm: 70000 });
    await reminder(car.id, { remindOn: '2020-01-01', notifiedAt: new Date() });

    const res = await request(app).get('/api/reminders/due').set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("excludes other users' due reminders", async () => {
    const { auth } = await createUser();
    const other = await createUser();
    const theirCar = await createCar(other.user.id, { currentKm: 99999 });
    await reminder(theirCar.id, { remindOn: '2020-01-01' });

    const res = await request(app).get('/api/reminders/due').set('Authorization', auth);

    expect(res.body.data).toEqual([]);
  });

  it('becomes due once a log pushes the odometer past the target', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id, { currentKm: 59000 });
    await reminder(car.id, { remindAtKm: 60000 });

    const before = await request(app).get('/api/reminders/due').set('Authorization', auth);
    await request(app)
      .post(`/api/cars/${car.id}/logs`)
      .set('Authorization', auth)
      .send({ title: 'Trip', odometerAtService: 60500, performedAt: today });
    const after = await request(app).get('/api/reminders/due').set('Authorization', auth);

    expect(before.body.data).toEqual([]);
    expect(after.body.data).toHaveLength(1);
    expect(after.body.data[0].dueBy).toBe('km');
  });
});
