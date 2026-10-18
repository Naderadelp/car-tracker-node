import { afterAll, beforeEach } from 'vitest';
import { env } from '../src/config/env.ts';
import { prisma } from '../src/lib/prisma.ts';

// Safety net: never wipe a database that isn't the test one.
if (!env.DATABASE_URL.includes('_test')) {
  throw new Error(`Refusing to run tests against ${env.DATABASE_URL}`);
}

// Like Laravel's RefreshDatabase: every test starts with empty tables.
beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE reminders, car_logs, cars, users RESTART IDENTITY CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
