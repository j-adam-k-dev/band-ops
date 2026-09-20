import { prisma } from '../db.js';
import { idParamSchema } from '../schemas/common.js';
import {
  createMemberSchema,
  updateMemberSchema,
  memberQuerySchema,
} from '../schemas/member.js';

export default async function memberRoutes(app) {
  app.get('/members', async (request) => {
    const { bandId } = memberQuerySchema.parse(request.query);
    return prisma.member.findMany({
      where: bandId ? { bandId } : undefined,
      include: { band: true },
    });
  });

  app.get('/members/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    return prisma.member.findUniqueOrThrow({
      where: { id },
      include: { band: true },
    });
  });

  app.post('/members', async (request, reply) => {
    const data = createMemberSchema.parse(request.body);
    // A bad bandId surfaces as Prisma P2003 (FK) -> 409 via the error handler.
    const member = await prisma.member.create({ data });
    return reply.code(201).send(member);
  });

  app.patch('/members/:id', async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const data = updateMemberSchema.parse(request.body);
    return prisma.member.update({ where: { id }, data });
  });

  app.delete('/members/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    await prisma.member.delete({ where: { id } });
    return reply.code(204).send();
  });
}
