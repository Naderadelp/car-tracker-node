import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createUser } from '../../../tests/helpers.ts';
import { app } from '../../app.ts';
import { prisma } from '../../lib/prisma.ts';

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token without the password hash', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Nader', email: 'nader@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ name: 'Nader', email: 'nader@example.com' });
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(typeof res.body.data.token).toBe('string');
  });

  it('normalises the email to lower case', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Nader', email: '  Nader@Example.COM ', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('nader@example.com');
  });

  it('rejects a duplicate email with 409, even with different casing', async () => {
    await createUser({ email: 'taken@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other', email: 'TAKEN@example.com', password: 'password123' });

    expect(res.status).toBe(409);
  });

  it('rejects an invalid body with 422 and field errors', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(422);
    expect(Object.keys(res.body.error.details.fieldErrors).sort()).toEqual(['email', 'name', 'password']);
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token for the right password', async () => {
    await createUser({ email: 'nader@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'Nader@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('nader@example.com');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(typeof res.body.data.token).toBe('string');
  });

  it('returns the same 401 for a wrong password and an unknown email', async () => {
    await createUser({ email: 'nader@example.com', password: 'password123' });

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nader@example.com', password: 'wrong-password' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user', async () => {
    const { user, auth } = await createUser();

    const res = await request(app).get('/api/auth/me').set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: user.id, email: user.email });
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });

  it('returns 401 for a garbage token and for a non-Bearer scheme', async () => {
    const { token } = await createUser();

    const garbage = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.jwt');
    const basic = await request(app).get('/api/auth/me').set('Authorization', `Basic ${token}`);

    expect(garbage.status).toBe(401);
    expect(basic.status).toBe(401);
  });

  it('returns 401 when the token belongs to a deleted user', async () => {
    const { user, auth } = await createUser();
    await prisma.user.delete({ where: { id: user.id } });

    const res = await request(app).get('/api/auth/me').set('Authorization', auth);

    expect(res.status).toBe(401);
  });

  it('returns 401 for a token signed with a different secret', async () => {
    const { user } = await createUser();
    const forged = jwt.sign({}, 'some-other-secret-that-is-long-enough!!', { subject: String(user.id) });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);

    expect(res.status).toBe(401);
  });
});
