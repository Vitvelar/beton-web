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
const { load, renderReportMarkup, reportHtml, applicationCss, serveReports, loadRenderer, placeholderSvg } = require('./report-fixture.cjs');

// Golden: reiknað á origin/main 2370380 (src óbreytt í PR0). Uppfærist AÐEINS með
// meðvitaðri, skráðri breytingu (sjá PR-lýsingu þeirrar breytingar).
// 2026-10-19 (UX-umferð W3a): hnapparöðin EFST á skýrslusíðunni (ReportNav, utan
// <article>) fékk nýja hnappa/skilaboð; <article> og allt sem á eftir kemur er bæti fyrir
// bæti eins og á origin/claude/ux-pass (borið saman við hreint tré).
const GOLDEN = {
  'beton-is-standard:pdf': '935163321eaa1a012b9bd46bbc34f9401caa4190a413c78947d5a2e0d767c591',
  'beton-is-standard:web': '2057822a7ddb7308436292fbb862c24c2e62de592ab08dfcaa391d5d63e376b4',
  'vitvelar-is:pdf': '19f8aab5f90a0259340b4db4e4b49ba8c90561c022e24612fc8bac513520f7ed',
  'vitvelar-is:web': 'df34b4bf23ccee29137daea61a0e1ee4964106f238b3a91b10ece1fa8de812bc',
  'en-standard:pdf': '18f44223f56f5cb78a5eca93688ffae456c7f51e858993434c03375a8cd12d0d',
  'en-standard:web': '13f8df529a43d7f0a7a47cb1f6cc4cb6d2a35cae4ef70b874ba21053a85f2f3a',
  'en-condition_1_3:pdf': 'b5a586f2e414e628559b1e554c2cee98acaea2f5dc4b588bf8c56336e2cc6db2',
  'en-condition_1_3:web': '0330e3be3aa2b53cf76c94a4ed12a0d03b743c4654496e90819c0fe7355a5242',
};

// isop-golden (nýtt snið, vef PR W2): markup tilbúnu sýnisskoðunarinnar (scripts/isop-sample/), reiknað þegar sniðið var
// smíðað. EKKI hluti af 8 hash-unum hér að ofan — þeir eru óbreyttir. Breytist aðeins með meðvitaðri breytingu á sniðinu
// (skráð í PR-lýsingu þeirrar breytingar).
// Endurpinnað 2026-10-24 (sameining við origin/main 942b022, UX-yfirferð #53): AÐEINS stjórnhnappastikan efst
// (ReportNav, `print:hidden`, sama og venjulega sniðið og NZS 4306 fá) breyttist; meginmál skýrslunnar bæti-eins.
const GOLDEN_ISOP = {
  'isop-us:pdf': '4dbb6eb7ab07e04587d5947b6cdc8b9ba90a88afd43d98de25c89be29b438e53',
  'isop-us:web': '0b662d0e84b36223a2baddd7b8744e870e4dab754fcf4f22f9991f80dec1a961',
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

  // isop-sniðið (nýtt): eigin golden; engin áhrif á hash-in að ofan.
  {
    const { buildIsopSampleRecord } = require('./isop-sample/sample-inspection.cjs');
    const opts = { dashboardLocale: 'en', brand: 'rondva' };
    const isop = {
      'isop-us:pdf': await renderReportMarkup(buildIsopSampleRecord(), { pdf: true, ...opts }),
      'isop-us:web': await renderReportMarkup(buildIsopSampleRecord(), { pdf: false, ...opts }),
    };
    const isopHashes = Object.fromEntries(Object.entries(isop).map(([k, v]) => [k, sha(v)]));
    for (const [k, v] of Object.entries(isop)) fs.writeFileSync(path.join(output, `${k.replace(':', '.')}.html`), v);
    if (process.env.REPORT_IDENTITY_PRINT === '1') console.log(JSON.stringify(isopHashes, null, 2));
    assert.deepEqual(isopHashes, GOLDEN_ISOP, 'isop sample markup changed — compare ' + output + '/isop-us.*.html (REPORT_IDENTITY_PRINT=1 prints the hashes)');
    console.log('PASS isop golden: sample report markup (pdf=1, web) unchanged');
  }

  // nz_terms (NZ-matsorð) á venjulegu sniði: aðeins heitin breytast, ekkert golden.
  const nzRecord = JSON.parse(JSON.stringify(FIXTURES['en-standard']));
  nzRecord.ai_report_data.rating_scheme = 'nz_terms';
  const nz = await renderReportMarkup(nzRecord, { pdf: true });
  for (const word of ['Satisfactory', 'Maintenance', 'Defect', 'Significant defect']) assert.ok(nz.includes(`>${word}<`), `nz_terms shows ${word}`);
  assert.ok(!nz.includes('>Very serious<') && !nz.includes('>Minor<'), 'nz_terms replaces the standard words');
  console.log('PASS nz_terms stamp: Satisfactory / Maintenance / Defect / Significant defect replace the standard words');

  await englishVariants(all, output);

  if (process.env.REPORT_PIXELS === '1') await pixels(all, output);
}

