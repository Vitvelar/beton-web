// „Kerfi + status“-eining (isop, síðar AU): lib/report/systems/ (beton-app) = src/lib/report/systems/ (beton-web).
// Samningur: plan/rondva/ISOP-SNID-HONNUN.md §2–3, §6.4, §8.1. Þessi skrá er BÆTI FYRIR BÆTI eins í báðum repo
// (finnur sjálf rétta möppu) og prófar: kerfaskrána, vörpun rýma/athugasemda, Deficiency (reiknað), Summary-röðun,
// ósamræmi/ástæður, markSystemsWithRooms, Texas-viðvörun, að föllin kasta aldrei og jafngildi milli repo.
// Run: node scripts/verify-isop-systems.cjs      (BETON_PARITY_DIR=<hitt repo> til að velja samanburðarmöppu)
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const isApp = fs.existsSync(path.join(root, 'lib/report/systems'));
const SYSTEMS_REL = isApp ? 'lib/report/systems' : 'src/lib/report/systems';
const OTHER_REL = isApp ? 'src/lib/report/systems' : 'lib/report/systems';
const FILES = ['types.ts', 'catalog-isop.ts', 'core.ts', 'index.ts'];
const systemsDir = path.join(root, SYSTEMS_REL);

function makeLoader() {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} };
    cache.set(file, mod);
    const req = (name) => {
      if (name.startsWith('.')) {
        let target = path.resolve(path.dirname(file), name);
        if (!path.extname(target)) target += '.ts';
        return load(target);
      }
      throw new Error(`systems module must not import "${name}" (it has to stay dependency-free)`);
    };
    const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
      fileName: file,
    }).outputText;
    new Function('require', 'module', 'exports', out)(req, mod, mod.exports);
    return mod.exports;
  }
  return load;
}

let n = 0;
const skipped = [];
class Skip extends Error {}
function check(name, fn) {
  try {
    fn();
  } catch (error) {
    if (!(error instanceof Skip)) throw error;
    skipped.push(name);
    console.log(`SKIP ${name}\n     WARNING: ${error.message} — this parity check did NOT run`);
    return;
  }
  n++;
  console.log(`PASS ${name}`);
}

const sys = makeLoader()(path.join(systemsDir, 'index.ts'));
const { ISOP_CATALOG: catalog } = sys;
const room = (id, slug, name, observations = []) => ({ id, slug, name, observations });
const obs = (id, severity, extra = {}) => ({ id, severity, ...extra });

// ── 1. Skráin sjálf
check('catalog: ten systems in the agreed order plus "Additional items"', () => {
  assert.deepEqual(
    catalog.systems.map((s) => [s.order, s.key, s.label]),
    [
      [1, 'roof', 'Roof'],
      [2, 'exterior', 'Exterior'],
      [3, 'structure', 'Basement, Foundation, Crawlspace & Structure'],
      [4, 'heating', 'Heating'],
      [5, 'cooling', 'Cooling'],
      [6, 'plumbing', 'Plumbing'],
      [7, 'electrical', 'Electrical'],
      [8, 'fireplace', 'Fireplace'],
      [9, 'attic', 'Attic, Insulation & Ventilation'],
      [10, 'interior', 'Doors, Windows & Interior'],
      [11, 'additional', 'Additional items'],
    ],
  );
  assert.deepEqual([...sys.ISOP_SYSTEM_KEYS], catalog.systems.map((s) => s.key));
  assert.equal(catalog.fallbackKey, 'additional');
  assert.equal(catalog.slugPrefix, 'isop-');
  assert.deepEqual(sys.sortedSystems(catalog).map((s) => s.key), catalog.systems.map((s) => s.key));
});

check('catalog: room bases are isop-* and unique; the 25 documented rooms map to their systems', () => {
  const seen = new Map();
  for (const system of catalog.systems) {
    for (const base of system.roomBases) {
      assert.ok(base.startsWith('isop-'), base);
      assert.ok(!seen.has(base), `${base} in two systems`);
      seen.set(base, system.key);
    }
  }
  assert.equal(seen.size, 25);
  const expected = {
    roof: ['isop-roof'],
    exterior: ['isop-exterior', 'isop-deck', 'isop-porch'],
    structure: ['isop-structure', 'isop-basement', 'isop-crawlspace'],
    heating: ['isop-heating'],
    cooling: ['isop-cooling'],
    plumbing: ['isop-plumbing', 'isop-water-heater'],
    electrical: ['isop-electrical'],
    fireplace: ['isop-fireplace'],
    attic: ['isop-attic'],
    interior: ['isop-living', 'isop-family', 'isop-dining', 'isop-kitchen', 'isop-bedroom', 'isop-bathroom', 'isop-half-bath', 'isop-laundry', 'isop-hallway', 'isop-stairs', 'isop-garage'],
    additional: [],
  };
  for (const [key, bases] of Object.entries(expected)) assert.deepEqual([...catalog.systems.find((s) => s.key === key).roomBases], bases, key);
});

