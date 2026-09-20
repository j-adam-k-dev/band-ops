import { GigChecklist } from '../models/GigChecklist.js';
import { assertFound } from '../lib/http.js';
import { objectIdParamSchema } from '../schemas/common.js';
import {
  createGigChecklistSchema,
  updateGigChecklistSchema,
  gigChecklistQuerySchema,
} from '../schemas/gigChecklist.js';

export default async function gigChecklistRoutes(app) {
  app.get('/gig-checklists', async (request) => {
    const filter = gigChecklistQuerySchema.parse(request.query);
    return GigChecklist.find(filter).sort({ createdAt: -1 }).lean();
  });

  app.get('/gig-checklists/:id', async (request) => {
    const { id } = objectIdParamSchema.parse(request.params);
    return assertFound(await GigChecklist.findById(id).lean(), 'GigChecklist');
  });

  app.post('/gig-checklists', async (request, reply) => {
    const data = createGigChecklistSchema.parse(request.body);
    const checklist = await GigChecklist.create(data);
    return reply.code(201).send(checklist);
  });

  app.patch('/gig-checklists/:id', async (request) => {
    const { id } = objectIdParamSchema.parse(request.params);
    const data = updateGigChecklistSchema.parse(request.body);
    return assertFound(
      await GigChecklist.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      }).lean(),
      'GigChecklist',
    );
  });

  app.delete('/gig-checklists/:id', async (request, reply) => {
    const { id } = objectIdParamSchema.parse(request.params);
    assertFound(await GigChecklist.findByIdAndDelete(id).lean(), 'GigChecklist');
    return reply.code(204).send();
  });
}
