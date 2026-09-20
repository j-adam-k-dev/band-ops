// Mongoose returns null for a missing document rather than throwing (unlike
// Prisma's *OrThrow variants), so wrap reads in this to get a consistent 404.
export function assertFound(doc, resource = 'Record') {
  if (!doc) {
    const err = new Error(`${resource} not found`);
    err.statusCode = 404;
    throw err;
  }
  return doc;
}
