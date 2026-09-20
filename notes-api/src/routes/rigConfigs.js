import { RigConfig } from '../models/RigConfig.js';
import { assertFound } from '../lib/http.js';
import { objectIdParamSchema } from '../schemas/common.js';
import {
  createRigConfigSchema,
  updateRigConfigSchema,
  rigConfigQuerySchema,
} from '../schemas/rigConfig.js';

export default async function rigConfigRoutes(app) {
  app.get('/rig-configs', async (request) => {
    const filter = rigConfigQuerySchema.parse(request.query);
    return RigConfig.find(filter).sort({ createdAt: -1 }).lean();
  });

  app.get('/rig-configs/:id', async (request) => {
    const { id } = objectIdParamSchema.parse(request.params);
    return assertFound(await RigConfig.findById(id).lean(), 'RigConfig');
  });

  app.post('/rig-configs', async (request, reply) => {
    const data = createRigConfigSchema.parse(request.body);
    const config = await RigConfig.create(data);
    return reply.code(201).send(config);
  });

  app.patch('/rig-configs/:id', async (request) => {
    const { id } = objectIdParamSchema.parse(request.params);
    const data = updateRigConfigSchema.parse(request.body);
    return assertFound(
      await RigConfig.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      }).lean(),
      'RigConfig',
    );
  });

  app.delete('/rig-configs/:id', async (request, reply) => {
    const { id } = objectIdParamSchema.parse(request.params);
    assertFound(await RigConfig.findByIdAndDelete(id).lean(), 'RigConfig');
    return reply.code(204).send();
  });
}
