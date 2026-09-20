import { z } from 'zod';

export const createVenueSchema = z.object({
  name: z.string().min(1, 'name is required').max(200),
  address: z.string().max(500).nullish(),
  isOutdoor: z.boolean().optional(), // defaults to false in the DB when omitted
  contact: z.string().max(200).nullish(),
});

export const updateVenueSchema = createVenueSchema.partial();
