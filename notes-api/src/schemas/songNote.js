import { z } from 'zod';

// songId / bandId are core-api Postgres UUIDs stored as plain strings — no FK is
// enforced across databases, but validating the format keeps the ref honest.
export const createSongNoteSchema = z.object({
  songId: z.uuid(),
  bandId: z.uuid(),
  tempoNotes: z.string().max(2000).nullish(),
  pluginChain: z.array(z.string().max(200)).optional(),
  drumMapNotes: z.string().max(2000).nullish(),
  freeformText: z.string().max(5000).nullish(),
});

export const updateSongNoteSchema = createSongNoteSchema.partial();

export const songNoteQuerySchema = z.object({
  songId: z.uuid().optional(),
  bandId: z.uuid().optional(),
});
