import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCar, createUser } from '../../../tests/helpers.ts';
import { app } from '../../app.ts';

describe('cars', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/cars');

    expect(res.status).toBe(401);
  });

  it('creates a car for the current user, ignoring a userId in the body', async () => {
    const { user, auth } = await createUser();
    const other = await createUser();

    const res = await request(app)
      .post('/api/cars')
      .set('Authorization', auth)
      .send({
        make: 'Toyota',
        model: 'Corolla',
        color: 'White',
        currentKm: 42000,
        tankSize: 50.5,
        purchasedAt: '2022-03-15',
        userId: other.user.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      userId: user.id,
      make: 'Toyota',
      model: 'Corolla',
      color: 'White',
      currentKm: 42000,
      tankSize: '50.5',
      purchasedAt: '2022-03-15T00:00:00.000Z',
    });
  });

  it('defaults currentKm to 0', async () => {
    const { auth } = await createUser();

    const res = await request(app).post('/api/cars').set('Authorization', auth).send({ make: 'Kia', model: 'Rio' });

    expect(res.status).toBe(201);
    expect(res.body.data.currentKm).toBe(0);
  });

  it('rejects an invalid car with 422', async () => {
    const { auth } = await createUser();

    const res = await request(app)
      .post('/api/cars')
      .set('Authorization', auth)
      .send({ make: '', currentKm: -5, purchasedAt: '2022-13-45' });

    expect(res.status).toBe(422);
    expect(Object.keys(res.body.error.details.fieldErrors).sort()).toEqual([
      'currentKm',
      'make',
      'model',
      'purchasedAt',
    ]);
  });

  it('lists only my cars, paginated', async () => {
    const { user, auth } = await createUser();
    const other = await createUser();
    for (let i = 0; i < 3; i++) await createCar(user.id);
    await createCar(other.user.id);

    const res = await request(app).get('/api/cars?page=2&perPage=2').set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ page: 2, perPage: 2, total: 3 });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].userId).toBe(user.id);
  });

  it('rejects perPage over 100 and page 0 with 422', async () => {
    const { auth } = await createUser();

    const tooBig = await request(app).get('/api/cars?perPage=101').set('Authorization', auth);
    const zero = await request(app).get('/api/cars?page=0').set('Authorization', auth);

    expect(tooBig.status).toBe(422);
    expect(zero.status).toBe(422);
  });

  it('shows, updates and deletes my car', async () => {
    const { user, auth } = await createUser();
    const car = await createCar(user.id, { currentKm: 1000 });

    const shown = await request(app).get(`/api/cars/${car.id}`).set('Authorization', auth);
    expect(shown.status).toBe(200);
    expect(shown.body.data.id).toBe(car.id);

    const updated = await request(app)
      .patch(`/api/cars/${car.id}`)
      .set('Authorization', auth)
      .send({ color: 'Red' });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ color: 'Red', currentKm: 1000, make: 'Toyota' });

    const deleted = await request(app).delete(`/api/cars/${car.id}`).set('Authorization', auth);
    expect(deleted.status).toBe(204);

    const gone = await request(app).get(`/api/cars/${car.id}`).set('Authorization', auth);
    expect(gone.status).toBe(404);
  });

  it("returns 404 for someone else's car on show, update and delete", async () => {
    const { auth } = await createUser();
    const other = await createUser();
    const theirCar = await createCar(other.user.id);

    const show = await request(app).get(`/api/cars/${theirCar.id}`).set('Authorization', auth);
    const update = await request(app)
      .patch(`/api/cars/${theirCar.id}`)
      .set('Authorization', auth)
      .send({ color: 'Red' });
    const destroy = await request(app).delete(`/api/cars/${theirCar.id}`).set('Authorization', auth);

    expect([show.status, update.status, destroy.status]).toEqual([404, 404, 404]);
    // The ownership check's 404, not the "no such route" 404.
    expect(show.body.error.message).toBe('Car not found');
  });

  it('returns 422 for a non-numeric car id', async () => {
    const { auth } = await createUser();

    const res = await request(app).get('/api/cars/abc').set('Authorization', auth);

    expect(res.status).toBe(422);
  });
});
