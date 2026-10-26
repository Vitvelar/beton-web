/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script, like the other verify-*.cjs */
// isop skýrslusniðið (src/components/report/IsopReport.tsx) — samningur plan/rondva/ISOP-SNID-HONNUN.md §5.2–5.3.
// Rendrar RAUNVERULEGU skýrslusíðuna (report/page.tsx) úr tilbúinni skoðun (scripts/isop-sample/) og athugar:
//   (a) kaflaröð, (b) gallatafla = nákvæmlega réttar athugasemdir í réttri röð (Safety → Major → Repair, síðan eftir kerfi),
//   (c) status/ástæður/describe/takmarkanir orðrétt, (d) bannorð í föstum texta og öllu sýninu (DON'T SAY),
//   (e) ft²-lína og dagsetningar en-US/en-CA, (f) engar deficiencies → engin tafla, (g) merki aðeins úr ai_report_data.isop.tags,
//   (h) ósamræmi (Not present með athugasemdum) felur aldrei gögn, (i) stimpill án isop-hluta/óþekkt snið → venjulegt snið,
//   (j) settings.ts, (k) fótur „{Company} · Page n of N“.
// ISOP_PDF=1 bætir við: PDF um render-pdf.ts → pdftotext → bannorðaleit og fótur (krefst `next build`, Chrome og poppler).
//   node scripts/verify-report-isop.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { load, renderReportMarkup, reportHtml, serveReports, loadRenderer } = require('./report-fixture.cjs');
const { buildIsopSampleRecord, samplePhotos } = require('./isop-sample/sample-inspection.cjs');

const OPTS = { pdf: true, dashboardLocale: 'en', brand: 'rondva' };
let checks = 0;
const pass = (name) => { checks++; console.log(`PASS ${name}`); };

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");
const textOf = (markup) => decode(markup.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, '\n')).split('\n').map((l) => l.trim()).filter(Boolean);
const article = (markup) => markup.slice(markup.indexOf('<article'));
const clone = (value) => JSON.parse(JSON.stringify(value));
const record = () => buildIsopSampleRecord();

// DON'T SAY (RULES) + loforð sem sniðið gefur aldrei (samningur §1.2). Leitað í ÖLLUM texta skýrslunnar.
const BANNED = [
  /compliant/i, /complies/i, /certif/i, /\bInterNACHI\b/i, /\bASHI\b/, /\bTREC\b/, /\bCSA\b/, /NZIBI/i, /\baccurate/i, /\bunlimited\b/i,
  /\bonly\b/i, /\bfirst\b/i, /in accordance with/i, /standards? of practice/i, /saves? .{0,20}hours/i, /edit on your phone/i, /used by NZ/i,
  /meets? (?:the )?code/i, /up to code/i, /code violation/i, /guarantee/i, /warrant(?:y|ies)\b/i, /\bsafe to\b/i, /no defects/i,
];
function banned(lines) {
  const hits = [];
  for (const line of lines) for (const re of BANNED) if (re.test(line)) hits.push(`${re}: ${line.slice(0, 90)}`);
  return hits;
}

