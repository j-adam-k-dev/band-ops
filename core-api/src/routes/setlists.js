import { prisma } from '../db.js';
import { idParamSchema } from '../schemas/common.js';
import {
  createSetlistSchema,
  updateSetlistSchema,
  replaceSetlistSongsSchema,
  addSetlistSongSchema,
  setlistSongParamSchema,
} from '../schemas/setlist.js';

// Always return a setlist with its songs resolved and ordered by position.
const setlistInclude = {
  songs: { include: { song: true }, orderBy: { position: 'asc' } },
};

export default async function setlistRoutes(app) {
  app.get('/setlists', async () => {
    return prisma.setlist.findMany({ include: setlistInclude });
  });

  app.get('/setlists/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return prisma.setlist.findUniqueOrThrow({
      where: { id },
      include: setlistInclude,
    });
  });

  // Create a setlist, optionally seeding its ordered songs in the same insert.
  app.post('/setlists', async (request, reply) => {
    const { gigId, name, songs } = createSetlistSchema.parse(request.body);
    const setlist = await prisma.setlist.create({
      data: {
        gigId,
        name,
        songs: songs?.length
          ? { create: songs.map((s) => ({ songId: s.songId, position: s.position })) }
          : undefined,
      },
      include: setlistInclude,
    });
    return reply.code(201).send(setlist);
  });

  app.patch('/setlists/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const data = updateSetlistSchema.parse(request.body);
    return prisma.setlist.update({
      where: { id },
      data,
      include: setlistInclude,
    });
  });

  // Delete the setlist and its join rows together — no ON DELETE CASCADE in the
  // schema, so the children must go first, atomically.
  app.delete('/setlists/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await prisma.setlist.findUniqueOrThrow({ where: { id } }); // 404 if missing
    await prisma.$transaction([
      prisma.setlistSong.deleteMany({ where: { setlistId: id } }),
      prisma.setlist.delete({ where: { id } }),
    ]);
    return reply.code(204).send();
  });

  // Replace the entire ordered song list in one transaction.
  app.put('/setlists/:id/songs', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const { songs } = replaceSetlistSongsSchema.parse(request.body);
    await prisma.setlist.findUniqueOrThrow({ where: { id } });
    await prisma.$transaction([
      prisma.setlistSong.deleteMany({ where: { setlistId: id } }),
      prisma.setlistSong.createMany({
        data: songs.map((s) => ({
          setlistId: id,
          songId: s.songId,
          position: s.position,
        })),
      }),
    ]);
    return prisma.setlist.findUniqueOrThrow({
      where: { id },
      include: setlistInclude,
    });
  });

  // Add a single song to a setlist.
  app.post('/setlists/:id/songs', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const { songId, position } = addSetlistSongSchema.parse(request.body);
    await prisma.setlist.findUniqueOrThrow({ where: { id } });
    await prisma.setlistSong.create({
      data: { setlistId: id, songId, position },
    });
    const setlist = await prisma.setlist.findUniqueOrThrow({
      where: { id },
      include: setlistInclude,
    });
    return reply.code(201).send(setlist);
  });

  // Remove a single song from a setlist.
  app.delete('/setlists/:id/songs/:songId', async (request, reply) => {
    const { id, songId } = setlistSongParamSchema.parse(request.params);
    await prisma.setlistSong.delete({
      where: { setlistId_songId: { setlistId: id, songId } },
    });
    return reply.code(204).send();
  });
}
