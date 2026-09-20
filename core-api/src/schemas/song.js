import { z } from 'zod';

export const createSongSchema = z.object({
  title: z.string().min(1, 'title is required').max(300),
  durationSec: z.number().int().positive().nullish(),
  musicalKey: z.string().max(20).nullish(),
  tempoBpm: z.number().int().positive().max(400).nullish(),
});

export const updateSongSchema = createSongSchema.partial();
