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

# 2. In a separate terminal, run the frontend with hot-reload
cd web
npm install
npm run dev
```

Once it's up:

- `core-api` health check: http://localhost:3001/health
- `notes-api` health check: http://localhost:3002/health
- `web`: http://localhost:3000

## Status

This is the Session 1 / M1 scaffold: both services boot, connect to their databases, and expose a `/health` endpoint plus one working example route each (`GET/POST /bands` on core-api, `GET/POST /song-notes` on notes-api). Full CRUD across all entities is Session 2 (core-api) and Session 3 (notes-api).

**Known follow-up:** `core-api`'s Prisma schema exists but has no tracked migration yet — the Dockerfile uses `prisma db push` to get started fast. Once the schema settles, run `npx prisma migrate dev --name init` locally, commit the generated `prisma/migrations/` folder, and switch the Dockerfile to `prisma migrate deploy`.
