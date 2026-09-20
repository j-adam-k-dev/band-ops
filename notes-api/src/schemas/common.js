import { z } from 'zod';

// A document's own _id is a 24-char hex Mongo ObjectId. (Cross-service refs like
// songId/gigId are core-api UUIDs and are validated as z.uuid() per collection.)
export const objectIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'must be a valid Mongo ObjectId'),
});