async function main() {
  const base = record();
  const html = await renderReportMarkup(base, OPTS);
  const lines = textOf(article(html));

  // (a) Kaflaröð
  const headings = [...article(html).matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => decode(m[1].replace(/<[^>]+>/g, '')).trim());
  assert.deepEqual(headings, [
    'Inspection details', 'How to read this report', 'Summary of deficiencies', 'Systems at a glance',
    '1.Roof', '2.Exterior', '3.Basement, Foundation, Crawlspace & Structure', '4.Heating', '5.Cooling', '6.Plumbing', '7.Electrical',
    '8.Fireplace', '9.Attic, Insulation & Ventilation', '10.Doors, Windows & Interior',
    'Limitations and items not inspected', 'Use of AI in this report', 'Terms and state or provincial statements',
  ]);
  pass('section order: details → how to read → summary of deficiencies → systems at a glance → systems 1–10 → limitations → AI → terms');

  // (b) Gallatafla: nákvæmlega alvarleg/mjog_alvarleg/safety, í röðinni Safety → Major → Repair, svo kerfaröð.
  const rec = record();
  const all = rec.rooms.flatMap((room) => room.observations.map((o) => ({ ...o, room })));
  const tags = rec.ai_report_data.isop.tags;
  const categoryOf = (o) => ((tags[o.id] || []).includes('safety_hazard') ? 0 : o.severity === 'mjog_alvarleg' ? 1 : o.severity === 'alvarleg' ? 2 : null);
  const expectedTitles = all.filter((o) => categoryOf(o) !== null).sort((a, b) => categoryOf(a) - categoryOf(b)).map((o) => o.title);
  // Röð innan flokks er eftir kerfaröð; sýnið er skrifað í kerfaröð svo innsend röð dugar (stöðug röðun).
  const table = article(html).match(/<table class="w-full text-xs mb-4">([\s\S]*?)<\/table>/);
  assert.ok(table, 'deficiency table present');
  const rows = [...table[1].matchAll(/<tr>(<td[\s\S]*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<td[^>]*>([\s\S]*?)(?=<\/td>)/g)].map((c) => decode(c[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()));
  assert.deepEqual(rows.map((r) => r[4]), expectedTitles, 'deficiency table rows = deficiencies in category order');
  assert.equal(rows.length, 9, '1 safety + 2 major + 6 repair');
  assert.deepEqual(rows.map((r) => r[1].split(' ').slice(0, 2).join(' ')), ['Safety hazard', 'Major defect', 'Major defect', ...Array(6).fill('Repair or')]);
  assert.ok(rows.every((r) => /^\d+\.\d+$/.test(r[0])), 'every row has a section number');
  for (const title of all.filter((o) => categoryOf(o) === null).map((o) => o.title)) assert.ok(!rows.some((r) => r[4] === title), `maintenance item not in table: ${title}`);
  const maint = lines.slice(lines.indexOf('Maintenance items'), lines.indexOf('Systems at a glance'));
  for (const o of all.filter((x) => categoryOf(x) === null)) assert.ok(maint.includes(o.title), `maintenance list has ${o.title}`);
  pass('deficiency table = the 9 deficiencies (Safety → Major → Repair, then system order); the 7 maintenance items are listed separately');

  // (c) Orðrétt: statusar, ástæða, describe, takmarkanir
  const sys = rec.ai_report_data.isop.systems.items;
  const body = lines.join('\n');
  assert.ok(body.includes(sys.cooling.reason), 'not-inspected reason verbatim');
  assert.ok(body.includes('Inspected · 2 deficiencies') && body.includes('Not inspected') && body.includes('Not present'), 'status words');
  for (const key of ['roof', 'structure', 'heating', 'plumbing', 'electrical', 'attic']) for (const value of Object.values(sys[key].describe)) assert.ok(body.includes(value), `describe value verbatim: ${value}`);
  for (const key of ['roof', 'structure', 'attic']) assert.ok(body.includes(sys[key].limitations), `system limitations verbatim: ${key}`);
  for (const line of rec.ai_report_data.isop.conditions.limitations.split('\n')) assert.ok(body.includes(line), 'general limitations verbatim');
  assert.ok(body.includes(sys.cooling.reason) && lines.indexOf('Systems not inspected') > -1);
  assert.ok(body.includes('Cooling:') || lines.some((l) => l === 'Cooling:'), 'not inspected list names Cooling');
  const glance = article(html).slice(article(html).indexOf('Systems at a glance'), article(html).indexOf('The deficiency count is calculated'));
  assert.equal([...glance.matchAll(/<tr>/g)].length, 10, 'glance table: 10 system rows (no Additional items row without rooms)');
  pass('status, reason, describe values and limitations are printed verbatim; Cooling is listed as not inspected with its reason');

  // (d) Bannorð: allur texti sýnisins + fastur texti einn og sér (tóm gögn)
  assert.deepEqual(banned(lines), [], 'sample report has no banned wording');
  const bare = clone(base);
  bare.ai_report_data.ai_summary = { introduction: '', property_description: '', conclusion: '' };
  bare.ai_report_data.isop = { systems: { v: 1, items: {}, room_map: {} }, conditions: {} };
  bare.ai_report_data.rooms = bare.ai_report_data.rooms.map((r) => ({ ...r, observations: [] }));
  bare.inspectors.company_terms_text = null; bare.inspectors.company_terms_url = null; bare.inspectors.qualifications = null;
  bare.ai_report_data.inspection.property_data.byggingarar = 1960;
  const bareHtml = await renderReportMarkup(bare, OPTS);
  const bareLines = textOf(article(bareHtml));
  assert.deepEqual(banned(bareLines), [], 'fixed text has no banned wording');
  assert.ok(bareLines.some((l) => l.includes('may contain lead-based paint')), 'lead paint note for homes built before 1978');
  assert.ok(bareLines.some((l) => l === 'Not recorded') || bareLines.some((l) => l.includes('Not recorded')), 'unanswered statuses are shown as Not recorded');
  assert.ok(bareLines.includes('No deficiencies were recorded by the inspector.'), 'empty report: honest no-deficiencies line');
  const newer = clone(bare); newer.ai_report_data.inspection.property_data.byggingarar = 1990;
  assert.ok(!textOf(await renderReportMarkup(newer, OPTS)).some((l) => l.includes('lead-based paint')), 'no lead note for newer homes');
  assert.ok(!bareLines.some((l) => /InterNACHI|\bASHI\b|compliant|certified/.test(l)), 'no standard names in fixed text');
  pass(`no banned wording (${BANNED.length} patterns) in the sample report or in the fixed text; lead note only before 1978`);

  // (e) ft² / dagsetningar
  assert.ok(body.includes('1,850 ft² (172 m²)'), 'en-US: ft² first');
  assert.equal(lines.filter((l) => l === '10/13/2026').length >= 2, true, 'en-US dates');
  assert.ok(lines.some((l) => l.includes('(10/14/2026)')), 'en-US disclosure date');
  const ca = clone(base); ca.ai_report_data.english_variant = 'en-CA';
  const caLines = textOf(article(await renderReportMarkup(ca, OPTS)));
  assert.ok(caLines.includes('2026-10-13') && caLines.some((l) => l === '172 m² (1,850 ft²)'), 'en-CA: yyyy-mm-dd and m² first');
  const caBare = clone(bare); caBare.ai_report_data.english_variant = 'en-CA';
  const caBareLines = textOf(article(await renderReportMarkup(caBare, OPTS)));
  assert.ok(caBareLines.some((l) => /\bmould\b/.test(l)) && !caBareLines.some((l) => /\bmold\b/.test(l)), 'en-CA spells mould');
  assert.ok(bareLines.some((l) => /\bmold\b/.test(l)) && !bareLines.some((l) => /\bmould\b/.test(l)), 'en-US spells mold');
  for (const stamp of [undefined, 'en', 'en-GB']) {
    const r = clone(base); if (stamp === undefined) delete r.ai_report_data.english_variant; else r.ai_report_data.english_variant = stamp;
    assert.ok(textOf(article(await renderReportMarkup(r, OPTS))).includes('10/13/2026'), `stamp ${stamp}: isop falls back to US dates`);
  }
  pass('en-US: ft² first, m/d/yyyy, "mold"; en-CA: yyyy-mm-dd, m² first, "mould"; other/no stamp use US dates');

  // (f)+(g) Engar deficiencies → engin tafla og engin AI-samantekt; merki aðeins úr isop.tags
  const clean = clone(base);
  for (const room of clean.ai_report_data.rooms) room.observations = room.observations.filter((o) => o.severity === 'athugasemd');
  clean.ai_report_data.isop.tags = {};
  const cleanHtml = await renderReportMarkup(clean, OPTS);
  const cleanLines = textOf(article(cleanHtml));
  assert.ok(cleanLines.includes('No deficiencies were recorded by the inspector.'));
  assert.ok(!article(cleanHtml).includes('class="w-full text-xs mb-4"'), 'no deficiency table without deficiencies');
  assert.ok(!cleanLines.some((l) => l.startsWith('One safety hazard')), 'AI deficiencies_summary is not shown when there are none');
  const noTag = clone(base); noTag.ai_report_data.isop.tags = {};
  const noTagRows = textOf(article(await renderReportMarkup(noTag, OPTS)));
  assert.ok(!noTagRows.includes('Safety hazard') || noTagRows.filter((l) => l === 'Safety hazard').length === 1, 'safety hazard only from tags');
  const noTagHtml = article(await renderReportMarkup(noTag, OPTS));
  assert.ok(!noTagHtml.includes('Further evaluation recommended</span>'), 'no further-evaluation badge without tags');
  assert.equal([...noTagHtml.matchAll(/<tr><td class="py-1\.5 pr-2 font-bold text-navy align-top">/g)].length, 9, 'without tags the deck rail is a plain repair row (still 9 rows) …');
  assert.ok(!noTagHtml.includes('>Safety hazard</span>'), '… but no Safety hazard category or badge remains');
  pass('no deficiencies → honest line, no table, no AI summary; safety / further-evaluation come only from ai_report_data.isop.tags');

  // (h) Ósamræmi felur aldrei gögn skoðunarmanns
  const mismatch = clone(base);
  mismatch.ai_report_data.isop.systems.items.roof.status = 'not_present';
  const mismatchLines = textOf(article(await renderReportMarkup(mismatch, OPTS)));
  assert.ok(mismatchLines.includes('Cracked and missing shingles on the south slope'), 'observations of a Not present system are still printed');
  pass('a system marked Not present that has observations still prints them');

  // (i) Stimpill án isop-hluta eða óþekkt snið → venjulega sniðið
  const defaultMarkers = ['Summary of deficiencies', 'Systems at a glance'];
  const noBlock = clone(base); delete noBlock.ai_report_data.isop;
  const noBlockHtml = await renderReportMarkup(noBlock, OPTS);
  for (const marker of defaultMarkers) assert.ok(!noBlockHtml.includes(marker), `isop stamp without isop block → default renderer (${marker})`);
  const unknown = clone(base); unknown.ai_report_data.report_standard = 'isop_v2';
  const unknownHtml = await renderReportMarkup(unknown, OPTS);
  for (const marker of defaultMarkers) assert.ok(!unknownHtml.includes(marker), `unknown stamp → default renderer (${marker})`);
  pass('isop stamp without an isop block, and unknown stamps, fall back to the default renderer');

  // (h1) Tómt undirrými fær enga undirfyrirsögn (vettvangsgalli 2026-10-26: „Water heater“ tómt undir Plumbing).
  const h3s = (markup) => [...article(markup).matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map((m) => decode(m[1].replace(/<[^>]+>/g, '')).trim());
  assert.ok(h3s(html).includes('Water heater'), 'baseline: Water heater has content and its sub-heading');
  const emptyWh = clone(base);
  for (const r of [...emptyWh.rooms, ...emptyWh.ai_report_data.rooms]) if (r.slug === 'isop-water-heater') { r.ratings = {}; r.notes = ''; r.observations = []; r.photos = []; }
  const emptyWhHtml = await renderReportMarkup(emptyWh, OPTS);
  assert.ok(!h3s(emptyWhHtml).includes('Water heater'), 'empty Water heater: no sub-heading');
  assert.ok(h3s(emptyWhHtml).length === h3s(html).length - 1, 'only the empty sub-heading disappears');
  // Allir undirflokkar tómir (kerfi „Inspected“ án efnis): ein lína fyrir kerfið, engin undirfyrirsögn.
  const allEmpty = clone(emptyWh);
  for (const r of [...allEmpty.rooms, ...allEmpty.ai_report_data.rooms]) if (r.slug === 'isop-plumbing') { r.ratings = {}; r.notes = ''; r.observations = []; r.photos = []; }
  const allEmptyHtml = await renderReportMarkup(allEmpty, OPTS);
  assert.ok(!h3s(allEmptyHtml).includes('Water heater') && !h3s(allEmptyHtml).includes('Plumbing'), 'no empty sub-headings at all');
  assert.ok(textOf(article(allEmptyHtml)).includes('No observations were recorded for this system.'), 'one system-level line when nothing was recorded');
  pass('empty sub-room (Water heater) renders no heading; a system with every room empty shows one system-level line');

  // (h2) Sérsniðið rými: ai_report_data.rooms hefur ekkert id (edge report-data.ts læst) → id úr rýmum skoðunarinnar
  //      eftir slug, svo room_map[<id>] varpi því á kerfi; óvarpað sérsniðið rými fer í Additional items.
  const custom = clone(base);
  const shed = { id: 'room-shed', name: 'Detached shed', slug: 'shed', sort_order: 99, ratings: {}, notes: '' };
  const shedObs = { id: 'obs-shed-1', category: 'Wiring', title: 'Open junction box in the shed', description: 'd', suggestion: 's', severity: 'alvarleg' };
  custom.rooms.push({ ...shed, observations: [{ ...shedObs, observation_number: null, sort_order: 0, photos: [] }], photos: [] });
  const aiShed = { ...shed, observations: [{ ...shedObs, number: null }] }; delete aiShed.id;
  custom.ai_report_data.rooms.push(aiShed);
  const unmapped = textOf(article(await renderReportMarkup(custom, OPTS)));
  assert.ok(unmapped.includes('Additional items'), 'unmapped custom room → Additional items');
  custom.ai_report_data.isop.systems.room_map = { 'room-shed': 'electrical' };
  const mappedLines = textOf(article(await renderReportMarkup(custom, OPTS)));
  assert.ok(!mappedLines.includes('Additional items'), 'mapped custom room is not in Additional items');
  const elec = mappedLines.slice(mappedLines.indexOf('7.'), mappedLines.indexOf('8.'));
  assert.ok(elec.includes('Detached shed') && elec.includes('Open junction box in the shed'), 'mapped custom room is printed under Electrical');
  assert.ok(mappedLines.includes('Inspected · 3 deficiencies'), 'Electrical deficiency count includes the mapped room');
  pass('custom room without an id in ai_report_data: id from the inspection rooms by slug, so room_map places it in its system');

  // (j) settings.ts
  const settings = load('src/lib/report/settings.ts');
  const same = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b);
  same(settings.resolveReportSettings({ country_code: 'US', report_standard: 'isop' }), { locale: 'en', scheme: 'isop_terms', standard: 'isop', englishVariant: 'en-US' });
  same(settings.resolveReportSettings({ country_code: 'CA', report_standard: 'isop', rating_scheme: 'standard' }), { locale: 'en', scheme: 'standard', standard: 'isop', englishVariant: 'en-CA' });
  same(settings.resolveReportSettings({ country_code: 'US' }), { locale: 'en', scheme: 'standard', standard: 'default', englishVariant: 'en-US' });
  assert.equal(settings.reportStandardOf({ report_standard: 'isop' }), 'isop');
  assert.equal(settings.reportStandardOf({ report_standard: 'isop ' }), 'default');
  assert.equal(settings.ratingSchemeOf({ rating_scheme: 'isop_terms' }), 'isop_terms');
  pass('settings: isop → isop_terms by default, explicit values win, US/CA without a stamp stay default');

  // (k) Fótur
  const { buildFooterTemplate } = load('src/lib/report/render-pdf.ts');
  const footer = buildFooterTemplate({ pageLabel: 'Page', pageOfLabel: 'of', footerCompany: 'Example Home Inspections LLC' });
  assert.ok(footer.includes('Example Home Inspections LLC · Page <span class="pageNumber"></span> of <span class="totalPages"></span>'));
  pass('PDF footer: "{Company} · Page n of N"');

  if (process.env.ISOP_PDF === '1') await pdfChecks(base, html);
  console.log(`verify-report-isop: ${checks} checks passed`);
}

async function pdfChecks(base, markup) {
  try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); } catch { throw new Error('ISOP_PDF=1 needs poppler (pdftotext)'); }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'isop-pdf-'));
  const server = await serveReports({ sample: reportHtml(markup) }, { photos: samplePhotos(base) });
  try {
    const { reportCopy, reportLocaleOf } = load('src/lib/report/i18n.ts');
    const copy = reportCopy(reportLocaleOf(base.ai_report_data));
    const pdf = await loadRenderer().renderReportPdf(server.url('sample'), { pageLabel: copy.pageLabel, pageOfLabel: copy.pageOfLabel, footerCompany: base.inspectors.company_name });
    const file = path.join(dir, 'isop.pdf');
    fs.writeFileSync(file, pdf);
    const text = execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' });
    const pdfLines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    assert.deepEqual(banned(pdfLines), [], 'PDF text has no banned wording');
    const pages = Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [file], { encoding: 'utf8' }))[1]);
    for (const n of [1, pages]) assert.ok(text.includes(`Example Home Inspections LLC · Page ${n} of ${pages}`), `footer on page ${n}`);
    assert.ok(text.includes('Summary of deficiencies') && text.includes('Systems at a glance'));
    pass(`PDF: ${pages} pages, footer "Example Home Inspections LLC · Page n of ${pages}", no banned wording in pdftotext output`);
  } finally { await server.close(); fs.rmSync(dir, { recursive: true, force: true }); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
