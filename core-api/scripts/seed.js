// Seeds a realistic, fully-linked dataset into BOTH services via their REST APIs:
//   core-api  (Postgres): band, members, venues, songs, gig, ordered setlist
//   notes-api (Mongo):    a song note, rig configs, and a gig checklist that
//                         reference the core-api ids created above
//
// Why the API (not the DB directly): running through the real endpoints also
// exercises Zod validation, the route layer, and the error handlers — so a clean
// seed run is proof the whole stack works end-to-end, not just the databases.
//
// Idempotent: entities with a natural key are reused if already present, and
// setlist songs are set with PUT (replace-all), so re-running converges to the
// same state instead of creating duplicates.
//
//   Prereq: `docker compose up` (core-api :3001 and notes-api :3002 reachable)
//   Run:    npm run seed            (from core-api/)
//   Custom: CORE_API_URL=... NOTES_API_URL=... npm run seed

const CORE = process.env.CORE_API_URL ?? 'http://localhost:3001';
const NOTES = process.env.NOTES_API_URL ?? 'http://localhost:3002';

async function api(method, path, body, base = CORE) {
  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(
      `Cannot reach ${base} (${err.code ?? err.message}). ` +
        'Is the stack up? Run `docker compose up` first.',
    );
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${method} ${base}${path} -> ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

// GET the collection, reuse the first match, otherwise POST to create.
async function ensure(path, match, createBody, label, base = CORE) {
  const list = await api('GET', path, undefined, base);
  const found = list.find(match);
  if (found) {
    console.log(`= ${label} (existing) ${found._id ?? found.id}`);
    return found;
  }
  const created = await api('POST', path, createBody, base);
  console.log(`+ ${label} (created)  ${created._id ?? created.id}`);
  return created;
}

async function main() {
  console.log(`Seeding core-api ${CORE} and notes-api ${NOTES} ...\n`);

  // ---- core-api (Postgres) -------------------------------------------------
  console.log('-- core-api --');

  // 1. Band + members. GET /bands includes members, so we can dedupe on both.
  const band = await ensure(
    '/bands',
    (b) => b.name === 'The Void Callers',
    { name: 'The Void Callers' },
    'band  The Void Callers',
  );

  const memberSpecs = [
    { name: 'Ava Rhodes', role: 'vocals' },
    { name: 'Miles Chen', role: 'guitar' },
    { name: 'Dre Okafor', role: 'drums' },
    { name: 'Sam Ellis', role: 'bass' },
  ];
  const roster = [];
  for (const m of memberSpecs) {
    const existing = band.members?.find((x) => x.name === m.name);
    if (existing) {
      console.log(`  = member (existing) ${existing.name}`);
      roster.push(existing);
    } else {
      const created = await api('POST', '/members', { bandId: band.id, ...m });
      console.log(`  + member (created)  ${created.name} — ${created.role}`);
      roster.push(created);
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

  // ---- notes-api (Mongo) ---------------------------------------------------
  // References the core-api ids created above (no cross-DB FK, by design).
  console.log('\n-- notes-api --');

  const redshift = songs.find((s) => s.title === 'Redshift');
  await ensure(
    `/song-notes?songId=${redshift.id}&bandId=${band.id}`,
    () => true,
    {
      songId: redshift.id,
      bandId: band.id,
      tempoNotes: 'Click at 128; resist pushing into the chorus.',
      pluginChain: ['HPF 80Hz', 'Comp 4:1', 'Plate reverb'],
      drumMapNotes: 'Ride only on the bridge.',
      freeformText: 'Tempo tends to creep live — watch it.',
    },
    'song-note for Redshift',
    NOTES,
  );

  const guitarist = roster.find((r) => r.role === 'guitar');
  const drummer = roster.find((r) => r.role === 'drums');
  if (guitarist) {
    await ensure(
      `/rig-configs?memberId=${guitarist.id}`,
      (r) => r.instrument === 'guitar',
      {
        memberId: guitarist.id,
        instrument: 'guitar',
        gearList: ['Telecaster', 'Deluxe Reverb', 'Tube Screamer'],
        signalChain: ['Guitar', 'Tube Screamer', 'Amp'],
      },
      'rig-config for guitarist',
      NOTES,
    );
  }
  if (drummer) {
    await ensure(
      `/rig-configs?memberId=${drummer.id}`,
      (r) => r.instrument === 'drums',
      {
        memberId: drummer.id,
        instrument: 'drums',
        gearList: ['5-piece kit', '20" ride', 'in-ear monitors'],
        signalChain: [],
      },
      'rig-config for drummer',
      NOTES,
    );
  }

  await ensure(
    `/gig-checklists?gigId=${gig.id}`,
    () => true,
    {
      gigId: gig.id,
      venueType: 'indoor', // The Basement is indoor
      items: [
        { label: 'Load in by 5:30' },
        { label: 'Line check all channels' },
        { label: 'Merch table set up' },
        { label: 'Set list taped to floor' },
      ],
      notes: 'Small stage — keep backline minimal.',
    },
    'gig-checklist for gig',
    NOTES,
  );

  console.log('\nDone. Try:');
  console.log('  curl http://localhost:3001/gigs');
  console.log('  curl http://localhost:3002/song-notes');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
