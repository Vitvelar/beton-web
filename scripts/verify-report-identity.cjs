/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script, like the other verify-*.cjs */
// Auðkennislás skýrslunnar: sha256 af renderToStaticMarkup RAUNVERULEGU skýrslusíðunnar
// (report/page.tsx) fyrir fjögur tilbúin gagnasöfn, borið saman við golden-hash sem var
// reiknað á origin/main 2370380 (beton-web #13). Sannar að breyting snertir hvorki Beton-
// skýrslur (admin.beton.is) né núverandi enskar skýrslur — bæti fyrir bæti.
//
//   node scripts/verify-report-identity.cjs                 # markup-hash (engin bygging)
//   REPORT_IDENTITY_PRINT=1 node scripts/verify-report-identity.cjs   # prentar ný hash (til að uppfæra GOLDEN)
//   REPORT_PIXELS=1 node scripts/verify-report-identity.cjs # + PDF um render-pdf.ts → pdftoppm -r 110 → PNG
//
// Pixlahamur þarf `next build` (raunverulegt CSS forritsins), Chrome og poppler (pdftoppm).
// PNG-golden er staðbundið (fer eftir Chrome/letri vélarinnar), ekki í git:
// REPORT_PIXELS_GOLDEN=<mappa> (sjálfgefið $TMPDIR/beton-report-pixels-golden). Tóm mappa →
// skráir golden (keyra fyrst á origin/main), annars bæta-samanburður hverrar síðu. Ef síða
// er ólík er hún borin saman aftur án fótar (neðstu 16 mm) svo fótbreyting greinist sér.
// Engin auðkenning, engin viðskiptavinagögn, ekkert AI-kall.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { renderReportMarkup, reportHtml, applicationCss, serveReports, loadRenderer, placeholderSvg } = require('./report-fixture.cjs');

// Golden: reiknað á origin/main 2370380 (src óbreytt í PR0). Uppfærist AÐEINS með
// meðvitaðri, skráðri breytingu (sjá PR-lýsingu þeirrar breytingar).
const GOLDEN = {
  'beton-is-standard:pdf': '0a5895fe107a72715a7db2c5263e344d252b0a28406fa8b18b2acb704edbc224',
  'beton-is-standard:web': '421cce1f54fafb714e17b36217e9885c556780d664658e994b1246104ed6fa3e',
  'vitvelar-is:pdf': '323a8e28ac0f744a0c356b3b7686764d708688c6f037bff58cafeb274028cf0e',
  'vitvelar-is:web': 'ee69052328ffb76122bb34f67b7da631404de854eac163e60528b4e8a9f3f6fc',
  'en-standard:pdf': '6f1fb7589295c172710cad2def3ed07d8d989dbc5e87a90e7eabca22e8c135cd',
  'en-standard:web': '48372f7840563aef0ac5968e24a66db6ed95a1a42ca686205ee27f084eb99aec',
  'en-condition_1_3:pdf': '22d0ac6dbf06f1fdce71c4056f0fd00003f411e59f74ccd6343367c1436ee5aa',
  'en-condition_1_3:web': '79c52f8aa82ac521f4f3f07066013e4b2f638289898a5529c99fba894699511e',
};

const sha = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

// ── Tilbúin gögn ────────────────────────────────────────────────────────────
function photo(id, storagePath, { room = null, obs = null, cover = false, sort = 0, caption = null } = {}) {
  return { id, storage_path: storagePath, photo_type: 'normal', caption, is_cover: cover, sort_order: sort, room_id: room, observation_id: obs };
}

