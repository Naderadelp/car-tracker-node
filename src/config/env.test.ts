import { describe, expect, it } from 'vitest';
import { envSchema } from './env.ts';

const valid = {
  DATABASE_URL: 'postgresql://app:app@localhost:5434/car_tracker',
  JWT_SECRET: 'x'.repeat(32),
};

describe('env', () => {
  it('accepts compact durations for JWT_EXPIRES_IN', () => {
    for (const value of ['7d', '12h', '30m', '3600']) {
      expect(envSchema.safeParse({ ...valid, JWT_EXPIRES_IN: value }).success).toBe(true);
    }
  });

  it('rejects a JWT_EXPIRES_IN that jsonwebtoken cannot read, at startup instead of on every login', () => {
    expect(envSchema.safeParse({ ...valid, JWT_EXPIRES_IN: '7days' }).success).toBe(false);
  });
});
