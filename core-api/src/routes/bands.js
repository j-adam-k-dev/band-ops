import { prisma } from '../db.js';
import { idParamSchema } from '../schemas/common.js';
import { createBandSchema, updateBandSchema } from '../schemas/band.js';

// CRUD for bands. `findUniqueOrThrow` / `update` / `delete` throw Prisma P2025
// when the id doesn't exist, which the shared error handler turns into a 404.
export default async function bandRoutes(app) {
  app.get('/bands', async () => {
    return prisma.band.findMany({
      include: { members: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  app.get('/bands/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return prisma.band.findUniqueOrThrow({
      where: { id },
      include: { members: true },
    });
  });

  app.post('/bands', async (request, reply) => {
    const data = createBandSchema.parse(request.body);
    const band = await prisma.band.create({ data });
    return reply.code(201).send(band);
  });

  app.patch('/bands/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const data = updateBandSchema.parse(request.body);
    return prisma.band.update({ where: { id }, data });
  });

  app.delete('/bands/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await prisma.band.delete({ where: { id } });
    return reply.code(204).send();
  });
}
