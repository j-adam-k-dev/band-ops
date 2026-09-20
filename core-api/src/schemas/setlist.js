import { z } from 'zod';

// A single ordered entry in the setlist ↔ song join table.
const setlistSongInput = z.object({
  songId: z.uuid(),
  position: z.number().int().nonnegative(),
});

// Reject a payload that lists the same song twice — the join table's composite
// PK (setlistId, songId) would reject the duplicate at the DB level anyway, but
// catching it here yields a clean 400 instead of a 409 mid-transaction.
const uniqueSongs = (songs) =>
  new Set(songs.map((s) => s.songId)).size === songs.length;

export const createSetlistSchema = z.object({
  gigId: z.uuid(),
  name: z.string().min(1, 'name is required').max(200),
  songs: z
    .array(setlistSongInput)
    .refine(uniqueSongs, 'a song may only appear once in a setlist')
    .optional(),
});

// gigId is intentionally not updatable — a setlist is 1:1 with its gig.
export const updateSetlistSchema = z.object({
  name: z.string().min(1).max(200).optional(),
});

// PUT /setlists/:id/songs — replace the whole ordered list atomically.
export const replaceSetlistSongsSchema = z.object({
  songs: z
    .array(setlistSongInput)
    .refine(uniqueSongs, 'a song may only appear once in a setlist'),
});

// POST /setlists/:id/songs — add a single song.
export const addSetlistSongSchema = setlistSongInput;

// DELETE /setlists/:id/songs/:songId
export const setlistSongParamSchema = z.object({
  id: z.uuid('must be a valid UUID'),
  songId: z.uuid('must be a valid UUID'),
});
