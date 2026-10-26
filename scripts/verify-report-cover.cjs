/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script */
// Forsíðumynd skýrslu þegar engin mynd er merkt (photos.is_cover): Rondva fær fyrstu rýmismynd
// (rými eftir sort_order, svo mynd), annars fyrstu athugasemdamynd — í ÖLLUM sniðum (venjulegt,
// NZS 4306, isop). Beton heldur gömlu leiðinni (fyrsta mynd í innlestrarröð) bæti fyrir bæti.
// Tilbúin gögn; engin auðkenning, ekkert net. Run: node scripts/verify-report-cover.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { renderReportMarkup } = require('./report-fixture.cjs');
const { buildIsopSampleRecord } = require('./isop-sample/sample-inspection.cjs');
const { buildNzSampleRecord } = require('./nz-sample/sample-inspection.cjs');

const mod = { exports: {} };
new Function('exports', 'module', ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/report/cover.ts'), 'utf8'),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText)(mod.exports, mod);
const { pickCoverPhoto } = mod.exports;

const ph = (id, sort, room, obs, cover = false) => ({ id, is_cover: cover, sort_order: sort, room_id: room, observation_id: obs });
// Einingarpróf: tilvik eigandans (ein rýmismynd sort 1, ein athugasemdamynd sort 0), engin forsíða.
const rooms = [{ id: 'r1', sort_order: 0 }, { id: 'r2', sort_order: 1 }];
assert.equal(pickCoverPhoto([ph('obs', 0, null, 'o1'), ph('room', 1, 'r1', null)], rooms, false).id, 'room');
assert.equal(pickCoverPhoto([ph('obs', 0, null, 'o1'), ph('room', 1, 'r1', null)], rooms, true).id, 'obs', 'Beton: first photo as before');
assert.equal(pickCoverPhoto([ph('b', 0, 'r2', null), ph('a', 3, 'r1', null)], rooms, false).id, 'a', 'room sort_order first');
assert.equal(pickCoverPhoto([ph('o2', 5, null, 'x'), ph('o1', 2, null, 'y')], rooms, false).id, 'o1', 'observation photo only without room photos');
assert.equal(pickCoverPhoto([ph('x', 0, 'r1', null), ph('m', 9, 'r2', null, true)], rooms, false).id, 'm', 'marked cover wins (Rondva)');
assert.equal(pickCoverPhoto([ph('x', 0, 'r1', null), ph('m', 9, 'r2', null, true)], rooms, true).id, 'm', 'marked cover wins (Beton)');
assert.equal(pickCoverPhoto([], rooms, false), null);
console.log('PASS pickCoverPhoto unit cases');

const clone = (v) => JSON.parse(JSON.stringify(v));
const coverSrc = (html) => (html.match(/<img[^>]*alt="(?:Cover photo|Forsíðumynd)"[^>]*>/) || [''])[0].match(/src="([^"]+)"/)?.[1] ?? null;
const photoOf = (id, sp, sort, room, obs) => ({ id, storage_path: sp, photo_type: 'normal', caption: null, is_cover: false, sort_order: sort, room_id: room, observation_id: obs });

// Tvö rými: A (sort 0) á aðeins athugasemdamynd, B (sort 1) á rýmismynd. Engin merkt forsíða.
function withPhotos(record) {
  const r = clone(record);
  r.rooms.sort((a, b) => a.sort_order - b.sort_order);
  const [a, b] = r.rooms;
  for (const room of r.rooms) { room.photos = []; for (const o of room.observations ?? []) o.photos = []; }
  a.observations = a.observations?.length ? a.observations : [{ id: 'oA', observation_number: '1', category: 'x', title: 'T', description: 'd', suggestion: 's', severity: 'athugasemd', sort_order: 0, photos: [] }];
  a.observations[0].photos = [photoOf('pObs', 'obsA.jpg', 0, null, a.observations[0].id)];
  b.photos = [photoOf('pRoom', 'roomB.jpg', 1, b.id, null)];
  return r;
}

async function main() {
  const isop = withPhotos(buildIsopSampleRecord());
  const nz = withPhotos(buildNzSampleRecord());
  const standard = withPhotos(buildIsopSampleRecord());
  standard.ai_report_data.report_standard = 'standard'; delete standard.ai_report_data.isop;
  const beton = clone(standard); delete beton.inspectors; // enginn company_name → Beton

  for (const [label, rec] of [['isop', isop], ['nzs_4306', nz], ['standard (Rondva company)', standard]]) {
    const html = await renderReportMarkup(rec, { pdf: true, dashboardLocale: 'en', brand: 'rondva' });
    assert.equal(coverSrc(html), '/fixture-photos/roomB.jpg', `${label}: first room photo is the cover`);
    // Aðeins athugasemdamynd til → hún.
    const onlyObs = clone(rec); for (const room of onlyObs.rooms) room.photos = [];
    const h2 = await renderReportMarkup(onlyObs, { pdf: true, dashboardLocale: 'en', brand: 'rondva' });
    assert.equal(coverSrc(h2), '/fixture-photos/obsA.jpg', `${label}: observation photo when no room photo`);
    // Merkt forsíða vinnur.
    const marked = clone(rec); marked.rooms[1].photos[0].is_cover = true; marked.rooms[0].observations[0].photos[0].is_cover = true;
    const h3 = await renderReportMarkup(marked, { pdf: true, dashboardLocale: 'en', brand: 'rondva' });
    assert.ok(coverSrc(h3), `${label}: marked cover renders`);
    console.log(`PASS ${label}: room photo > observation photo > marked cover`);
  }

  // Beton: óbreytt gamla röðin (fyrsta mynd í innlestrarröð = rými A: athugasemdamyndin á undan rýmismynd B).
  const bh = await renderReportMarkup(beton, { pdf: true, dashboardLocale: 'is', brand: 'beton' });
  assert.equal(coverSrc(bh), '/fixture-photos/obsA.jpg', 'Beton keeps the legacy first-photo cover');
  console.log('PASS Beton company keeps legacy cover choice (identical to origin/main)');
}
main().catch((e) => { console.error(e); process.exit(1); });
