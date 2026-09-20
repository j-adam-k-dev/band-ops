import 'dotenv/config';
import Fastify from 'fastify';
import mongoose from 'mongoose';
import { connectMongo } from './db.js';
import { registerErrorHandler } from './lib/errorHandler.js';
import songNoteRoutes from './routes/songNotes.js';
import rigConfigRoutes from './routes/rigConfigs.js';
import gigChecklistRoutes from './routes/gigChecklists.js';

const app = Fastify({ logger: true });

// Maps ZodError / Mongoose errors -> 400/404/409 for every route.
registerErrorHandler(app);

app.get('/health', async () => {
  const state = mongoose.connection.readyState; // 1 = connected
  return { status: state === 1 ? 'ok' : 'error', db: state === 1 ? 'connected' : 'unreachable' };
});

// Full CRUD for every Mongo collection (M3). One plugin per collection.
app.register(songNoteRoutes);
app.register(rigConfigRoutes);
app.register(gigChecklistRoutes);

const port = process.env.PORT ? Number(process.env.PORT) : 3002;

async function start() {
  try {
    await connectMongo();
    app.log.info('connected to MongoDB');
  } catch (err) {
    app.log.error(err, 'failed to connect to MongoDB on startup — /health will report it');
  }

  try {
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`notes-api listening on ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
