import { z } from 'zod';

export const createBandSchema = z.object({
  name: z.string().min(1, 'name is required').max(200),
});

// PATCH: every field optional. `.strict()` isn't used so unknown keys are
// silently dropped rather than rejected — lenient by design for this demo API.
export const updateBandSchema = createBandSchema.partial();
