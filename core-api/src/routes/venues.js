import { prisma } from '../db.js';
import { idParamSchema } from '../schemas/common.js';
import { createVenueSchema, updateVenueSchema } from '../schemas/venue.js';

export default async function venueRoutes(app) {
  app.get('/venues', async () => {
    return prisma.venue.findMany({ orderBy: { name: 'asc' } });
  });

  app.get('/venues/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return prisma.venue.findUniqueOrThrow({
      where: { id },
      include: { gigs: true },
    });
  });

  app.post('/venues', async (request, reply) => {
    const data = createVenueSchema.parse(request.body);
    const venue = await prisma.venue.create({ data });
    return reply.code(201).send(venue);
  });

  app.patch('/venues/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const data = updateVenueSchema.parse(request.body);
    return prisma.venue.update({ where: { id }, data });
  });

  app.delete('/venues/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await prisma.venue.delete({ where: { id } });
    return reply.code(204).send();
  });
}
