FROM node:22-slim

WORKDIR /app

# Prisma's engine binaries need OpenSSL present at generate- and run-time.
# node:22-alpine's musl libc is a known source of exactly the failure you hit
# ("prisma generate did not complete successfully") — node:22-slim (Debian, glibc)
# is the base Prisma's own docs recommend to sidestep it.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# `prisma generate` only needs DATABASE_URL to exist (prisma.config.ts resolves it eagerly) —
# it doesn't need to actually reach a database at build time. A Docker ENV instruction alone
# didn't satisfy Prisma's config loader here; it specifically wants a .env file (see the
# "injected env (N) from .env" line in its own output), so write one just for this step.
# docker-compose's real DATABASE_URL (set at container start) takes over at runtime regardless.
RUN echo 'DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"' > .env \
  && npx prisma generate \
  && rm -f .env

EXPOSE 3001

# No migration history yet at this scaffold stage, so push the schema directly.
# Once you run `npx prisma migrate dev --name init` locally and commit the migration,
# switch this to `npx prisma migrate deploy` instead.
#
# Prisma 7's client generator always emits TypeScript (no plain-.js output option), even
# for a JS project — so the app runs through tsx, which resolves the generated client's
# ".js" import specifiers to their actual ".ts" files (the same convention TypeScript's own
# NodeNext module resolution uses), no separate compile step needed.
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx tsx src/index.js"]
