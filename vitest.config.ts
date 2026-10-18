import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Tests always run against the test database from .env.test.
    env: parseEnv(readFileSync('.env.test', 'utf8')) as Record<string, string>,
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.ts'],
    // One shared database, so test files must not run at the same time.
    fileParallelism: false,
  },
});
