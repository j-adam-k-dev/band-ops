import { z } from 'zod';

const checklistItemSchema = z.object({
  label: z.string().min(1, 'label is required').max(300),
  done: z.boolean().optional(), // defaults to false in the model
});

export const createGigChecklistSchema = z.object({
  gigId: z.uuid(), // core-api Gig.id
  venueType: z.enum(['indoor', 'outdoor']),
  items: z.array(checklistItemSchema).optional(),
  notes: z.string().max(5000).nullish(),
});

// On PATCH, providing `items` replaces the whole embedded array.
export const updateGigChecklistSchema = createGigChecklistSchema.partial();

export const gigChecklistQuerySchema = z.object({
  gigId: z.uuid().optional(),
});
