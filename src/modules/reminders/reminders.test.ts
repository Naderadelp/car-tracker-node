import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCar, createUser } from '../../../tests/helpers.ts';
import { app } from '../../app.ts';

describe('reminders CRUD', () => {
  it('creates a date reminder and a km reminder', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id);

    const byDate = await request(app)
      .post(`/api/cars/${car.id}/reminders`)
      .set('Authorization', auth)
      .send({ title: 'Renew licence', remindOn: '2027-01-01' });
    const byKm = await request(app)
      .post(`/api/cars/${car.id}/reminders`)
      .set('Authorization', auth)
      .send({ title: 'Timing belt', remindAtKm: 100000 });

    expect(byDate.status).toBe(201);
    expect(byDate.body.data).toMatchObject({ carId: car.id, remindOn: '2027-01-01T00:00:00.000Z', remindAtKm: null });
    expect(byKm.status).toBe(201);
    expect(byKm.body.data).toMatchObject({ remindOn: null, remindAtKm: 100000 });
  });

  it('rejects a reminder with neither remindOn nor remindAtKm', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id);

    const res = await request(app)
      .post(`/api/cars/${car.id}/reminders`)
      .set('Authorization', auth)
      .send({ title: 'Nothing to trigger on' });

    expect(res.status).toBe(422);
    expect(res.body.error.details.fieldErrors.remindOn).toEqual(['Provide remindOn, remindAtKm, or both']);
  });

  it('rejects a PATCH that would leave neither remindOn nor remindAtKm', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id);
    const created = await request(app)
      .post(`/api/cars/${car.id}/reminders`)
      .set('Authorization', auth)
      .send({ title: 'Timing belt', remindAtKm: 100000 });

    const res = await request(app)
      .patch(`/api/cars/${car.id}/reminders/${created.body.data.id}`)
      .set('Authorization', auth)
      .send({ remindAtKm: null });

    expect(res.status).toBe(422);
  });

  it('lists, shows, updates and deletes', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id);
    const created = await request(app)
      .post(`/api/cars/${car.id}/reminders`)
      .set('Authorization', auth)
      .send({ title: 'Timing belt', remindAtKm: 100000 });
    const url = `/api/cars/${car.id}/reminders/${created.body.data.id}`;

    const list = await request(app).get(`/api/cars/${car.id}/reminders`).set('Authorization', auth);
    expect(list.status).toBe(200);
    expect(list.body.meta.total).toBe(1);

    const shown = await request(app).get(url).set('Authorization', auth);
    expect(shown.body.data.title).toBe('Timing belt');

    const updated = await request(app)
      .patch(url)
      .set('Authorization', auth)
      .send({ remindOn: '2027-05-01', notifiedAt: '2026-10-18T09:00:00Z' });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({
      remindAtKm: 100000,
      remindOn: '2027-05-01T00:00:00.000Z',
      notifiedAt: '2026-10-18T09:00:00.000Z',
    });

    const deleted = await request(app).delete(url).set('Authorization', auth);
    expect(deleted.status).toBe(204);
  });

  it("returns 404 for reminders under someone else's car", async () => {
    const { auth } = await createUser();
    const other = await createUser();
    const theirCar = await createCar(other.user.id);

    const res = await request(app).get(`/api/cars/${theirCar.id}/reminders`).set('Authorization', auth);

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Car not found');
  });
});