// Herbergi: { id, name, slug, ratings, notes, obs: [{ id, category, title, description, suggestion, severity, photos }], photos }
function makeRecord({ id, locale, scheme, inspectors, inspection, summary, rooms }) {
  const reportRooms = rooms.map((r, i) => ({
    name: r.name, slug: r.slug, sort_order: i, ratings: r.ratings ?? {}, notes: r.notes ?? '',
    observations: r.obs.map((o, j) => ({ id: o.id, number: `${i + 2}.${j + 1}`, category: o.category, title: o.title, description: o.description, suggestion: o.suggestion, severity: o.severity })),
  }));
  const ai = { inspection, ai_summary: summary, rooms: reportRooms };
  if (locale) ai.report_locale = locale;
  if (scheme) ai.rating_scheme = scheme;
  return {
    id, local_id: `local-${id}`, ...inspection, ai_report_data: ai, ai_summary: summary.conclusion.split('.')[0],
    ai_cost_usd: 0, ai_model: 'fixture', report_generated_at: '2026-09-22T09:30:00Z',
    inspectors,
    rooms: rooms.map((r, i) => ({
      id: r.id, name: r.name, slug: r.slug, sort_order: i, ratings: r.ratings ?? {}, notes: r.notes ?? '',
      photos: r.photos ?? [],
      observations: r.obs.map((o, j) => ({ id: o.id, observation_number: `${i + 2}.${j + 1}`, category: o.category, title: o.title, description: o.description, suggestion: o.suggestion, severity: o.severity, sort_order: j, photos: o.photos ?? [] })),
    })),
  };
}

const IS_INSPECTION = {
  address: 'Þórsgata 1 — PRÓFUN', postal_code: '101', municipality: 'Reykjavík', fastanumer: '200-0000',
  customer_name: 'Prófun Prófsdóttir', inspection_date: '2026-09-21', weather: 'Þurrt, 8°C', attendees: ['Prófun Prófsdóttir', 'Fasteignasali'],
  property_data: { tegund: 'Einbýlishús', staerd_m2: 182.4, byggingarar: 1974, byggingarafangi: '7' }, lookup_failed: false,
};
const IS_SUMMARY = {
  introduction: 'Ástandsskoðun fór fram 21.09.2026. Tilbúin prófunargögn — engin raunveruleg eign.',
  property_description: 'Einbýlishús á einni hæð, byggt 1974, steypt með timburþaki.',
  conclusion: 'Viðhaldsþörfin snýr helst að þaki og votrými. Yfirfara þarf þéttingar til að draga úr hættu á vatnságangi. Ekki liggja fyrir mælingar sem staðfesta leka.',
};
function isRooms(prefix) {
  return [
    { id: `${prefix}r1`, name: 'Eldhús', slug: 'eldhus', ratings: { golfefni: 'ok', veggir: 'warn', loft: 'ok', skapar: 'danger', vaskur: 'na' }, notes: 'Innrétting upprunaleg.',
      photos: [photo(`${prefix}p1`, `${prefix}/eldhus-1.svg`, { room: `${prefix}r1`, cover: true }), photo(`${prefix}p2`, `${prefix}/eldhus-2.svg`, { room: `${prefix}r1`, sort: 1 })],
      obs: [
        { id: `${prefix}o1`, category: 'Skápar', title: 'Lamir á skápum slitnar', description: 'Lamir á efri skápum eru slitnar og hurðir síga. Áá Éé Íí Óó Úú Ýý Þþ Ðð Ææ Öö.', suggestion: 'Skipta um lamir.', severity: 'athugasemd',
          photos: [photo(`${prefix}p3`, `${prefix}/eldhus-o1.svg`, { obs: `${prefix}o1` })] },
        { id: `${prefix}o2`, category: 'Lagnir', title: 'Raki undir vaski', description: 'Rakablettur í botni skáps undir vaski.', suggestion: '', severity: 'alvarleg' },
      ] },
    { id: `${prefix}r2`, name: 'Baðherbergi', slug: 'badherbergi', ratings: { flisar: 'danger', nidurfall: 'mjog_alvarleg', loftraesting: 'warn' },
      obs: [
        { id: `${prefix}o3`, category: 'Raki', title: 'Raki í vegg við sturtu', description: 'Rakamæling sýnir hækkuð gildi neðst í vegg við sturtu.', suggestion: 'Kalla til sérfræðing og opna vegg.', severity: 'mjog_alvarleg',
          photos: [photo(`${prefix}p4`, `${prefix}/bad-o3a.svg`, { obs: `${prefix}o3` }), photo(`${prefix}p5`, `${prefix}/bad-o3b.svg`, { obs: `${prefix}o3`, sort: 1 })] },
      ] },
    { id: `${prefix}r3`, name: 'Þak', slug: 'thak', ratings: { thakefni: 'warn', rennur: 'danger' },
      obs: [
        { id: `${prefix}o4`, category: 'Þak', title: 'Þak og þétting', description: 'Þéttingar við þakkant eru sprungnar.', suggestion: 'Yfirfara þéttingar við þak.', severity: 'alvarleg' },
      ] },
    { id: `${prefix}r4`, name: 'Geymsla', slug: 'geymsla', ratings: {}, obs: [] },
  ];
}

