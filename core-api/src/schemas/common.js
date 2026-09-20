import { z } from 'zod';

// Shared param/query schema fragments reused across entity route files.
export const idParamSchema = z.object({
  id: z.uuid('must be a valid UUID'),
});
