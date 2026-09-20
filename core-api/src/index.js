import 'dotenv/config';
import Fastify from 'fastify';
import { prisma } from './db.js';
import { registerErrorHandler } from './lib/errorHandler.js';
import bandRoutes from './routes/bands.js';
import memberRoutes from './routes/members.js';
import venueRoutes from './routes/venues.js';
import songRoutes from './routes/songs.js';
import gigRoutes from './routes/gigs.js';
import setlistRoutes from './routes/setlists.js';

const app = Fastify({ logger: true });

// Maps ZodError -> 400 and Prisma P20xx codes -> 404/409 for every route.
registerErrorHandler(app);

// Health check: confirms the process is up AND that it can actually reach Postgres,
// which is the thing docker-compose's healthcheck polls before other services depend on it.
app.get('/health', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', db: 'connected' };
  } catch (err) {
    app.log.error(err, 'database health check failed');
    return { status: 'error', db: 'unreachable' };
  }
});

// Full CRUD for every Postgres entity (M2). Each plugin owns one resource.
app.register(bandRoutes);
app.register(memberRoutes);
app.register(venueRoutes);
app.register(songRoutes);
app.register(gigRoutes);
app.register(setlistRoutes);

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app
  .listen({ port, host: '0.0.0.0' })
  .then(() => app.log.info(`core-api listening on ${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