const EN_INSPECTION = {
  ...IS_INSPECTION, address: '7 Test Lane — FIXTURE', municipality: 'Testville', customer_name: 'Pat Fixture', weather: 'Dry, 12°C', attendees: ['Pat Fixture'],
  property_data: { tegund: 'Detached house', staerd_m2: 140, byggingarar: 1988 },
};
const EN_SUMMARY = {
  introduction: 'The inspection took place on 21.09.2026. Synthetic fixture data — not a real property.',
  property_description: 'Two-storey detached house built in 1988, timber frame with a concrete tile roof.',
  conclusion: 'Maintenance needs relate mainly to the roof and the bathroom. Seals should be renewed to reduce the risk of water ingress. No readings confirm an active leak.',
};
function enRooms(prefix) {
  return [
    { id: `${prefix}r1`, name: 'Kitchen', slug: 'kitchen', ratings: { golfefni: 'ok', veggir: 'warn', skapar: 'danger', isskapur: 'na' }, notes: 'Original cabinetry.',
      photos: [photo(`${prefix}p1`, `${prefix}/kitchen-1.svg`, { room: `${prefix}r1`, cover: true })],
      obs: [
        { id: `${prefix}o1`, category: 'Skápar', title: 'Worn cabinet hinges', description: 'Upper cabinet hinges are worn and doors sag.', suggestion: 'Replace the hinges.', severity: 'athugasemd',
          photos: [photo(`${prefix}p2`, `${prefix}/kitchen-o1.svg`, { obs: `${prefix}o1` })] },
      ] },
    { id: `${prefix}r2`, name: 'Bathroom', slug: 'bathroom', ratings: { flisar: 'danger', nidurfall: 'mjog_alvarleg', gufutaeki: 'warn' }, notes: '',
      obs: [
        { id: `${prefix}o2`, category: 'Raki', title: 'Damp at base of shower wall', description: 'Elevated moisture at the base of the wall beside the shower.', suggestion: 'Have a specialist carry out invasive testing.', severity: 'mjog_alvarleg',
          photos: [photo(`${prefix}p3`, `${prefix}/bath-o2.svg`, { obs: `${prefix}o2` })] },
        { id: `${prefix}o3`, category: 'Flísar', title: 'Cracked floor tiles', description: 'Two floor tiles are cracked near the vanity.', suggestion: 'Replace the cracked tiles and regrout.', severity: 'alvarleg' },
      ] },
    { id: `${prefix}r3`, name: 'Roof', slug: 'roof', ratings: { thakefni: 'warn', rennur: 'danger', nidurfollum: 'ok' },
      obs: [
        { id: `${prefix}o4`, category: 'Þakefni', title: 'Slipped roof tiles', description: 'Several tiles have slipped on the north slope.', suggestion: 'Re-fix the slipped tiles.', severity: 'alvarleg' },
        { id: `${prefix}o5`, category: 'Niðurföll', title: 'Downpipe disconnected', description: 'The rear downpipe is disconnected at the base.', suggestion: '', severity: 'athugasemd' },
      ] },
    { id: `${prefix}r4`, name: 'Garage', slug: 'garage', ratings: { bilskurshurd: 'ok' }, obs: [] },
  ];
}

const BETON_ROW = { full_name: 'Bragi Michaelsson', company_name: 'Beton ehf.', company_logo_url: null, company_terms_url: null, company_terms_text: null };
const VITVELAR_ROW = { full_name: 'Prófun Skoðunarmaður', company_name: 'Vitvélar ehf.', company_logo_url: null, company_terms_url: 'https://example.com/terms', company_terms_text: 'Okkar eigin skilmálar.\nAnnar liður.' };

