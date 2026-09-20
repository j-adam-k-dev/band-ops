import { prisma } from '../db.js';
import { idParamSchema } from '../schemas/common.js';
import {
  createGigSchema,
  updateGigSchema,
  gigQuerySchema,
} from '../schemas/gig.js';

// Include the venue plus the setlist (with its ordered songs) so a single GET
// gives the client everything needed to render a gig page.
const gigInclude = {
  venue: true,
  setlist: {
    include: {
      songs: { include: { song: true }, orderBy: { position: 'asc' } },
    },
  },
};

export default async function gigRoutes(app) {
  app.get('/gigs', async (request) => {
    const { venueId, status } = gigQuerySchema.parse(request.query);
    return prisma.gig.findMany({
      where: { ...(venueId && { venueId }), ...(status && { status }) },
      include: gigInclude,
      orderBy: { date: 'asc' },
    });
  });

  app.get('/gigs/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return prisma.gig.findUniqueOrThrow({ where: { id }, include: gigInclude });
  });

  app.post('/gigs', async (request, reply) => {
    const data = createGigSchema.parse(request.body);
    const gig = await prisma.gig.create({ data, include: gigInclude });
    return reply.code(201).send(gig);
  });

  app.patch('/gigs/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const data = updateGigSchema.parse(request.body);
    return prisma.gig.update({ where: { id }, data, include: gigInclude });
  });

  app.delete('/gigs/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await prisma.gig.delete({ where: { id } });
    return reply.code(204).send();
  });
}
