# Band Ops / Gig Manager

A gig-management app — venues, gigs, setlists, song notes, and load-in checklists — built as a real microservices split across Postgres and MongoDB, using Nuxt/Vue on the frontend.

Full architecture, data model, and build plan: see the project's planning doc.

## Services

| Service | Stack | Port | Owns |
| --- | --- | --- | --- |
| `web` | Nuxt 3 / Vue 3 | 3000 | UI only — no data of its own |
| `core-api` | Fastify + Prisma | 3001 | Postgres: bands, members, venues, gigs, songs, setlists |
| `notes-api` | Fastify + Mongoose | 3002 | MongoDB: song notes, rig configs, gig checklists |

`web` calls both APIs over REST. `core-api` and `notes-api` don't talk to each other in v1.

## Running locally

```bash
# 1. Bring up Postgres, Mongo, and both APIs
docker compose up --build

# 2. (Optional) load a realistic sample dataset into core-api
cd core-api && npm install && npm run seed

# 3. In a separate terminal, run the frontend with hot-reload
cd web
npm install
npm run dev
```

Once it's up:

- `core-api` health check: http://localhost:3001/health
- `notes-api` health check: http://localhost:3002/health
- `web`: http://localhost:3000

The seed script (`core-api/scripts/seed.js`) populates a band + members, venues, songs, a gig, and an ordered setlist by POSTing through the real API. It's idempotent, so it's safe to re-run.

## Status

Sessions 1–4 are done. Both APIs expose full CRUD (with Zod validation): `core-api` for every Postgres entity — bands, members, venues, songs, gigs, setlists — and `notes-api` for all three Mongo collections — song-notes, rig-configs, gig-checklists. The `web` frontend (Nuxt 4 + Nuxt UI) now has an app shell and read/create/delete pages for the core entities, talking to both APIs through a Nitro proxy (no CORS). Session 5 adds editing, the setlist builder, and the notes-api pages. The seed script populates both databases.

> Note: the frontend calls the APIs via a same-origin proxy, so `core-api` and `notes-api` must be running (`docker compose up`) for `web`'s pages to load data.

`core-api` now applies a tracked Prisma migration via `prisma migrate deploy` on start (`prisma/migrations/`). `migrate deploy` expects a fresh database — if you have a Postgres volume left over from the earlier `db push` scaffold, run `docker compose down -v` once before the first `up`.
