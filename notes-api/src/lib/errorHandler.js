import { ZodError } from 'zod';

// Centralized error handling, mirroring core-api's. Handlers stay thin: they
// `schema.parse(...)` (throwing ZodError on bad input) and use `assertFound`
// (throwing a 404) for missing docs. Mongoose's own errors are mapped here too.
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

    // Mongoose: a value couldn't be cast (e.g. a malformed ObjectId that slipped
    // past param validation, or a bad type in a query).
    if (err.name === 'CastError') {
      return reply.code(400).send({
        error: 'BadRequest',
        message: `Invalid value for '${err.path}'`,
      });
    }

    // Mongoose schema validation — a backstop behind Zod (runValidators on update).
    if (err.name === 'ValidationError' && err.errors) {
      return reply.code(400).send({
        error: 'ValidationError',
        details: Object.values(err.errors).map((e) => ({
          path: e.path,
          message: e.message,
        })),
      });
    }

    // MongoDB duplicate key.
    if (err.code === 11000) {
      return reply.code(409).send({
        error: 'Conflict',
        message: 'A record with these values already exists',
        keyValue: err.keyValue,
      });
    }

    // Explicit statuses thrown by handlers (e.g. assertFound -> 404).
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
