import 'dotenv/config';
import Fastify from 'fastify';
import { prisma } from './db.js';

const app = Fastify({ logger: true });

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

// Minimal working example for M1 — full CRUD across all entities is Session 2 (M2).
app.get('/bands', async () => {
  return prisma.band.findMany({ include: { members: true } });
});

app.post('/bands', async (request, reply) => {
  const { name } = request.body ?? {};
  if (!name || typeof name !== 'string') {
    reply.code(400);
    return { error: 'name is required' };
  }
  const band = await prisma.band.create({ data: { name } });
  reply.code(201);
  return band;
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app
  .listen({ port, host: '0.0.0.0' })
  .then(() => app.log.info(`core-api listening on ${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
