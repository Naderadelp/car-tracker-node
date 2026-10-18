import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCar, createUser } from '../../../tests/helpers.ts';
import { app } from '../../app.ts';
import { prisma } from '../../lib/prisma.ts';

const validLog = {
  title: 'Oil change',
  category: 'maintenance',
  odometerAtService: 51000,
  actualCost: 850.25,
  performedAt: '2026-10-01',
};

async function carKm(carId: number) {
  const car = await prisma.car.findUniqueOrThrow({ where: { id: carId } });
  return car.currentKm;
}

describe('car logs', () => {
  it('creates a log and advances the car odometer when the reading is higher', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id, { currentKm: 50000 });

    const res = await request(app).post(`/api/cars/${car.id}/logs`).set('Authorization', auth).send(validLog);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ carId: car.id, title: 'Oil change', actualCost: '850.25' });
    expect(await carKm(car.id)).toBe(51000);
  });

  it('does not lower the odometer for an older, lower reading', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id, { currentKm: 60000 });

    const res = await request(app)
      .post(`/api/cars/${car.id}/logs`)
      .set('Authorization', auth)
      .send({ ...validLog, odometerAtService: 40000 });

    expect(res.status).toBe(201);
    expect(await carKm(car.id)).toBe(60000);
  });

  it('advances the odometer when a log is updated to a higher reading', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id, { currentKm: 50000 });
    const created = await request(app).post(`/api/cars/${car.id}/logs`).set('Authorization', auth).send(validLog);

    const res = await request(app)
      .patch(`/api/cars/${car.id}/logs/${created.body.data.id}`)
      .set('Authorization', auth)
      .send({ odometerAtService: 55000 });

    expect(res.status).toBe(200);
    expect(await carKm(car.id)).toBe(55000);
  });

  it('keeps the odometer when a log is deleted', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id, { currentKm: 50000 });
    const created = await request(app).post(`/api/cars/${car.id}/logs`).set('Authorization', auth).send(validLog);

    const res = await request(app).delete(`/api/cars/${car.id}/logs/${created.body.data.id}`).set('Authorization', auth);

    expect(res.status).toBe(204);
    expect(await carKm(car.id)).toBe(51000);
  });

  it('lists logs newest first with pagination meta, and shows one', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id);
    await request(app).post(`/api/cars/${car.id}/logs`).set('Authorization', auth).send({ ...validLog, performedAt: '2026-01-01' });
    const newest = await request(app).post(`/api/cars/${car.id}/logs`).set('Authorization', auth).send({ ...validLog, performedAt: '2026-06-01' });

    const list = await request(app).get(`/api/cars/${car.id}/logs`).set('Authorization', auth);
    const one = await request(app).get(`/api/cars/${car.id}/logs/${newest.body.data.id}`).set('Authorization', auth);

    expect(list.status).toBe(200);
    expect(list.body.meta).toEqual({ page: 1, perPage: 15, total: 2 });
    expect(list.body.data[0].id).toBe(newest.body.data.id);
    expect(one.status).toBe(200);
    expect(one.body.data.title).toBe('Oil change');
  });

  it("returns 404 for logs under someone else's car", async () => {
    const { auth } = await createUser();
    const other = await createUser();
    const theirCar = await createCar(other.user.id);

    const list = await request(app).get(`/api/cars/${theirCar.id}/logs`).set('Authorization', auth);
    const create = await request(app).post(`/api/cars/${theirCar.id}/logs`).set('Authorization', auth).send(validLog);

    expect([list.status, create.status]).toEqual([404, 404]);
    expect(list.body.error.message).toBe('Car not found');
  });

  it('returns 404 for a log id that belongs to a different car of mine', async () => {
    const { user, auth } = await createUser();
    const carA = await createCar(user.id);
    const carB = await createCar(user.id);
    const log = await request(app).post(`/api/cars/${carA.id}/logs`).set('Authorization', auth).send(validLog);

    const res = await request(app).get(`/api/cars/${carB.id}/logs/${log.body.data.id}`).set('Authorization', auth);

    expect(res.status).toBe(404);
  });

  it('returns 422, not 500, for an odometer reading too big for the database', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id);

    const res = await request(app)
      .post(`/api/cars/${car.id}/logs`)
      .set('Authorization', auth)
      .send({ ...validLog, odometerAtService: 3_000_000_000 });

    expect(res.status).toBe(422);
  });

  it('rejects a log without the required fields with 422', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id);

    const res = await request(app).post(`/api/cars/${car.id}/logs`).set('Authorization', auth).send({ notes: 'x' });

    expect(res.status).toBe(422);
    expect(Object.keys(res.body.error.details.fieldErrors).sort()).toEqual([
      'odometerAtService',
      'performedAt',
      'title',
    ]);
  });
});
