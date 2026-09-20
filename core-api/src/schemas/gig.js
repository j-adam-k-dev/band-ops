import { z } from 'zod';

// `z.coerce.date()` accepts ISO 8601 strings (or epoch numbers) and turns them
// into JS Date objects Prisma can persist to Postgres timestamp columns.
export const createGigSchema = z.object({
  venueId: z.uuid(),
  date: z.coerce.date(),
  loadInTime: z.coerce.date().nullish(),
  status: z.enum(['planned', 'confirmed', 'cancelled', 'completed']).optional(),
});

export const updateGigSchema = createGigSchema.partial();

// GET /gigs?venueId=...&status=...
export const gigQuerySchema = z.object({
  venueId: z.uuid().optional(),
  status: z.enum(['planned', 'confirmed', 'cancelled', 'completed']).optional(),
});
