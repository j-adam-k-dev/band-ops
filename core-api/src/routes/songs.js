import { prisma } from '../db.js';
import { idParamSchema } from '../schemas/common.js';
import { createSongSchema, updateSongSchema } from '../schemas/song.js';

export default async function songRoutes(app) {
  app.get('/songs', async () => {
    return prisma.song.findMany({ orderBy: { title: 'asc' } });
  });

  app.get('/songs/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return prisma.song.findUniqueOrThrow({ where: { id } });
  });

  app.post('/songs', async (request, reply) => {
    const data = createSongSchema.parse(request.body);
    const song = await prisma.song.create({ data });
    return reply.code(201).send(song);
  });

  app.patch('/songs/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const data = updateSongSchema.parse(request.body);
    return prisma.song.update({ where: { id }, data });
  });

  app.delete('/songs/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await prisma.song.delete({ where: { id } });
    return reply.code(204).send();
  });
}