// Enskt afbrigði (Phase 1, plan/rondva/ENSK-AFBRIGDI-HONNUN.md). Enginn, ógildur eða 'en' stimpill,
// og stimpill á íslenskri skýrslu → markup BÆTI FYRIR BÆTI eins og golden. Þekkt afbrigði → markup
// er golden-markup með AÐEINS þessum skiptum: dagsetning á forsíðu og í eignatöflu, „Report created“,
// og fyrir en-US stærð „m² (ft²)“ + „mould“ → „mold“. AI-texti (inngangur o.fl.) er aldrei snertur.
const VARIANT_DATES = {
  'en-NZ': ['21/9/2026', '22/9/2026'], 'en-AU': ['21/9/2026', '22/9/2026'], 'en-GB': ['21/9/2026', '22/9/2026'],
  'en-IE': ['21/9/2026', '22/9/2026'], 'en-US': ['9/21/2026', '9/22/2026'], 'en-CA': ['2026-09-21', '2026-09-22'],
};
function withStamp(name, stamp) {
  const record = JSON.parse(JSON.stringify(FIXTURES[name]));
  record.ai_report_data.english_variant = stamp;
  return record;
}
function expectedVariantMarkup(golden, variant) {
  const [inspected, created] = VARIANT_DATES[variant];
  const swap = (text, from, to, count) => {
    const parts = text.split(from);
    assert.equal(parts.length - 1, count, `${variant}: expected ${count}× ${from}`);
    return parts.join(to);
  };
  let out = swap(golden, '>21.09.2026</p>', `>${inspected}</p>`, 1);          // forsíða
  // 2026-10-26 (LANDAVAL §7): stimpluð afbrigði fá staðsetningarlínu eftir landi („Location“; US/CA/AU „Town, ST zip“,
  // önnur „Town zip“) í stað „Postcode: <zip> <town>“. Fixtúran hefur ekkert fylki. „en“ og íslenska snerta þetta ekki.
  out = swap(out, '>Postcode</td>', '>Location</td>', 1);
  out = swap(out, '>101 Testville</td>', ['en-US', 'en-CA', 'en-AU'].includes(variant) ? '>Testville, 101</td>' : '>Testville 101</td>', 1);
  out = swap(out, '>21.09.2026</td>', `>${inspected}</td>`, 1);              // eignatafla
  out = swap(out, 'Report created 22.09.2026<', `Report created ${created}<`, 1);
  if (variant === 'en-US') {
    out = swap(out, '>140 m²</td>', '>140 m² (1,507 ft²)</td>', 1);
    out = swap(out, 'mould', 'mold', 1);
  }
  return out;
}
async function englishVariants(all, output) {
  let checks = 0;
  for (const stamp of [undefined, null, 'en', 'en-us', 'EN-US', 'en-ZA', 'en_GB', 42]) {
    for (const name of ['en-standard', 'en-condition_1_3']) for (const pdf of [true, false]) {
      const html = await renderReportMarkup(withStamp(name, stamp), { pdf });
      assert.equal(sha(html), GOLDEN[`${name}:${pdf ? 'pdf' : 'web'}`], `${name} with english_variant=${JSON.stringify(stamp)} must equal golden`);
      checks++;
    }
  }
  for (const stamp of ['en-US', 'en-GB', 'en-NZ']) for (const name of ['beton-is-standard', 'vitvelar-is']) for (const pdf of [true, false]) {
    const html = await renderReportMarkup(withStamp(name, stamp), { pdf });
    assert.equal(sha(html), GOLDEN[`${name}:${pdf ? 'pdf' : 'web'}`], `${name} (is) ignores english_variant=${stamp}`);
    checks++;
  }
  // NZS 4306-sniðið (edge stimplar en-NZ á NZ-skýrslur): stimpillinn breytir engu þar (NZ-snið óbreytt).
  {
    const { buildNzSampleRecord } = require('./nz-sample/sample-inspection.cjs');
    const opts = { pdf: true, dashboardLocale: 'en', brand: 'rondva' };
    const plainNz = await renderReportMarkup(buildNzSampleRecord(), opts);
    for (const stamp of ['en-NZ', 'en-US', 'en-CA']) {
      const rec = buildNzSampleRecord(); rec.ai_report_data.english_variant = stamp;
      assert.equal(await renderReportMarkup(rec, opts), plainNz, `NZS 4306 ignores english_variant=${stamp}`);
      checks++;
    }
  }
  // Staðsetningarlína með fylki (property_data.state): „Denver, CO 80202“ (en-US) — og hún sést ekki í íslenskri skýrslu.
  {
    const us = withStamp('en-standard', 'en-US');
    for (const part of [us.ai_report_data.inspection, us]) { part.postal_code = '80202'; part.municipality = 'Denver'; }
    us.ai_report_data.inspection.property_data = { ...us.ai_report_data.inspection.property_data, state: 'CO' };
    const html = await renderReportMarkup(us, { pdf: true });
    assert.ok(html.includes('>Location</td><td class="py-1.5 text-ink">Denver, CO 80202</td>'), 'en-US shows Town, ST ZIP under Location');
    assert.ok(!html.includes('>Postcode</td>'), 'en-US no longer shows the Postcode row');
    checks++;
  }
  const dir = path.join(output, 'variants'); fs.mkdirSync(dir, { recursive: true });
  for (const variant of Object.keys(VARIANT_DATES)) for (const name of ['en-standard', 'en-condition_1_3']) for (const pdf of [true, false]) {
    const key = `${name}:${pdf ? 'pdf' : 'web'}`;
    const html = await renderReportMarkup(withStamp(name, variant), { pdf });
    fs.writeFileSync(path.join(dir, `${name}.${variant}.${pdf ? 'pdf' : 'web'}.html`), html);
    assert.equal(html, expectedVariantMarkup(all[key], variant), `${key} ${variant}: only dates/size/spelling may differ`);
    assert.ok(html.includes('The inspection took place on 21.09.2026.'), 'AI text untouched');
    checks++;
  }
  console.log(`PASS English variant: no/invalid/'en' stamp and stamped Icelandic reports == golden; NZS 4306 unchanged by the stamp; en-NZ/AU/GB/IE/US/CA differ only in dates, en-US size (ft²), spelling and the per-country Location line (${checks} renders)`);
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

// Sama val og framleiðslan (worker tick) gerir á fótartexta: „Bls.“ á íslensku, „Page“ annars.
// Meðvituð breyting í NZ-sniði (vefur) 3/3: enskar skýrslur fá „Page“ í fót í stað „Bls.“ —
// markup-hash breytist ekki (fóturinn er í puppeteer-sniðmáti), aðeins fótur PDF-síðnanna:
// REPORT_PIXELS_ALLOW_FOOTER=en-standard,en-condition_1_3 við samanburð við golden úr main.
// NZ-sniðið 4/PR 1: ensk skýrsla fær líka fyrirtækisnafn í fót („{Company} · Page n of N“) — sami fyrirvari.
function pixelRenderOptions(name) {
  const { reportCopy, reportLocaleOf } = load('src/lib/report/i18n.ts');
  // Sama og tick-leiðin: fyrirtækisnafn í fæti aðeins á skýrslum sem eru ekki íslenskar („{Company} · Page n of N“).
  const copy = reportCopy(reportLocaleOf(FIXTURES[name].ai_report_data));
  const isIcelandic = reportLocaleOf(FIXTURES[name].ai_report_data) === 'is';
  const company = isIcelandic ? null : (FIXTURES[name].inspectors?.company_name?.trim() || 'Beton ehf.');
  return { pageLabel: copy.pageLabel, pageOfLabel: copy.pageOfLabel, footerCompany: company };
}

main().catch(error => { console.error(error); process.exitCode = 1; });
