import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 moved the connection URL out of schema.prisma and into this config file —
// used by the CLI (generate, migrate, db push). The running app still passes its own
// connection string to the driver adapter separately (see src/db.js).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
