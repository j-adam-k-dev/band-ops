// Seeds a realistic, fully-linked dataset into core-api via its REST API.
//
// Why the API (not Prisma directly): running through the real endpoints also
// exercises Zod validation, the route layer, and the error handler — so a clean
// seed run is proof the whole stack works end-to-end, not just the database.
//
// Idempotent: entities with a natural name/title are reused if already present,
// and setlist songs are set with PUT (replace-all), so re-running converges to
// the same state instead of creating duplicates.
//
//   Prereq: `docker compose up` (core-api reachable on :3001)
//   Run:    npm run seed            (from core-api/)
//   Custom: CORE_API_URL=http://host:port npm run seed

const BASE = process.env.CORE_API_URL ?? 'http://localhost:3001';

async function api(method, path, body) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(
      `Cannot reach core-api at ${BASE} (${err.code ?? err.message}). ` +
        'Is the stack up? Run `docker compose up` first.',
    );
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

// GET the collection, reuse the first match, otherwise POST to create.
async function ensure(path, match, createBody, label) {
  const list = await api('GET', path);
  const found = list.find(match);
  if (found) {
    console.log(`= ${label} (existing) ${found.id}`);
    return found;
  }
  const created = await api('POST', path, createBody);
  console.log(`+ ${label} (created)  ${created.id}`);
  return created;
}

async function main() {
  console.log(`Seeding core-api at ${BASE} ...\n`);

  // 1. Band + members. GET /bands includes members, so we can dedupe on both.
  const band = await ensure(
    '/bands',
    (b) => b.name === 'The Void Callers',
    { name: 'The Void Callers' },
    'band  The Void Callers',
  );

  const members = [
    { name: 'Ava Rhodes', role: 'vocals' },
    { name: 'Miles Chen', role: 'guitar' },
    { name: 'Dre Okafor', role: 'drums' },
    { name: 'Sam Ellis', role: 'bass' },
  ];
  for (const m of members) {
    if (band.members?.some((existing) => existing.name === m.name)) {
      console.log(`  = member (existing) ${m.name}`);
    } else {
      const created = await api('POST', '/members', { bandId: band.id, ...m });
      console.log(`  + member (created)  ${created.name} — ${created.role}`);
    }
  }

  // 2. Venues.
  const basement = await ensure(
    '/venues',
    (v) => v.name === 'The Basement',
    { name: 'The Basement', address: '14 Cellar St', isOutdoor: false, contact: 'booking@basement.example' },
    'venue The Basement',
  );
  await ensure(
    '/venues',
    (v) => v.name === 'Riverside Amphitheater',
    { name: 'Riverside Amphitheater', address: '1 River Rd', isOutdoor: true },
    'venue Riverside Amphitheater',
  );

  // 3. Songs.
  const songSpecs = [
    { title: 'Redshift', tempoBpm: 128, musicalKey: 'Am', durationSec: 214 },
    { title: 'Paper Cities', tempoBpm: 92, musicalKey: 'C', durationSec: 268 },
    { title: 'Static Bloom', tempoBpm: 140, musicalKey: 'E', durationSec: 197 },
    { title: 'Low Tide', tempoBpm: 76, musicalKey: 'Dm', durationSec: 305 },
  ];
  const songs = [];
  for (const spec of songSpecs) {
    songs.push(
      await ensure('/songs', (s) => s.title === spec.title, spec, `song  ${spec.title}`),
    );
  }

  // 4. Gig at The Basement (dedupe on venue + date).
  const gigDate = '2026-11-01T20:00:00.000Z';
  const gig = await ensure(
    '/gigs',
    (g) => g.venueId === basement.id && new Date(g.date).toISOString() === gigDate,
    { venueId: basement.id, date: gigDate, loadInTime: '2026-11-01T17:30:00.000Z', status: 'confirmed' },
    'gig   The Basement 2026-11-01',
  );

  // 5. Setlist for that gig (1:1). The gig payload includes its setlist if any.
  let setlist = gig.setlist;
  if (setlist) {
    console.log(`= setlist (existing) ${setlist.id}`);
  } else {
    setlist = await api('POST', '/setlists', { gigId: gig.id, name: 'Main Set' });
    console.log(`+ setlist (created)  ${setlist.id}`);
  }

  // 6. Ordered songs — PUT replace-all is inherently idempotent.
  const ordered = songs.map((song, i) => ({ songId: song.id, position: i }));
  await api('PUT', `/setlists/${setlist.id}/songs`, { songs: ordered });
  console.log(`  ~ setlist songs set: ${ordered.length} in order`);

  console.log('\nDone. Try:  curl http://localhost:3001/gigs');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