const FIXTURES = {
  'beton-is-standard': makeRecord({ id: 'fx-beton', inspectors: BETON_ROW, inspection: IS_INSPECTION, summary: IS_SUMMARY, rooms: isRooms('b') }),
  'vitvelar-is': makeRecord({ id: 'fx-vitvelar-is', locale: 'is', scheme: 'standard', inspectors: VITVELAR_ROW, inspection: IS_INSPECTION, summary: IS_SUMMARY, rooms: isRooms('v') }),
  'en-standard': makeRecord({ id: 'fx-en-standard', locale: 'en', scheme: 'standard', inspectors: VITVELAR_ROW, inspection: EN_INSPECTION, summary: EN_SUMMARY, rooms: enRooms('e') }),
  'en-condition_1_3': makeRecord({ id: 'fx-en-cond', locale: 'en', scheme: 'condition_1_3', inspectors: { ...VITVELAR_ROW, company_terms_url: null }, inspection: EN_INSPECTION, summary: EN_SUMMARY, rooms: enRooms('c') }),
};
// Rýmismyndir / athugasemdamyndir: staðgenglar (SVG), aldrei raunmyndir.
const PHOTOS = {};
for (const record of Object.values(FIXTURES)) {
  for (const room of record.rooms) {
    for (const p of [...room.photos, ...room.observations.flatMap(o => o.photos)]) {
      PHOTOS[p.storage_path] = { type: 'image/svg+xml', body: placeholderSvg(p.storage_path, { fill: p.is_cover ? '#6b7f8e' : '#9aa5b1' }) };
    }
  }
}

async function markups() {
  const out = {};
  for (const [name, record] of Object.entries(FIXTURES)) {
    out[`${name}:pdf`] = await renderReportMarkup(record, { pdf: true });
    out[`${name}:web`] = await renderReportMarkup(record, { pdf: false });
  }
  return out;
}

async function main() {
  const output = process.env.REPORT_TEST_OUTPUT || path.join(os.tmpdir(), 'beton-report-identity');
  fs.mkdirSync(output, { recursive: true });
  const all = await markups();
  const hashes = Object.fromEntries(Object.entries(all).map(([k, v]) => [k, sha(v)]));
  for (const [k, v] of Object.entries(all)) fs.writeFileSync(path.join(output, `${k.replace(':', '.')}.html`), v);
  if (process.env.REPORT_IDENTITY_PRINT === '1') console.log(JSON.stringify(hashes, null, 2));

  // Hreinlætisathuganir: hvert gagnasafn sýnir það sem það á að prófa.
  assert.ok(all['beton-is-standard:pdf'].includes('Greitt er fyrir ástandsskoðun ásamt skýrslu'), 'Beton keeps its own terms');
  assert.ok(all['vitvelar-is:pdf'].includes('Takmarkanir skoðunar') && !all['vitvelar-is:pdf'].includes('Takmörkun ábyrgðar'), 'Vitvélar: neutral limitations, never Beton terms');
  assert.ok(all['en-standard:pdf'].includes('Limitations of this inspection') && all['en-standard:pdf'].includes('Very serious'), 'en/standard labels');
  assert.ok(all['en-condition_1_3:pdf'].includes('Condition rating 3') && all['en-condition_1_3:pdf'].includes('Action list'), 'en/condition_1_3 labels + action list');
  for (const k of Object.keys(all)) assert.ok(all[k].includes('/fixture-photos/'), `${k} renders photos`);

  const missing = Object.keys(hashes).filter(k => !GOLDEN[k]);
  assert.deepEqual(missing, [], `no golden hash for ${missing.join(', ')} (REPORT_IDENTITY_PRINT=1 prints them)`);
  const changed = Object.keys(hashes).filter(k => hashes[k] !== GOLDEN[k]);
  assert.deepEqual(changed, [], `report markup changed for ${changed.join(', ')} — compare ${output}/*.html with the same files rendered on origin/main`);
  console.log(`PASS report markup identical to origin/main golden for ${Object.keys(hashes).length} renders: ${Object.keys(FIXTURES).join(', ')} × (pdf=1, web)`);

  if (process.env.REPORT_PIXELS === '1') await pixels(all, output);
}

