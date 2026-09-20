import { z } from 'zod';

export const createRigConfigSchema = z.object({
  memberId: z.uuid(), // core-api Member.id
  instrument: z.string().min(1, 'instrument is required').max(100),
  gearList: z.array(z.string().max(200)).optional(),
  signalChain: z.array(z.string().max(200)).optional(),
});

export const updateRigConfigSchema = createRigConfigSchema.partial();

export const rigConfigQuerySchema = z.object({
  memberId: z.uuid().optional(),
});
