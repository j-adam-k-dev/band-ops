import { z } from 'zod';

export const createMemberSchema = z.object({
  bandId: z.uuid(),
  name: z.string().min(1, 'name is required').max(200),
  role: z.string().max(200).nullish(),
});

export const updateMemberSchema = createMemberSchema.partial();

// GET /members?bandId=... — optional filter.
export const memberQuerySchema = z.object({
  bandId: z.uuid().optional(),
});