async function pixels(all, output) {
  try { execFileSync('pdftoppm', ['-v'], { stdio: 'ignore' }); } catch { throw new Error('REPORT_PIXELS=1 needs poppler (pdftoppm)'); }
  const golden = process.env.REPORT_PIXELS_GOLDEN || path.join(os.tmpdir(), 'beton-report-pixels-golden');
  fs.mkdirSync(golden, { recursive: true });
  const css = applicationCss();
  const pages = Object.fromEntries(Object.keys(FIXTURES).map(name => [name, reportHtml(all[`${name}:pdf`], css)]));
  const server = await serveReports(pages, { photos: PHOTOS });
  const renderer = loadRenderer();
  const raster = (pdf, prefix, extra = []) => {
    execFileSync('pdftoppm', ['-r', '110', '-png', ...extra, pdf, prefix]);
    const dir = path.dirname(prefix), base = path.basename(prefix);
    return fs.readdirSync(dir).filter(f => f.startsWith(base + '-') && f.endsWith('.png')).sort();
  };
  // A4 við 110 dpi ≈ 911×1287 px; fótur puppeteer er í neðstu 16 mm (≈ 69 px).
  const BODY = ['-x', '0', '-y', '0', '-H', '1210'];
  const results = [];
  try {
    for (const name of Object.keys(FIXTURES)) {
      const dir = path.join(output, 'pixels', name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
      const pdf = path.join(dir, `${name}.pdf`);
      fs.writeFileSync(pdf, await renderer.renderReportPdf(server.url(name), pixelRenderOptions(name)));
      const pngs = raster(pdf, path.join(dir, 'page'));
      const gdir = path.join(golden, name);
      if (!fs.existsSync(path.join(gdir, `${name}.pdf`))) {
        fs.mkdirSync(gdir, { recursive: true }); fs.copyFileSync(pdf, path.join(gdir, `${name}.pdf`));
        for (const f of pngs) fs.copyFileSync(path.join(dir, f), path.join(gdir, f));
        results.push(`RECORDED ${name}: ${pngs.length} pages → ${gdir}`);
        continue;
      }
      const gpngs = fs.readdirSync(gdir).filter(f => f.endsWith('.png')).sort();
      assert.equal(pngs.length, gpngs.length, `${name}: page count ${pngs.length} ≠ golden ${gpngs.length}`);
      const diff = pngs.filter(f => !fs.readFileSync(path.join(dir, f)).equals(fs.readFileSync(path.join(gdir, f))));
      if (!diff.length) { results.push(`PASS ${name}: ${pngs.length} pages pixel-identical`); continue; }
      // Ólíkar síður: bera saman án fótar (neðstu 16 mm) til að greina fótbreytingu frá öðru.
      const cur = raster(pdf, path.join(dir, 'body'), BODY);
      fs.mkdirSync(path.join(dir, 'golden-body'), { recursive: true });
      const old = raster(path.join(gdir, `${name}.pdf`), path.join(dir, 'golden-body', 'body'), BODY);
      const bodyDiff = cur.filter((f, i) => !fs.readFileSync(path.join(dir, f)).equals(fs.readFileSync(path.join(dir, 'golden-body', old[i]))));
      results.push(bodyDiff.length
        ? `FAIL ${name}: ${diff.length}/${pngs.length} pages differ, body differs on ${bodyDiff.join(', ')} (see ${dir})`
        : `FOOTER-ONLY ${name}: ${diff.length}/${pngs.length} pages differ only in the page footer (bottom 16 mm); body pixel-identical`);
    }
  } finally { await server.close(); }
  for (const r of results) console.log(r);
  const allowFooter = new Set((process.env.REPORT_PIXELS_ALLOW_FOOTER || '').split(',').filter(Boolean));
  const bad = results.filter(r => r.startsWith('FAIL') || (r.startsWith('FOOTER-ONLY') && !allowFooter.has(r.split(' ')[1].replace(':', ''))));
  assert.deepEqual(bad, [], 'pixel differences');
}

// Sama val og framleiðslan (worker tick) gerir á fótartexta, ef render-pdf.ts styður það.
function pixelRenderOptions() { return {}; }

main().catch(error => { console.error(error); process.exitCode = 1; });
