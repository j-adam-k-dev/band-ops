import { ZodError } from 'zod';

// Centralized error handling so individual route handlers stay thin: they just
// `schema.parse(...)` (throwing ZodError on bad input) and let Prisma throw on
// missing/constraint-violating rows. Everything funnels through here and gets
// mapped to a sensible HTTP status + a consistent JSON error shape.
//
// Prisma errors are matched by their string `code` (P20xx) rather than by
// importing the error class from the generated client — that keeps this module
// decoupled from the generated output path.
export function registerErrorHandler(app) {
  app.setErrorHandler((err, request, reply) => {
    // Input validation failures.
    if (err instanceof ZodError) {
      return reply.code(400).send({
        error: 'ValidationError',
        details: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    // Known Prisma request errors.
    switch (err.code) {
      case 'P2025': // Record to update/delete/read does not exist.
        return reply.code(404).send({
          error: 'NotFound',
          message: 'Record not found',
        });
      case 'P2002': // Unique constraint violation.
        return reply.code(409).send({
          error: 'Conflict',
          message: 'A record with these values already exists',
          target: err.meta?.target,
        });
      case 'P2003': // Foreign key constraint violation.
        return reply.code(409).send({
          error: 'Conflict',
          message:
            'Foreign key constraint failed — the referenced record is missing or still in use',
        });
      default:
        break;
    }

    // Fastify's own errors (e.g. malformed JSON body) carry a 4xx statusCode.
    const status = typeof err.statusCode === 'number' ? err.statusCode : 500;
    if (status >= 500) {
      request.log.error(err);
      return reply.code(500).send({
        error: 'InternalServerError',
        message: 'An unexpected error occurred',
      });
    }
    return reply.code(status).send({
      error: err.name ?? 'BadRequest',
      message: err.message,
    });
  });
}
