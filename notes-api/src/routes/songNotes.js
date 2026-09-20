import { SongNote } from '../models/SongNote.js';
import { assertFound } from '../lib/http.js';
import { objectIdParamSchema } from '../schemas/common.js';
import {
  createSongNoteSchema,
  updateSongNoteSchema,
  songNoteQuerySchema,
} from '../schemas/songNote.js';

export default async function songNoteRoutes(app) {
  app.get('/song-notes', async (request) => {
    const filter = songNoteQuerySchema.parse(request.query);
    return SongNote.find(filter).sort({ createdAt: -1 }).lean();
  });

  app.get('/song-notes/:id', async (request) => {
    const { id } = objectIdParamSchema.parse(request.params);
    return assertFound(await SongNote.findById(id).lean(), 'SongNote');
  });

  app.post('/song-notes', async (request, reply) => {
    const data = createSongNoteSchema.parse(request.body);
    const note = await SongNote.create(data);
    return reply.code(201).send(note);
  });

  app.patch('/song-notes/:id', async (request) => {
    const { id } = objectIdParamSchema.parse(request.params);
    const data = updateSongNoteSchema.parse(request.body);
    return assertFound(
      await SongNote.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      }).lean(),
      'SongNote',
    );
  });

  app.delete('/song-notes/:id', async (request, reply) => {
    const { id } = objectIdParamSchema.parse(request.params);
    assertFound(await SongNote.findByIdAndDelete(id).lean(), 'SongNote');
    return reply.code(204).send();
  });
}
