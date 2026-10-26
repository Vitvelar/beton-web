/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script, like the other verify-*.cjs */
// Heiti matsþátta og rýmissniðmát ÚR APPINU (beton-app) — uppspretta src/lib/report/app-rating-labels.ts og
// scripts/app-room-elements.json. Vefurinn notar þau AÐEINS til að þekkja titla athugasemda (rating-findings.ts).
//
//   APP_REPO=<beton-app> node scripts/app-rating-labels-sync.cjs           # ber saman (hætt með villu ef ósamræmi)
//   APP_REPO=<beton-app> node scripts/app-rating-labels-sync.cjs --write   # endurskrifar báðar skrárnar
//
// beton-app scripts/verify-report-label-fingerprint.cjs fellur ef heitin breytast í appinu og vísar hingað.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const TS_FILE = path.join(ROOT, 'src/lib/report/app-rating-labels.ts');
const ROOMS_FILE = path.join(ROOT, 'scripts/app-room-elements.json');

function loadApp(appRoot, file, extra = '') {
  const m = { exports: {} };
  const out = ts.transpileModule(fs.readFileSync(path.join(appRoot, file), 'utf8') + extra, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('module', 'exports', 'require', out)(m, m.exports, () => ({}));
  return m.exports;
}

/** { isop, en, is, rooms } úr appinu: isop-heiti, ensk heiti (labels.ts), íslensk heiti eftir lykli, matsþættir hvers sniðmáts. */
function extractAppLabels(appRoot) {
  const c = loadApp(appRoot, 'lib/utils/constants.ts', '\nexport const __OVR = ROOM_RATING_OVERRIDES;');
  const isopEl = loadApp(appRoot, 'lib/report/isop-elements.ts');
  const nzEl = loadApp(appRoot, 'lib/report/nz-elements.ts');
  const labels = loadApp(appRoot, 'lib/i18n/labels.ts', '\nexport const __EN = RATING_CATEGORY_EN;');
  const is = {};
  const rooms = {};
  const add = (list) => { for (const r of list) { is[r.key] ??= []; if (!is[r.key].includes(r.label)) is[r.key].push(r.label); } };
  for (const [slug, list] of Object.entries(c.__OVR)) { add(list); rooms[slug] = list.map((r) => r.key); }
  const fallback = c.getRatingCategoriesForRoom('__unknown__');
  add(fallback);
  rooms['*'] = fallback.map((r) => r.key);
  for (const [slug, v] of Object.entries(nzEl.NZ_ROOMS)) rooms[slug] = [...v.ratings];
  for (const [slug, v] of Object.entries(isopEl.ISOP_ROOMS)) rooms[slug] = [...v.ratings];
  return { isop: { ...isopEl.ISOP_RATING_LABELS }, en: { ...labels.__EN }, is, rooms };
}

function renderTs({ isop, en, is }) {
  const q = (s) => JSON.stringify(s);
  let out = `// Heiti matsþátta EINS OG APPIÐ GEYMIR ÞAU í titlum athugasemda (flýtiblaðið: „<heiti> — <alvarleiki>“).
// MYNDAÐ úr beton-app með scripts/app-rating-labels-sync.cjs --write (lib/report/isop-elements.ts ISOP_RATING_LABELS,
// lib/i18n/labels.ts RATING_CATEGORY_EN, lib/utils/constants.ts ROOM_RATING_OVERRIDES / getRatingCategoriesForRoom).
// Notað AÐEINS til að þekkja titla í src/lib/report/rating-findings.ts — birting skýrslunnar notar áfram heiti vefsins.

/** isop: app-heiti (vefurinn birtir sum öðruvísi, t.d. „Gutters & downspouts“ á móti „Gutters and downspouts“). */
export const APP_ISOP_RATING_LABELS: Readonly<Record<string, string>> = {\n`;
  for (const [k, v] of Object.entries(isop)) out += `  ${k}: ${q(v)},\n`;
  out += `};\n\n/** Ensk heiti appsins (titlar á ensku utan NZ/isop-sniðmáta). */\nexport const APP_EN_RATING_LABELS: Readonly<Record<string, string>> = {\n`;
  for (const [k, v] of Object.entries(en)) out += `  ${k}: ${q(v)},\n`;
  out += `};\n\n/** Íslensk heiti (Beton-sniðmát; appið notar þau í titlum þegar skýrslutungumál er óþekkt). Sami lykill getur haft fleiri en eitt heiti eftir rými. */\nexport const APP_IS_RATING_LABELS: Readonly<Record<string, readonly string[]>> = {\n`;
  for (const [k, v] of Object.entries(is)) out += `  ${k}: [${v.map(q).join(', ')}],\n`;
  out += `};\n`;
  return out;
}

function renderRooms({ rooms }) {
  return '{\n' + Object.entries(rooms).map(([slug, keys]) => `  ${JSON.stringify(slug)}: ${JSON.stringify(keys)}`).join(',\n') + '\n}\n';
}

if (require.main === module) {
  const appRoot = process.env.APP_REPO;
  if (!appRoot) { console.error('Set APP_REPO=<beton-app checkout>'); process.exit(2); }
  const data = extractAppLabels(path.resolve(appRoot));
  const want = { [TS_FILE]: renderTs(data), [ROOMS_FILE]: renderRooms(data) };
  if (process.argv.includes('--write')) {
    for (const [f, body] of Object.entries(want)) fs.writeFileSync(f, body);
    console.log('wrote', Object.keys(want).map((f) => path.relative(ROOT, f)).join(', '));
  } else {
    const stale = Object.entries(want).filter(([f, body]) => !fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== body).map(([f]) => path.relative(ROOT, f));
    if (stale.length) { console.error(`STALE vs ${appRoot}: ${stale.join(', ')} — run with --write`); process.exit(1); }
    console.log(`PASS app labels in sync with ${appRoot}`);
  }
}

module.exports = { extractAppLabels, renderTs, renderRooms, TS_FILE, ROOMS_FILE };
