import mongoose from 'mongoose';

// One song's rig/plugin setup looks nothing like another's — that variability
// is exactly what earns this collection a document store instead of a Postgres table.
const songNoteSchema = new mongoose.Schema(
  {
    songId: { type: String, required: true, index: true }, // references core-api's Song.id
    bandId: { type: String, required: true, index: true }, // references core-api's Band.id
    tempoNotes: { type: String },
    pluginChain: [{ type: String }],
    drumMapNotes: { type: String },
    freeformText: { type: String },
  },
  { timestamps: true }
);

export const SongNote = mongoose.model('SongNote', songNoteSchema, 'song_notes');
