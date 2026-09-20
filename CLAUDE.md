# Band Ops / Gig Manager — Project Memory

This file is context for Claude Code picking up this project. It's a portfolio project built to
demonstrate fluency in a Nuxt/Vue/MongoDB/Postgres microservices stack for a senior dev interview,
coming from an 11+ year .NET/SQL Server background. Full plan (architecture rationale, data model
reasoning, deployment plan, interview talking points) is in a Claude Docs doc — ask the user for the
link if it's not already in context.

## Architecture

Three independently deployable pieces. `web` is the only thing that calls both APIs; `core-api`
and `notes-api` don't talk to each other in v1 (deliberate simplification, documented as a
stretch-goal callout for the interview, not a gap).

- **web** — Nuxt 3 / Vue 3, port 3000. Minimal scaffold only so far — no pages built yet.
- **core-api** — Fastify + Prisma 7, port 3001. Owns Postgres: bands, members, venues, gigs,
  songs, setlists.
- **notes-api** — Fastify + Mongoose, port 3002. Owns MongoDB: song notes, rig/plugin configs,
  gig checklists.

## Current status: Session 3 (M3) complete

M1 (scaffold), M2 (full core-api CRUD), and M3 (full notes-api CRUD) are done. `docker compose up
--build` boots Postgres, MongoDB, `core-api`, and `notes-api`; both `/health` endpoints return
`{ "status": "ok", "db": "connected" }`. `web` runs separately via `npm run dev` (not in Compose —
see root README).

What exists right now:
- `core-api`: `/health` plus **full CRUD** for every Postgres entity — bands, members, venues,
  songs, gigs, setlists (incl. setlist song management via the `SetlistSong` join table). See the
  M2 layout note below.
- `notes-api`: `/health` plus **full CRUD** for all three Mongo collections — song-notes,
  rig-configs, gig-checklists. See the M3 layout note below.
- `web`: untouched Nuxt minimal template, no app code yet (Sessions 4–5).
- `core-api/scripts/seed.js` (`npm run seed` from `core-api/`): idempotent seed that POSTs a linked
  dataset into **both** APIs (band/members/venues/songs/gig/setlist in Postgres; song-note,
  rig-configs, gig-checklist in Mongo that reference the Postgres ids).

### core-api M2 layout (added Session 2)

Routes were pulled out of `index.js` into a conventional per-resource structure:
- `src/schemas/*.js` — Zod schemas (create + partial-update) per entity, plus shared `common.js`
  (`idParamSchema`). Validation is manual: handlers call `schema.parse(...)` and let `ZodError`
  propagate.
- `src/routes/*.js` — one Fastify plugin per resource, registered in `index.js`. Handlers stay thin
  (parse → Prisma call). Reads use `findUniqueOrThrow` so a missing id throws `P2025`.
- `src/lib/errorHandler.js` — single `setErrorHandler` maps `ZodError` → 400,
  Prisma `P2025` → 404, `P2002` → 409, `P2003` → 409; anything else → generic 500 (logged).
  Prisma errors are matched by string `code`, not by importing the generated error class.
- Verbs: `GET` (list + by-id), `POST` (201), `PATCH` (partial update), `DELETE` (204). Setlist
  song ops: `POST /setlists/:id/songs`, `PUT /setlists/:id/songs` (atomic replace-all via
  `$transaction`), `DELETE /setlists/:id/songs/:songId`.

Verification note: Docker wasn't available in the M2 session, so the stack wasn't booted against a
live DB there. Instead deps were installed locally, the Prisma client generated, and the server
booted against a dummy `DATABASE_URL` (the pg adapter connects lazily) to confirm route
registration, Zod validation, and the error handler end-to-end. Run `docker compose up --build`
for a full live-DB smoke test.

### notes-api M3 layout (added Session 3)

Same structure as core-api's M2, adapted for Mongoose:
- `src/schemas/*.js` — Zod schemas (create + partial-update + query) per collection, plus shared
  `common.js` (`objectIdParamSchema`: a doc's own `_id` is a 24-hex ObjectId; cross-service refs
  like `songId`/`gigId`/`memberId` are core-api UUIDs validated as `z.uuid()`).
- `src/routes/*.js` — one Fastify plugin per collection, registered in `index.js`.
- `src/lib/errorHandler.js` — maps `ZodError` → 400, Mongoose `CastError` → 400,
  Mongoose `ValidationError` → 400, Mongo duplicate key (11000) → 409, `err.statusCode` → that
  status, else 500.
- `src/lib/http.js` — `assertFound(doc, name)` throws a 404 when a query returns `null` (Mongoose
  doesn't throw for missing docs the way Prisma's `*OrThrow` does).