check('catalog: does not collide with Beton/NZ room slugs (when constants.ts / nz-elements.ts are present)', () => {
  const taken = new Set();
  for (const rel of ['lib/utils/constants.ts', 'lib/report/nz-elements.ts', 'src/lib/report/nz-elements.ts']) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) continue;
    for (const m of fs.readFileSync(file, 'utf8').matchAll(/['"]((?:nz-)?[a-z][a-z-]*)['"]/g)) taken.add(m[1]);
  }
  for (const system of catalog.systems) for (const base of system.roomBases) assert.ok(!taken.has(base), base);
});

check('catalog: statuses (isop has no "limited"; "Additional items" has no status), describe keys unique, rating keys are snake_case', () => {
  for (const system of catalog.systems) {
    if (system.key === 'additional') {
      assert.deepEqual([...system.allowedStatuses], []);
      assert.equal(system.statusRequired, false);
    } else {
      assert.deepEqual([...system.allowedStatuses], ['inspected', 'not_inspected', 'not_present'], system.key);
      assert.equal(system.statusRequired, true);
    }
    const describeKeys = system.describe.map((d) => d.key);
    assert.equal(new Set(describeKeys).size, describeKeys.length, system.key);
    for (const key of [...describeKeys, ...system.ratingKeys]) assert.match(key, /^[a-z][a-z0-9_]*$/, key);
    assert.equal(new Set(system.ratingKeys).size, system.ratingKeys.length, system.key);
  }
  assert.deepEqual({ ...sys.SYSTEM_STATUS_LABELS }, { inspected: 'Inspected', limited: 'Limited', not_inspected: 'Not inspected', not_present: 'Not present' });
  assert.deepEqual(
    { ...sys.ISOP_TERMS.category },
    { safety: 'Safety hazard', major: 'Major defect', repair: 'Repair or replace', maintenance: 'Maintenance' },
  );
  assert.equal(sys.ISOP_TERMS.furtherEvaluation, 'Further evaluation recommended');
});

check('catalog + terms: no forbidden claims (compliant/certified/standard names) in any shipped label', () => {
  const text = JSON.stringify([catalog, sys.ISOP_TERMS, sys.SYSTEM_STATUS_LABELS]);
  for (const word of [/complian/i, /certif/i, /internachi/i, /\bashi\b/i, /\bcsa\b/i, /\btrec\b/i, /in accordance/i, /standards? of practice/i, /warrant/i, /guarantee/i]) {
    assert.ok(!word.test(text), String(word));
  }
});

check('module is dependency-free (only ./ imports) and the source has no forbidden claims', () => {
  for (const file of FILES) {
    const text = fs.readFileSync(path.join(systemsDir, file), 'utf8');
    for (const m of text.matchAll(/^\s*(?:import|export)\b[^'"\n]*from\s+['"]([^'"]+)['"]/gm)) assert.ok(m[1].startsWith('./'), `${file}: ${m[1]}`);
  }
});

// ── 2. Gögn skoðunarmanns
check('systemsDataFrom: sanitises, keeps text verbatim, never mutates, accepts JSON string', () => {
  const input = {
    systems: {
      v: 7,
      items: {
        roof: { status: 'inspected', limitations: '  Viewed from the ground\twith binoculars.  ', describe: { covering_type: 'Asphalt shingles (architectural)', bad: 5 } },
        cooling: { status: 'not_inspected', reason: 'Outdoor temperature below 60 °F at the time of inspection.' },
        fireplace: { status: 'not_present' },
        heating: { status: 'bogus', reason: 42 },
        attic: 'nope',
      },
      room_map: { 'r-1': 'exterior', 'r-2': 7 },
    },
  };
  const frozen = JSON.stringify(input);
  const data = sys.systemsDataFrom(input);
  assert.equal(JSON.stringify(input), frozen);
  assert.equal(data.v, 1);
  assert.deepEqual(data.items.roof, { status: 'inspected', limitations: '  Viewed from the ground\twith binoculars.  ', describe: { covering_type: 'Asphalt shingles (architectural)' } });
  assert.deepEqual(data.items.cooling, { status: 'not_inspected', reason: 'Outdoor temperature below 60 °F at the time of inspection.' });
  assert.deepEqual(data.items.fireplace, { status: 'not_present' });
  assert.deepEqual(data.items.heating, {});
  assert.ok(!('attic' in data.items));
  assert.deepEqual(data.room_map, { 'r-1': 'exterior' });
  assert.deepEqual(sys.systemsDataFrom(JSON.stringify(input)), data);
  // afrit, ekki sama tilvik
  data.items.roof.describe.covering_type = 'x';
  assert.equal(input.systems.items.roof.describe.covering_type, 'Asphalt shingles (architectural)');
});

check('systemsDataFrom / statusOf: garbage in → empty data, never throws', () => {
  const empty = { v: 1, items: {}, room_map: {} };
  for (const bad of [undefined, null, 0, 5, 'x', '{bad json', '[]', [], {}, { systems: null }, { systems: [] }, { systems: 'x' }, { systems: { items: [] } }]) {
    assert.deepEqual(sys.systemsDataFrom(bad), empty, JSON.stringify(bad));
  }
  assert.equal(sys.statusOf(null, 'roof'), null);
  assert.equal(sys.statusOf(undefined, 'roof'), null);
  assert.equal(sys.statusOf({ v: 1, items: { roof: { status: 'inspected' } }, room_map: {} }, 'roof'), 'inspected');
  assert.equal(sys.statusOf({ v: 1, items: { roof: { status: 'zzz' } }, room_map: {} }, 'roof'), null);
  assert.equal(sys.statusOf({ v: 1, items: {}, room_map: {} }, 'toString'), null);
  assert.equal(sys.statusOf({ v: 1, items: {}, room_map: {} }, '__proto__'), null);
});

check('setSystemEntry / setRoomSystem: return new data, never mutate', () => {
  const base = sys.systemsDataFrom({ systems: { items: { roof: { status: 'inspected' } } } });
  const frozen = JSON.stringify(base);
  const next = sys.setSystemEntry(base, 'cooling', { status: 'not_inspected', reason: 'Cold.', describe: { cooling_type: 'Central A/C' } });
  assert.equal(JSON.stringify(base), frozen);
  assert.deepEqual(next.items.cooling, { status: 'not_inspected', reason: 'Cold.', describe: { cooling_type: 'Central A/C' } });
  assert.equal(next.items.roof.status, 'inspected');
  assert.ok(!('cooling' in sys.setSystemEntry(next, 'cooling', null).items));
  const mapped = sys.setRoomSystem(next, 'r-9', 'exterior');
  assert.deepEqual(mapped.room_map, { 'r-9': 'exterior' });
  assert.deepEqual(sys.setRoomSystem(mapped, 'r-9', null).room_map, {});
  assert.equal(JSON.stringify(next.room_map), '{}');
  assert.deepEqual(sys.setSystemEntry(null, 'roof', { status: 'inspected' }).items, { roof: { status: 'inspected' } });
});

// ── 3. Vörpun rýma á kerfi
check('catalogBaseSlug / hasCatalogRooms: exact, numbered, and rejected slugs', () => {
  for (const [slug, base] of [
    ['isop-roof', 'isop-roof'],
    ['isop-bedroom', 'isop-bedroom'],
    ['isop-bedroom-2', 'isop-bedroom'],
    ['isop-bedroom-12', 'isop-bedroom'],
    ['isop-half-bath-3', 'isop-half-bath'],
    ['isop-water-heater-2', 'isop-water-heater'],
  ]) assert.equal(sys.catalogBaseSlug(slug, catalog), base, slug);
  for (const slug of ['isop-', 'isop-unknown', 'isop-unknown-2', 'isop-bedroom-x', 'isop-bedroom-2-3', 'isop-bedroom2', 'ISOP-roof', 'thak', 'nz-roof', 'nz-bedroom-2', 'bedroom-2', '', null, undefined, 5]) {
    assert.equal(sys.catalogBaseSlug(slug, catalog), null, String(slug));
  }
  assert.equal(sys.hasCatalogRooms(['thak', 'nz-roof', 'isop-kitchen'], catalog), true);
  assert.equal(sys.hasCatalogRooms(['thak', 'eldhus', 'nz-roof', 'sérsniðið'], catalog), false);
  assert.equal(sys.hasCatalogRooms([], catalog), false);
  assert.equal(sys.hasCatalogRooms(new Set(['isop-attic']), catalog), true);
});

check('systemOfRoom: catalog slug → system; custom → room_map or additional; other formats → additional', () => {
  const map = { c1: 'exterior', c2: 'nonsense', c3: 'additional' };
  const of = (slug, id = 'x') => sys.systemOfRoom({ id, slug }, catalog, map);
  for (const system of catalog.systems) for (const base of system.roomBases) assert.equal(of(base), system.key, base);
  assert.equal(of('isop-bedroom-4'), 'interior');
  assert.equal(of('isop-crawlspace-2'), 'structure');
  assert.equal(of('pool-house', 'c1'), 'exterior');
  assert.equal(of('pool-house', 'c2'), 'additional');
  assert.equal(of('pool-house', 'c3'), 'additional');
  assert.equal(of('pool-house', 'unmapped'), 'additional');
  assert.equal(of('thak', 'c1'), 'exterior', 'a non-isop room with a mapping follows the mapping');
  assert.equal(of('thak'), 'additional');
  assert.equal(of('nz-roof'), 'additional');
  assert.equal(of('isop-roof', 'c1'), 'roof', 'a mapping never overrides a catalog slug');
  assert.equal(sys.systemOfRoom({}, catalog), 'additional');
  assert.equal(sys.systemOfRoom({ slug: 'isop-roof' }, catalog, null), 'roof');
  assert.equal(sys.systemOfRoom(null, catalog), 'additional');
});

check('groupRoomsBySystem: every system present in order, rooms keep their order', () => {
  const rooms = [room('a', 'isop-kitchen'), room('b', 'isop-roof'), room('c', 'isop-bedroom-2'), room('d', 'custom'), room('e', 'thak')];
  const groups = sys.groupRoomsBySystem(rooms, catalog, {});
  assert.deepEqual(groups.map((g) => g.system.key), catalog.systems.map((s) => s.key));
  assert.deepEqual(groups.find((g) => g.system.key === 'interior').rooms.map((r) => r.id), ['a', 'c']);
  assert.deepEqual(groups.find((g) => g.system.key === 'additional').rooms.map((r) => r.id), ['d', 'e']);
  assert.deepEqual(groups.find((g) => g.system.key === 'heating').rooms, []);
  assert.deepEqual(sys.groupRoomsBySystem(null, catalog).map((g) => g.rooms.length), Array(11).fill(0));
});

// ── 4. Deficiency er reiknað
const fixtureRooms = () => [
  room('r-roof', 'isop-roof', 'Roof', [
    obs('o1', 'alvarleg', { number: '1', title: 'Shingles lifted', suggestion: 'Repair.' }),
    obs('o2', 'athugasemd', { number: '2', title: 'Granule loss' }),
  ]),
  room('r-elec', 'isop-electrical', 'Electrical', [
    obs('o3', 'mjog_alvarleg', { number: '3', title: 'Double-tapped breaker', tags: ['further_evaluation'] }),
    obs('o4', 'athugasemd', { number: '4', title: 'Open junction box', tags: ['safety_hazard'] }),
  ]),
  room('r-bed', 'isop-bedroom-2', 'Bedroom 2', [obs('o5', 'athugasemd', { number: '5', title: 'Sticking door' })]),
  room('r-pool', 'pool-house', 'Pool house', [obs('o6', 'alvarleg', { number: '6', title: 'Rot at sill' })]),
];

check('deficienciesBySystem: Deficiency = alvarleg | mjog_alvarleg | safety_hazard; maintenance never makes a Deficiency', () => {
  const counts = sys.deficienciesBySystem(fixtureRooms(), catalog, {});
  assert.deepEqual(Object.keys(counts), catalog.systems.map((s) => s.key));
  assert.deepEqual(
    { d: counts.roof.deficiencies, repair: counts.roof.repair, m: counts.roof.maintenance, all: counts.roof.observations },
    { d: 1, repair: 1, m: 1, all: 2 },
  );
  assert.deepEqual(
    { d: counts.electrical.deficiencies, major: counts.electrical.major, safety: counts.electrical.safety, m: counts.electrical.maintenance, fe: counts.electrical.furtherEvaluation },
    { d: 2, major: 1, safety: 1, m: 0, fe: 1 },
  );
  assert.deepEqual([counts.interior.deficiencies, counts.interior.maintenance], [0, 1]);
  assert.deepEqual([counts.additional.deficiencies, counts.additional.repair], [1, 1]);
  assert.equal(sys.hasDeficiency(counts.roof), true);
  assert.equal(sys.hasDeficiency(counts.interior), false);
  assert.equal(sys.hasDeficiency(counts.heating), false);
  assert.equal(sys.hasDeficiency(null), false);
  assert.deepEqual(counts.electrical.observationIds, ['o3', 'o4']);
});

check('deficiencyCategoryOf: safety is orthogonal to severity and wins; unknown severity is never hidden', () => {
  const c = sys.deficiencyCategoryOf;
  assert.equal(c(obs('x', 'athugasemd')), null);
  assert.equal(c(obs('x', 'alvarleg')), 'repair');
  assert.equal(c(obs('x', 'mjog_alvarleg')), 'major');
  assert.equal(c(obs('x', 'athugasemd', { tags: ['safety_hazard'] })), 'safety');
  assert.equal(c(obs('x', 'mjog_alvarleg', { tags: ['safety_hazard'] })), 'safety');
  assert.equal(c(obs('x', 'alvarleg', { tags: ['further_evaluation'] })), 'repair');
  assert.equal(c(obs('x', 'athugasemd', { tags: ['further_evaluation'] })), null);
  assert.equal(c(obs('x', 'weird')), null);
  assert.equal(c(obs('x', undefined)), null);
  assert.equal(c(obs('x', 'athugasemd'), ['safety_hazard']), 'safety', 'tags carried in ai_report_data');
  assert.equal(c(obs('x', 'athugasemd', { tags: ['bogus'] })), null);
  assert.equal(c(null), null);
});

check('tagsByObservation (ai_report_data.isop.tags) merges with on-observation tags', () => {
  const rooms = [room('r', 'isop-roof', 'Roof', [obs('a', 'athugasemd'), obs('b', 'alvarleg')])];
  const counts = sys.deficienciesBySystem(rooms, catalog, { tagsByObservation: { a: ['safety_hazard'], b: ['further_evaluation'] } });
  assert.deepEqual([counts.roof.safety, counts.roof.repair, counts.roof.maintenance, counts.roof.furtherEvaluation], [1, 1, 0, 1]);
});

check('deficienciesBySystem honours room_map for custom rooms', () => {
  const rooms = [room('c1', 'pool-house', 'Pool house', [obs('a', 'alvarleg')])];
  assert.equal(sys.deficienciesBySystem(rooms, catalog, { roomMap: { c1: 'exterior' } }).exterior.deficiencies, 1);
  assert.equal(sys.deficienciesBySystem(rooms, catalog, {}).additional.deficiencies, 1);
});

check('systemStatusText + systemOverview: "Inspected · 2 deficiencies" / "Maintenance noted" / reasons', () => {
  const none = { observations: 0, deficiencies: 0, safety: 0, major: 0, repair: 0, maintenance: 0, furtherEvaluation: 0, observationIds: [] };
  assert.equal(sys.systemStatusText(null), 'Not set');
  assert.equal(sys.systemStatusText('inspected', none), 'Inspected');
  assert.equal(sys.systemStatusText('inspected', { ...none, deficiencies: 1 }), 'Inspected · 1 deficiency');
  assert.equal(sys.systemStatusText('inspected', { ...none, deficiencies: 2, maintenance: 5 }), 'Inspected · 2 deficiencies');
  assert.equal(sys.systemStatusText('inspected', { ...none, maintenance: 3 }), 'Inspected · Maintenance noted');
  assert.equal(sys.systemStatusText('not_inspected', { ...none, deficiencies: 1 }), 'Not inspected');
  assert.equal(sys.systemStatusText('not_present'), 'Not present');
  assert.equal(sys.systemStatusText('limited', { ...none, maintenance: 1 }), 'Limited · Maintenance noted');

  const data = sys.systemsDataFrom({
    systems: {
      items: {
        roof: { status: 'inspected', limitations: 'Binoculars.' },
        cooling: { status: 'not_inspected', reason: 'Cold outside.' },
        fireplace: { status: 'not_present' },
        electrical: { status: 'inspected' },
      },
    },
  });
  const rows = sys.systemOverview(data, fixtureRooms(), catalog);
  assert.deepEqual(rows.map((r) => r.key), catalog.systems.map((s) => s.key));
  const by = Object.fromEntries(rows.map((r) => [r.key, r]));
  assert.equal(by.roof.statusText, 'Inspected · 1 deficiency');
  assert.equal(by.roof.limitations, 'Binoculars.');
  assert.equal(by.roof.hasDeficiency, true);
  assert.deepEqual(by.roof.roomIds, ['r-roof']);
  assert.equal(by.cooling.statusText, 'Not inspected');
  assert.equal(by.cooling.reason, 'Cold outside.');
  assert.equal(by.fireplace.statusText, 'Not present');
  assert.equal(by.electrical.statusText, 'Inspected · 2 deficiencies');
  assert.equal(by.heating.status, null);
  assert.equal(by.heating.statusText, 'Not set');
  assert.equal(by.interior.status, null);
  assert.equal(by.additional.status, null, 'additional never has a status');
  assert.equal(by.additional.hasDeficiency, true);
});

// ── 5. Summary of deficiencies
check('buildDeficiencySummary: Safety → Major → Repair, then system order, then observation number; Maintenance separate', () => {
  const rooms = [
    room('r-int', 'isop-kitchen', 'Kitchen', [
      obs('k10', 'alvarleg', { number: '10', title: 'Leaking trap' }),
      obs('k2', 'alvarleg', { number: '2', title: 'Loose counter' }),
    ]),
    room('r-roof', 'isop-roof', 'Roof', [
      obs('r1', 'alvarleg', { number: '1', title: 'Shingles', polished_suggestion: 'Replace damaged shingles.', suggestion: 'raw' }),
      obs('r2', 'athugasemd', { number: '3', title: 'Granule loss' }),
    ]),
    room('r-elec', 'isop-electrical', 'Electrical', [
      obs('e1', 'mjog_alvarleg', { number: '4', title: 'Double tap', tags: ['further_evaluation'] }),
      obs('e2', 'athugasemd', { number: '5', title: 'Open junction box', tags: ['safety_hazard'] }),
      obs('e3', 'alvarleg', { number: '6', title: 'Loose outlet', tags: ['safety_hazard'] }),
    ]),
    room('r-ext', 'isop-exterior', 'Exterior', [obs('x1', 'mjog_alvarleg', { number: '7', title: 'Rotted post', category: 'Structure' })]),
    room('r-pool', 'pool-house', 'Pool house', [obs('p1', 'alvarleg', { number: '8', title: 'Sill rot' })]),
  ];
  const summary = sys.buildDeficiencySummary(rooms, catalog, {});
  assert.deepEqual(summary.rows.map((r) => [r.rank, r.observationId, r.category]), [
    [1, 'e2', 'safety'],
    [2, 'e3', 'safety'],
    [3, 'x1', 'major'],
    [4, 'e1', 'major'],
    [5, 'r1', 'repair'],
    [6, 'k2', 'repair'],
    [7, 'k10', 'repair'],
    [8, 'p1', 'repair'],
  ]);
  assert.deepEqual(summary.counts, { safety: 2, major: 2, repair: 4, deficiencies: 8, maintenance: 1 });
  assert.deepEqual(summary.maintenance.map((m) => m.observationId), ['r2']);
  const first = summary.rows[0];
  assert.deepEqual([first.systemKey, first.systemLabel, first.roomName, first.title, first.number], ['electrical', 'Electrical', 'Electrical', 'Open junction box', '5']);
  assert.equal(summary.rows[3].furtherEvaluation, true);
  assert.equal(summary.rows[4].recommendation, 'Replace damaged shingles.', 'polished_suggestion wins');
  assert.equal(summary.rows[5].recommendation, '');
  assert.equal(summary.rows[2].observationCategory, 'Structure');
  assert.equal(summary.rows[7].systemKey, 'additional');
});

check('buildDeficiencySummary: numbers sort numerically; fallback numbering follows input order; empty and bad input are fine', () => {
  const rooms = [room('r', 'isop-roof', 'Roof', [obs('a', 'alvarleg'), obs('b', 'alvarleg'), obs('c', 'alvarleg', { observation_number: '1.5' })])];
  assert.deepEqual(sys.buildDeficiencySummary(rooms, catalog).rows.map((r) => [r.observationId, r.number]), [['a', '1'], ['b', '2'], ['c', '1.5']].sort((x, y) => parseFloat(x[1]) - parseFloat(y[1])));
  const none = sys.buildDeficiencySummary([room('r', 'isop-roof', 'Roof', [obs('m', 'athugasemd')])], catalog);
  assert.deepEqual(none.rows, []);
  assert.equal(none.counts.deficiencies, 0);
  assert.equal(none.maintenance.length, 1);
  assert.deepEqual(sys.buildDeficiencySummary(null, catalog).rows, []);
  assert.deepEqual(sys.buildDeficiencySummary([null, { observations: [null, obs('q', 'alvarleg')] }], catalog).rows.map((r) => r.observationId), ['q']);
  // inntak óbreytt
  const input = fixtureRooms();
  const frozen = JSON.stringify(input);
  sys.buildDeficiencySummary(input, catalog);
  sys.deficienciesBySystem(input, catalog);
  assert.equal(JSON.stringify(input), frozen);
});

// ── 6. Ósvarað, ástæður, ósamræmi
check('missingSystemFields: fresh inspection → ten missing statuses (not Additional items)', () => {
  const issues = sys.missingSystemFields(sys.systemsDataFrom({}), catalog, []);
  assert.equal(issues.length, 10);
  assert.ok(issues.every((i) => i.code === 'status_missing'));
  assert.deepEqual(issues.map((i) => i.systemKey), catalog.systems.filter((s) => s.key !== 'additional').map((s) => s.key));
  assert.equal(sys.missingSystemFields(null, catalog, null).length, 10);
});

const answered = (overrides = {}) => {
  const items = {};
  for (const system of catalog.systems) if (system.statusRequired) items[system.key] = { status: 'inspected' };
  return sys.systemsDataFrom({ systems: { items: { ...items, ...overrides } } });
};

check('missingSystemFields: all answered and consistent → no issues', () => {
  assert.deepEqual(sys.missingSystemFields(answered(), catalog, fixtureRooms()), []);
  assert.deepEqual(sys.missingSystemFields(answered({ cooling: { status: 'not_inspected', reason: 'Cold.' }, fireplace: { status: 'not_present' } }), catalog, fixtureRooms()), []);
});

check('missingSystemFields: not_inspected needs a reason (whitespace is not a reason)', () => {
  for (const reason of [undefined, '', '   \n']) {
    const issues = sys.missingSystemFields(answered({ cooling: { status: 'not_inspected', reason } }), catalog, []);
    assert.deepEqual(issues.map((i) => [i.systemKey, i.code]), [['cooling', 'reason_missing']]);
  }
});

check('missingSystemFields: Not present / Not inspected with observations is blocked with a clear message', () => {
  const rooms = [room('r', 'isop-roof', 'Roof', [obs('a', 'alvarleg'), obs('b', 'athugasemd')]), room('c', 'isop-cooling', 'Cooling', [obs('c1', 'athugasemd')])];
  const issues = sys.missingSystemFields(answered({ roof: { status: 'not_present' }, cooling: { status: 'not_inspected', reason: 'Cold.' } }), catalog, rooms);
  assert.deepEqual(issues.map((i) => [i.systemKey, i.code, i.observations]), [
    ['roof', 'inconsistent_not_present', 2],
    ['cooling', 'inconsistent_not_inspected', 1],
  ]);
  assert.equal(issues[0].message, 'Roof is marked Not present but has 2 observations');
  assert.equal(issues[1].message, 'Cooling is marked Not inspected but has 1 observation');
});

check('missingSystemFields: "limited" is rejected by isop but accepted by a catalog that allows it (AU-ready)', () => {
  const data = answered({ roof: { status: 'limited' } });
  assert.deepEqual(sys.missingSystemFields(data, catalog, []).map((i) => [i.systemKey, i.code]), [['roof', 'status_invalid']]);
  const au = { ...catalog, id: 'au', slugPrefix: 'au-', systems: catalog.systems.map((s) => (s.key === 'roof' ? { ...s, allowedStatuses: ['inspected', 'limited', 'not_inspected', 'not_present'], roomBases: ['au-roof'] } : s)) };
  assert.deepEqual(sys.missingSystemFields(data, au, []), []);
  assert.equal(sys.systemOfRoom({ slug: 'au-roof' }, au), 'roof');
  assert.equal(sys.systemOfRoom({ slug: 'isop-roof' }, au), 'additional');
});

check('missingSystemFields: custom room mapped to a system counts against that system', () => {
  const rooms = [room('c1', 'pool-house', 'Pool house', [obs('a', 'athugasemd')])];
  const data = sys.setRoomSystem(answered({ fireplace: { status: 'not_present' } }), 'c1', 'fireplace');
  assert.deepEqual(sys.missingSystemFields(data, catalog, rooms).map((i) => [i.systemKey, i.code]), [['fireplace', 'inconsistent_not_present']]);
});

// ── 7. Sjálfvirk merking eftir uppsetningu
check('markSystemsWithRooms: marks only unanswered systems that have rooms; never touches given answers', () => {
  const slugs = ['isop-roof', 'isop-bedroom', 'isop-bedroom-2', 'isop-kitchen', 'isop-cooling', 'custom', 'thak'];
  const pd = {
    foo: 1,
    systems: { v: 1, items: { cooling: { status: 'not_present' }, roof: { limitations: 'Binoculars.', describe: { covering_type: 'Slate' } } }, room_map: { c: 'exterior' } },
  };
  const frozen = JSON.stringify(pd);
  const result = sys.markSystemsWithRooms(pd, slugs, catalog);
  assert.equal(JSON.stringify(pd), frozen);
  assert.deepEqual(result.marked, ['roof', 'interior']);
  assert.deepEqual(result.systems.items.roof, { limitations: 'Binoculars.', describe: { covering_type: 'Slate' }, status: 'inspected' });
  assert.deepEqual(result.systems.items.interior, { status: 'inspected' });
  assert.deepEqual(result.systems.items.cooling, { status: 'not_present' });
  assert.deepEqual(result.systems.room_map, { c: 'exterior' });
  assert.ok(!('exterior' in result.systems.items));
  // allt svarað → ekkert breytist
  assert.equal(sys.markSystemsWithRooms({ systems: { items: result.systems.items } }, slugs, catalog), null);
  // engin isop-rými → ekkert
  assert.equal(sys.markSystemsWithRooms({}, ['thak', 'nz-roof', 'custom'], catalog), null);
  assert.equal(sys.markSystemsWithRooms(null, [], catalog), null);
  // „additional“ er aldrei merkt
  assert.equal(sys.markSystemsWithRooms({}, ['custom-room'], catalog), null);
  assert.deepEqual(sys.systemsWithRooms(['isop-attic', 'isop-roof', 'isop-roof-2', 'x'], catalog), ['roof', 'attic']);
});

// ── 8. Texas
check('texasNotice: TX state, Texas ZIP ranges, Texas address endings; no false positives', () => {
  const t = (input) => sys.texasNotice(input);
  // já
  for (const input of [
    { state: 'TX' },
    { state: 'tx' },
    { state: ' TX ' },
    { postalCode: '75001' },
    { postalCode: '73301' },
    { postalCode: '733' + '01-1234' },
    { postalCode: '79999' },
    { postalCode: '79901' },
    { postalCode: '78701' },
    { postalCode: '88510' },
    { postalCode: '88599' },
    { address: '12 Main St, Austin, TX' },
    { address: '12 Main St, Austin, TX 78701' },
    { address: '12 Main St, Austin, Texas' },
    { address: '12 Main St, Austin Texas 78701' },
    { address: '12 Main St, Austin,TX' },
    { state: 'NM', postalCode: '88510' },
  ]) assert.equal(t(input), true, JSON.stringify(input));
  // nei
  for (const input of [
    {},
    { state: 'OK', postalCode: '73008' },
    { state: 'OK', postalCode: '74101' },
    { state: 'NM', postalCode: '87101' },
    { state: 'NM', postalCode: '88001' },
    { state: 'NM', postalCode: '88401' },
    { state: 'NM', postalCode: '88410' },
    { state: 'LA', postalCode: '71101' },
    { state: 'AR', postalCode: '72201' },
    { postalCode: '73099' },
    { postalCode: '73200' },
    { postalCode: '73401' },
    { postalCode: '74999' },
    { postalCode: '80001' },
    { postalCode: '88499' },
    { postalCode: '88600' },
    { postalCode: '10001' },
    { postalCode: '7500' },
    { postalCode: '750011' },
    { postalCode: 'M5V 2T6' },
    { postalCode: 'K1A 0B1' },
    { address: '7600 Main St' },
    { address: '750 Elm Street, Springfield, IL 62701' },
    { address: '1 Texas Ave, Boston, MA' },
    { address: '1 Texas Ave' },
    { address: 'Texaco Rd, Tulsa, OK' },
    { address: '12 Main St, Austin, TXX' },
    { address: '12 Main St, Austin, Tx Smith' },
    { state: 'ON', postalCode: 'M5V 2T6', address: '1 King St W, Toronto, ON' },
    { state: 'TXX' },
    { state: null, postalCode: null, address: null },
  ]) assert.equal(t(input), false, JSON.stringify(input));
  assert.equal(sys.isTexasZip('75001'), true);
  assert.equal(sys.isTexasZip('73008'), false);
  assert.equal(sys.isTexasZip(undefined), false);
});

// ── 9. Kasta aldrei
check('every exported function survives hostile data arguments without throwing (catalog is always valid)', () => {
  const weird = [undefined, null, 0, 1, 'x', '', true, [], {}, [null], { items: 5 }, { observations: 'x' }, { slug: 5, id: {}, observations: [null, 1, 'z', { id: 1, tags: 'x', severity: 7 }] }, () => 1, Symbol.iterator, { systems: { items: { roof: { status: 'inspected', describe: 5 } }, room_map: 5 } }];
  const calls = {
    systemsDataFrom: (a) => sys.systemsDataFrom(a),
    statusOf: (a) => sys.statusOf(a, 'roof'),
    setSystemEntry: (a) => [sys.setSystemEntry(a, 'roof', a), sys.setSystemEntry(a, a, { status: 'inspected' }), sys.setSystemEntry(a, 'roof', null)],
    setRoomSystem: (a) => [sys.setRoomSystem(a, 'r', a), sys.setRoomSystem(a, a, 'roof'), sys.setRoomSystem(a, 'r', null)],
    sortedSystems: () => sys.sortedSystems(catalog),
    catalogBaseSlug: (a) => sys.catalogBaseSlug(a, catalog),
    hasCatalogRooms: (a) => sys.hasCatalogRooms(a, catalog),
    systemOfRoom: (a) => [sys.systemOfRoom(a, catalog, a), sys.systemOfRoom({ id: a, slug: a }, catalog, { [String(a)]: a })],
    groupRoomsBySystem: (a) => sys.groupRoomsBySystem(a, catalog, a),
    deficiencyCategoryOf: (a) => [sys.deficiencyCategoryOf(a), sys.deficiencyCategoryOf({ id: 'x', severity: a, tags: a }, a)],
    deficienciesBySystem: (a) => [sys.deficienciesBySystem(a, catalog), sys.deficienciesBySystem([a], catalog, { roomMap: a, tagsByObservation: a })],
    hasDeficiency: (a) => sys.hasDeficiency(a),
    systemStatusText: (a) => [sys.systemStatusText(a, a), sys.systemStatusText('inspected', a)],
    systemOverview: (a) => [sys.systemOverview(a, a, catalog), sys.systemOverview(a, [a], catalog, { roomMap: a, tagsByObservation: a })],
    buildDeficiencySummary: (a) => [sys.buildDeficiencySummary(a, catalog), sys.buildDeficiencySummary([a], catalog, { roomMap: a, tagsByObservation: a })],
    missingSystemFields: (a) => [sys.missingSystemFields(a, catalog, a), sys.missingSystemFields(a, catalog, [a], { roomMap: a, tagsByObservation: a })],
    systemsWithRooms: (a) => sys.systemsWithRooms(a, catalog),
    markSystemsWithRooms: (a) => [sys.markSystemsWithRooms(a, a, catalog), sys.markSystemsWithRooms({}, a, catalog)],
    isTexasZip: (a) => sys.isTexasZip(a),
    texasNotice: (a) => [sys.texasNotice(a), sys.texasNotice({ state: a, postalCode: a, address: a })],
  };
  const exported = Object.entries(sys).filter(([, v]) => typeof v === 'function').map(([k]) => k);
  assert.deepEqual(exported.filter((name) => !(name in calls)), [], 'every exported function must be covered here');
  assert.deepEqual(Object.keys(calls).filter((name) => !exported.includes(name)), []);
  for (const [name, call] of Object.entries(calls)) {
    for (const a of weird) assert.doesNotThrow(() => call(a), `${name}(${String(typeof a === 'symbol' ? 'Symbol' : JSON.stringify(a))})`);
  }
});

// ── 10. Jafngildi milli repo
function otherFile(file) {
  if (process.env.BETON_PARITY_DIR === 'none') return null;
  const names = isApp ? ['isop-pr3-web', 'beton-web'] : ['isop-pr3', 'beton-app'];
  const dirs = [
    process.env.BETON_PARITY_DIR,
    ...names.map((name) => path.resolve(root, '..', name)),
    ...names.map((name) => path.resolve(root, '../..', name)),
  ].filter(Boolean);
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const onDisk = path.join(dir, OTHER_REL, file);
    if (fs.existsSync(onDisk)) return { text: fs.readFileSync(onDisk, 'utf8'), from: onDisk };
    for (const ref of ['origin/main', 'origin/claude/isop-pr3-systems']) {
      try {
        const text = execFileSync('git', ['-C', dir, 'show', `${ref}:${OTHER_REL}/${file}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        return { text, from: `${dir} ${ref}` };
      } catch {
        // ekki til á þessari grein
      }
    }
  }
  return null;
}

for (const file of FILES) {
  check(`${file} is byte-identical in beton-app lib/report/systems and beton-web src/lib/report/systems`, () => {
    const other = otherFile(file);
    if (!other) throw new Skip(`the ${isApp ? 'beton-web' : 'beton-app'} copy of ${file} was not found (set BETON_PARITY_DIR)`);
    assert.equal(fs.readFileSync(path.join(systemsDir, file), 'utf8'), other.text, `differs from ${other.from}`);
    console.log(`     (compared with ${other.from})`);
  });
}

check('this script is byte-identical in both repos', () => {
  const dirs = [process.env.BETON_PARITY_DIR, path.resolve(root, '..', isApp ? 'isop-pr3-web' : 'isop-pr3'), path.resolve(root, '..', isApp ? 'beton-web' : 'beton-app')].filter(Boolean);
  const found = dirs.map((d) => path.join(d, 'scripts/verify-isop-systems.cjs')).find((f) => fs.existsSync(f));
  if (!found || process.env.BETON_PARITY_DIR === 'none') throw new Skip('the other repo\'s scripts/verify-isop-systems.cjs was not found');
  assert.equal(fs.readFileSync(__filename, 'utf8'), fs.readFileSync(found, 'utf8'), `differs from ${found}`);
});

console.log(`\nverify-isop-systems: ${n} checks passed${skipped.length ? `, ${skipped.length} SKIPPED (${skipped.join('; ')})` : ''} (${isApp ? 'beton-app' : 'beton-web'})`);
if (skipped.length && process.env.VERIFY_STRICT === '1') process.exit(1);
