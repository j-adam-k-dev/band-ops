import 'dotenv/config';
import Fastify from 'fastify';
import mongoose from 'mongoose';
import { connectMongo } from './db.js';
import { SongNote } from './models/SongNote.js';
import { RigConfig } from './models/RigConfig.js';
import { GigChecklist } from './models/GigChecklist.js';

const app = Fastify({ logger: true });

app.get('/health', async () => {
  const state = mongoose.connection.readyState; // 1 = connected
  return { status: state === 1 ? 'ok' : 'error', db: state === 1 ? 'connected' : 'unreachable' };
});

// Minimal working example for M1 — full CRUD across all three collections is Session 3 (M3).
app.get('/song-notes', async (request) => {
  const { songId } = request.query;
  const filter = songId ? { songId } : {};
  return SongNote.find(filter).lean();
});

app.post('/song-notes', async (request, reply) => {
  const { songId, bandId } = request.body ?? {};
  if (!songId || !bandId) {
    reply.code(400);
    return { error: 'songId and bandId are required' };
  }
  const note = await SongNote.create(request.body);
  reply.code(201);
  return note;
});

app.get('/rig-configs', async (request) => {
  const { memberId } = request.query;
  const filter = memberId ? { memberId } : {};
  return RigConfig.find(filter).lean();
});

app.get('/gig-checklists', async (request) => {
  const { gigId } = request.query;
  const filter = gigId ? { gigId } : {};
  return GigChecklist.find(filter).lean();
});

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