- Verbs: `GET` (list w/ optional query filter + by-id), `POST` (201), `PATCH` (partial update via
  `findByIdAndUpdate` with `runValidators`), `DELETE` (204).

Verification note: same constraint as M2 — no Docker/Mongo in the M3 session. notes-api was booted
with `MONGO_URL` unset (startup tolerates it and still listens) to confirm route registration, Zod
validation, and the error handler on all validation paths. DB-touching reads/writes need a live
Mongo (`docker compose up --build`, then `npm run seed`).

## Data model

**Postgres (`core-api`, see `core-api/prisma/schema.prisma`):** Band → Member (1:many), Venue →
Gig (1:many), Gig → Setlist (1:1), Setlist ↔ Song via `SetlistSong` join table (ordered, `position`
field).

**MongoDB (`notes-api`, see `notes-api/src/models/`):** `song_notes` (songId, bandId, tempoNotes,
pluginChain[], drumMapNotes, freeformText), `rig_configs` (memberId, instrument, gearList[],
signalChain[]), `gig_checklists` (gigId, venueType, items[{label, done}], notes). Each document
references a Postgres id as a plain field — no FK enforcement across databases, by design.

## Gotchas already solved — don't rediscover these

This stack hit several genuine Prisma 7 breaking changes (very recent major version) during
scaffolding. All fixed and verified working; the reasoning is preserved here so it isn't
re-debugged from scratch:

1. **`node:22-alpine` broke Prisma's engine binaries** (musl libc / missing OpenSSL) →
   `core-api/Dockerfile` uses `node:22-slim` with `openssl` installed instead.
2. **Prisma 7 removed `datasource.url` from `schema.prisma` entirely.** Connection strings now
   live in `core-api/prisma.config.ts`; the running app builds its own `PrismaPg` driver adapter
   from `DATABASE_URL` and passes it to `PrismaClient` (`core-api/src/db.js`). The generator uses
   `provider = "prisma-client"` with a required `output` path (`../src/generated/prisma`), not the
   old `prisma-client-js`.
3. **`prisma generate` needs `DATABASE_URL` to exist at build time, but a Docker `ENV`
   instruction alone didn't satisfy Prisma's config loader** — it specifically wants a `.env` file
   (confirmed via its own "injected env (N) from .env" log line, not just ambient process env).
   `core-api/Dockerfile` writes a placeholder `.env` right before `prisma generate`, then deletes
   it; Compose's real `DATABASE_URL` takes over at container start regardless.
4. **Prisma 7's client generator always emits TypeScript** (`client.ts`), even for a plain JS
   project — there's no plain-`.js` output option. `core-api` now runs via `tsx` instead of plain
   `node` (see `package.json` scripts and the Dockerfile `CMD`); `tsx` resolves the generated
   client's `.js`-style import specifier to the real `.ts` file, the same convention TypeScript's
   own NodeNext resolution uses. No separate build/compile step needed.
5. **Tracked migration now exists (converted in Session 2).** The initial migration lives in
   `core-api/prisma/migrations/<ts>_init/` (+ `migration_lock.toml`) and `core-api/Dockerfile`
   runs `prisma migrate deploy` on start — the earlier `prisma db push --accept-data-loss` stopgap
   is gone. Because Docker/Postgres wasn't available in that session, the migration SQL was
   generated offline with `prisma migrate diff --from-empty --to-schema prisma/schema.prisma
   --script` (identical output to `migrate dev`) rather than by running `migrate dev` against a live
   DB; it has not yet been applied to a running database. Two caveats to know:
   - `migrate deploy` expects a **fresh** database. If a Postgres volume was already populated by
     the old `db push` path, `deploy` will fail (tables exist, no migration history) — run
     `docker compose down -v` once to drop the volume, or `prisma migrate resolve --applied <name>`
     to baseline it.
   - For future schema changes, run `npx prisma migrate dev --name <change>` locally against a live
     DB (it records the migration and regenerates the client), then commit the new folder.

## Next up: Sessions 4–5 (M4/M5) — Nuxt pages against the now-working APIs

Both APIs now expose full CRUD. Next is building the `web` Nuxt 3 app: pages/components that call
`core-api` (:3001) and `notes-api` (:3002) over REST — list/detail/edit views for bands, gigs,
setlists, and the notes collections. After that: auth (Session 6), deploy (Session 7), polish
(Session 8).

## Running locally

```bash
docker compose up --build     # postgres, mongo, core-api, notes-api
cd web && npm install && npm run dev   # frontend, separately, with hot reload
```
