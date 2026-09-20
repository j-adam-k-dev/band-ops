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

## Current status: Session 2 (M2) complete

M1 (scaffold) and M2 (full core-api CRUD) are done. `docker compose up --build` boots Postgres,
MongoDB, `core-api`, and `notes-api`; both `/health` endpoints return
`{ "status": "ok", "db": "connected" }`. `web` runs separately via `npm run dev` (not in Compose —
see root README).

What exists right now:
- `core-api`: `/health` plus **full CRUD** for every Postgres entity — bands, members, venues,
  songs, gigs, setlists (incl. setlist song management via the `SetlistSong` join table). See the
  M2 layout note below.
- `notes-api`: `/health`, `GET/POST /song-notes`, `GET /rig-configs`, `GET /gig-checklists`
  (still working examples only — full CRUD is Session 3 / M3).
- `web`: untouched Nuxt minimal template, no app code yet.

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
5. **No tracked Prisma migration exists yet.** `core-api/Dockerfile` uses
   `prisma db push --accept-data-loss` as a get-started-fast stopgap. Once the schema feels
   settled, run `npx prisma migrate dev --name init` locally, commit the generated
   `prisma/migrations/` folder, and switch the Dockerfile to `prisma migrate deploy`.

## Next up: Session 3 (M3) — full notes-api CRUD

Add complete CRUD (with Zod validation) for `notes-api`'s three Mongo collections — `song_notes`,
`rig_configs`, `gig_checklists` — beyond the current working-example endpoints, mirroring the
per-resource schemas/routes/error-handler structure established in core-api's M2. After that, Nuxt
pages against the now-working APIs (Sessions 4–5), auth (Session 6), deploy (Session 7), polish
(Session 8).

## Running locally

```bash
docker compose up --build     # postgres, mongo, core-api, notes-api
cd web && npm install && npm run dev   # frontend, separately, with hot reload
```
