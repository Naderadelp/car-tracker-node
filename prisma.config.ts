import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// The Prisma CLI doesn't read .env by itself. Load .env, or .env.test when NODE_ENV=test,
// so `prisma migrate` talks to the right database.
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
if (existsSync(envFile)) process.loadEnvFile(envFile);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL },
});
