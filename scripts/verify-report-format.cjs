/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script */
// Synthetic fixture only. No authentication, customer records, or AI calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { renderToStaticMarkup } = require('react-dom/server');
const { execFileSync } = require('node:child_process');
const { root, load, loadReportPage, applicationCss } = require('./report-fixture.cjs');
const date = load('src/lib/report/date.ts');
for (const [input, expected] of [
  ['2026-09-21', '21.09.2026'], ['2026-09-21T00:00:00+14:00', '21.09.2026'],
  ['2026-09-21T23:59:59-10:00', '21.09.2026'], ['1/2/2026', '01.02.2026'],
  ['21.09.2026', '21.09.2026'], ['2024-02-29', '29.02.2024'], ['2026-02-29', '2026-02-29'],
  ['2026-13-21', '2026-13-21'], ['unknown', 'unknown'], [null, '—'],
]) assert.equal(date.formatReportDate(input), expected);
const mobileRoot = path.resolve(root, '../beton-app');
if (fs.existsSync(mobileRoot)) assert.equal(fs.readFileSync(path.join(mobileRoot, 'lib/utils/report-date.ts'), 'utf8'), fs.readFileSync(path.join(root, 'src/lib/report/date.ts'), 'utf8'));
const shared = load('src/lib/report/shared.ts', { './date': date });
assert.equal(shared.reportTitle('Þórsgata 1', '2026-09-21'), 'Þórsgata 1 - 21.09.2026');
assert.equal(shared.reportDownloadName('Þórsgata 1', '2026-09-21'), 'Thorsgata 1 - 21.09.2026.pdf');
assert.equal(shared.reportDownloadName('Álfaskeið 12, íbúð 0201', '2026-05-22'), 'Alfaskeid 12 ibud 0201 - 22.05.2026.pdf');
assert.equal(shared.reportDownloadName(null, null, 'en'), 'Inspection report.pdf');
assert.ok(/^[\x20-\x7e]+$/.test(shared.reportDownloadName('Ægisíða 5 / Öldugata', '2026-01-02')), 'download name is plain ASCII');
// Skýrslugerð með AI er aðeins í edge-fallinu generate-report (vefurinn kallar á það);
// vefurinn má ekki fá eigið prompt aftur (tvær útgáfur rákust á: „Beton ehf." í skýrslum annarra).
const webActions = fs.readFileSync(path.join(root, 'src/app/(dashboard)/dashboard/[id]/actions.ts'), 'utf8');
assert.ok(!/SYSTEM_PROMPT|@anthropic-ai\/sdk|messages\.create/.test(webActions), 'the web must not call Claude itself');
assert.ok(webActions.includes('functions.invoke("generate-report"'), 'the web generates reports through the edge function');
console.log('PASS civil-date boundaries, address+date filename (ASCII download), report generation only via the edge function');

async function main() {
  const obs = { id: 'o1', number: '2.1', category: 'thak', title: 'Þak', description: 'Þak og þétting. Áá Éé Íí Óó Úú Ýý Þþ Ðð Ææ Öö. Þéttingar þurfa viðhald.', suggestion: 'Yfirfara þéttingar við þak.', severity: 'alvarleg' };
  const report = {
    inspection: { address: 'Þórsgata 1 — PRÓFUN', postal_code: '101', municipality: 'Reykjavík', customer_name: 'Prófun', inspection_date: '2026-09-21', weather: 'Þurrt', attendees: ['Prófun'], property_data: {}, lookup_failed: true },
    ai_summary: { introduction: 'Ástandsskoðun fór fram 21.09.2026. Tilbúin prófunargögn.', property_description: '', conclusion: 'Viðhaldsþörfin snýr helst að þéttingu þaks. Yfirfara þarf þéttingar til að draga úr hættu á vatnságangi. Ekki liggja fyrir mælingar sem staðfesta leka.' },
    rooms: [{ id: 'r1', name: 'Þak', slug: 'thak', sort_order: 0, ratings: {}, notes: '', observations: [obs] }],
  };
  const record = { ...report.inspection, id: 'fixture', ai_report_data: report, report_generated_at: '2026-09-21T12:00:00Z', rooms: [] };
  const page = loadReportPage(record);
  const element = await page.default({ params: Promise.resolve({ id: 'fixture' }), searchParams: Promise.resolve({ pdf: '1' }) });
  const markup = renderToStaticMarkup(element);
  assert.ok(markup.includes('21.09.2026')); assert.ok(!markup.includes('2026-09-21'));
  assert.ok(markup.includes('Þak')); assert.ok(markup.includes(report.ai_summary.conclusion));
  // Skilmálar (ákvörðun eiganda 2026-09-27): Beton heldur sínum; önnur fyrirtæki fá aldrei
  // lagatexta Beton, heldur hlutlausan kafla + eigin texta.
  const BETON_CLAUSE = 'Greitt er fyrir ástandsskoðun ásamt skýrslu';
  assert.ok(markup.includes(BETON_CLAUSE), 'Beton keeps its own terms');
  record.inspectors = { company_name: 'Vitvélar ehf.', company_terms_text: 'Okkar eigin skilmálar.', company_terms_url: null };
  const other = renderToStaticMarkup(await page.default({ params: Promise.resolve({ id: 'fixture' }), searchParams: Promise.resolve({ pdf: '1' }) }));
  assert.ok(!other.includes(BETON_CLAUSE) && !other.includes('Takmörkun ábyrgðar'), 'no Beton legal text for other companies');
  for (const expected of ['Takmarkanir skoðunar', 'Skilmálar Vitvélar ehf.', 'Okkar eigin skilmálar.']) assert.ok(other.includes(expected), expected);
  report.report_locale = 'en';
  const english = renderToStaticMarkup(await page.default({ params: Promise.resolve({ id: 'fixture' }), searchParams: Promise.resolve({ pdf: '1' }) }));
  for (const expected of ['Limitations of this inspection', 'Vitvélar ehf. terms and conditions', 'Okkar eigin skilmálar.']) assert.ok(english.includes(expected), expected);
  delete report.report_locale; delete record.inspectors;
  console.log('PASS terms: Beton keeps its own; other companies get the neutral limitations + their own terms, never Beton\'s legal text');
  // Use the real compiled application styles (only the CSS the report route loads), not a redesigned test report.
  const css = applicationCss();
  const html = '<!doctype html><html lang="is"><meta charset="utf-8"><style>' + css + '</style><body>' + markup + '</body></html>';
  const output = process.env.REPORT_TEST_OUTPUT || '/tmp/beton-report-feedback-20260921';
  fs.mkdirSync(output, { recursive: true }); fs.writeFileSync(path.join(output, 'report.html'), html);
  let failFonts = false;
  const server = http.createServer((req, res) => {
    if (req.url === '/report') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html); return; }
    const assets = { '/fonts/report/NotoSans-Regular.ttf': 'fonts/report/NotoSans-Regular.ttf', '/fonts/report/NotoSans-Bold.ttf': 'fonts/report/NotoSans-Bold.ttf', '/images/beton-logo.webp': 'images/beton-logo.webp' };
    if (assets[req.url] && !(failFonts && req.url.startsWith('/fonts/'))) { res.end(fs.readFileSync(path.join(root, 'public', assets[req.url]))); return; }
    res.statusCode = 404; res.end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  process.env.PUPPETEER_EXECUTABLE_PATH ||= '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  try {
    const renderer = load('src/lib/report/render-pdf.ts');
    const url = `http://127.0.0.1:${server.address().port}/report`;
    const bytes = await renderer.renderReportPdf(url);
    const pdf = path.join(output, 'report.pdf'); fs.writeFileSync(pdf, bytes);
    const text = execFileSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8' });
    for (const expected of ['Þak', 'Áá Éé Íí Óó Úú Ýý Þþ Ðð Ææ Öö', '21.09.2026']) assert.ok(text.includes(expected), `PDF must preserve ${expected}`);
    assert.ok(!text.includes('2026-09-21'));
    assert.match(text, /Bls\. 1 \/ \d+/, 'Icelandic reports keep the "Bls. n / N" footer');
    const fonts = execFileSync('pdffonts', [pdf], { encoding: 'utf8' });
    assert.match(fonts, /NotoSans-Bold/); assert.match(fonts, /NotoSans-Regular/);
    fs.writeFileSync(path.join(output, 'extracted.txt'), text); fs.writeFileSync(path.join(output, 'fonts.txt'), fonts);
    failFonts = true;
    await assert.rejects(renderer.renderReportPdf(url), /font|network|Skýrsluletur/i);
    console.log('PASS real report page → production PDF renderer: dates, Þak, all Icelandic glyphs, embedded fonts, missing-font failure');
    console.log(`Review artifact: ${pdf}`);
  } finally { await new Promise(resolve => server.close(resolve)); }
  await nzs4306Checks(output);
}

// ── NZS 4306:2005 (report_standard = nzs_4306) ──────────────────────────────
// Tilbúna sýnisskoðunin (scripts/nz-sample/) um raunverulegu skýrslusíðuna og PDF-leiðina.
async function nzs4306Checks(output) {
  for (const [input, expected] of [
    ['2026-10-05', '5/10/2026'], ['2026-12-31T23:00:00-10:00', '31/12/2026'], ['1/2/2026', '1/2/2026'],
    ['05.10.2026', '5/10/2026'], ['2026-02-29', '2026-02-29'], ['unknown', 'unknown'], [null, '—'],
  ]) assert.equal(date.formatReportDateNz(input), expected);
  console.log('PASS formatReportDateNz: d/m/yyyy with the same civil-date rules');

  // nz-elements.ts á að vera bæti fyrir bæti eins og beton-app lib/report/nz-elements.ts.
  const appDirs = [process.env.BETON_APP_DIR, path.resolve(root, '../beton-app'), path.resolve(root, '../../beton-app')].filter(Boolean);
  const web = fs.readFileSync(path.join(root, 'src/lib/report/nz-elements.ts'), 'utf8');
  let compared = null;
  for (const dir of appDirs) {
    const file = path.join(dir, 'lib/report/nz-elements.ts');
    if (fs.existsSync(file)) { assert.equal(fs.readFileSync(file, 'utf8'), web, `nz-elements.ts differs from ${file}`); compared = file; break; }
    if (process.env.BETON_APP_NZ_REF && fs.existsSync(path.join(dir, '.git'))) {
      try {
        const app = execFileSync('git', ['-C', dir, 'show', `${process.env.BETON_APP_NZ_REF}:lib/report/nz-elements.ts`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        assert.equal(app, web, `nz-elements.ts differs from ${process.env.BETON_APP_NZ_REF}`); compared = process.env.BETON_APP_NZ_REF; break;
      } catch (error) { if (error instanceof assert.AssertionError) throw error; }
    }
  }
  console.log(compared ? `PASS nz-elements.ts byte-identical to the app (${compared})` : 'SKIP nz-elements app parity: beton-app lib/report/nz-elements.ts not found (set BETON_APP_DIR or BETON_APP_NZ_REF)');

  const nzLib = load('src/lib/report/nzs4306.ts');
  const base = { moisture_readings: [{ reading: '1' }, { reading: '2' }, { reading: '3' }], significant_defects_summary: 'a' };
  const edited = nzLib.applyNzs4306Edit(base, { keep_moisture_rows: [0, 2, 7], limitations: 'Roof not accessed.' }, { areas: { site: 'yes' }, meter: 'm' });
  assert.deepEqual(edited.moisture_readings.map(r => r.reading), ['1', '3'], 'editor can only remove moisture rows');
  assert.deepEqual(JSON.parse(JSON.stringify(edited.conditions)), { areas: { site: 'yes' }, meter: 'm', limitations: 'Roof not accessed.' }, 'limitations edit keeps the certificate areas');
  assert.equal(edited.significant_defects_summary, 'a');
  console.log('PASS editor patch: summaries/limitations replaced, moisture rows can only be removed, areas kept');

  const { buildNzSampleRecord, samplePhotos } = require('./nz-sample/sample-inspection.cjs');
  const { renderReportMarkup, reportHtml, serveReports, loadRenderer } = require('./report-fixture.cjs');
  const record = buildNzSampleRecord();
  const markup = await renderReportMarkup(record, { pdf: true, dashboardLocale: 'en', brand: 'rondva' });
  const plain = html => html.replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  const headings = [...markup.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map(m => plain(m[1]).replace(/^\d+\.\s*/, ''));
  const ORDER = ['Executive summary', 'Certificate of Inspection', 'Property and inspection conditions',
    'Site', 'Exterior', 'Roof', 'Roof space', 'Subfloor', 'Interior', 'Services',
    'Gradual deterioration and maintenance', 'Moisture readings', 'Limitations and areas not inspected',
    'Use of AI in this report', 'Terms and conditions of Example Inspections Ltd'];
  assert.deepEqual(headings, ORDER, 'NZS 4306 section order (contract)');
  const text = plain(markup);
  const nz = record.ai_report_data.nzs4306;
  // Tafla verulegra galla úr mjog_alvarleg (8.1 staurar, 9.2 sturtuveggur) + AI-málsgrein.
  assert.ok(text.includes(nz.significant_defects_summary));
  for (const ref of ['8.1Subfloor', '9.2Bathroom']) assert.ok(text.includes(ref), `significant defects table has ${ref}`);
  assert.ok(!text.includes('No significant defects were recorded.'));
  // Vottorð: 8 svæði, réttindi, fyrirtæki, undirskrift.
  for (const s of ['Accessory units, ancillary spaces and buildingsN/A', 'SubfloorLimited', 'QualificationsNZIBI member, LBP 000000 (sample)', 'CompanyExample Inspections Ltd', 'Signature']) assert.ok(text.includes(s), s);
  // Rakatafla: 4 línur úr nzs4306.moisture_readings; athugasemd án tölu kemur ekki fram.
  const moisture = /<table class="[^"]*rpt-moisture[^"]*">([\s\S]*?)<\/table>/.exec(markup);
  assert.ok(moisture, 'moisture table');
  assert.equal((moisture[1].match(/<tr/g) || []).length, 1 + 4, 'header + 4 readings');
  for (const s of ['24% WME', 'Elevated', '95relative', 'Wet', '40relative', 'Dry', '19% WME—']) assert.ok(plain(moisture[1]).includes(s), `moisture ${s}`);
  assert.ok(!plain(moisture[1]).includes('ground cover'), 'a note without a reading is not a moisture row');
  // Takmarkanir orðrétt, AI-yfirlýsing úr sniðmáti, d/m/yyyy, aldrei Beton-texti.
  assert.ok(markup.includes(nz.conditions.limitations.replace(/'/g, '&#x27;')), 'limitations verbatim');
  // PDF-heiðarleiki (report-2 PR 1 / positioning-3): engin yfirferðarfullyrðing, ekkert módel, dagsetning rituð d/m/yyyy.
  assert.ok(text.includes('Observations and ratings by Jordan Sample, Example Inspections Ltd. Text drafted with AI assistance (5/10/2026). Not yet reviewed or issued.'));
  for (const s of ['Drafting model', 'none (hand-written', 'made and reviewed by']) assert.ok(!text.includes(s), `no "${s}" in the PDF text`);
  assert.ok(text.includes('5/10/2026') && !text.includes('05.10.2026') && !text.includes('2026-10-05'), 'd/m/yyyy dates');
  assert.ok(text.includes('Prepared in accordance with NZS 4306:2005'));
  // Legal description (inspections.fastanumer): í vottorðinu og í „Property and inspection conditions“,
  // aldrei merkt „Fastanúmer“/„Property ID“.
  const legal = record.ai_report_data.inspection.fastanumer;
  assert.equal(legal, 'Lot 1 DP 000000, Record of Title NA000/000 (sample)', 'fixture carries a legal description');
  assert.equal(text.split(`Legal description${legal}`).length - 1, 2, 'legal description row printed in certificate and property conditions');
  for (const s of ['Fastanúmer', 'Fastanumer', 'Property ID']) assert.ok(!text.includes(s), `no ${s} label`);
  const legalOrder = text.indexOf('Site address12 Example Road, Mount Eden, Auckland 1024Legal description');
  // Forsíða: fullt heimilisfang (gata + bær/borg + póstnúmer), ekki aðeins gatan.
  const cover = /<section class="rpt-cover">([\s\S]*?)<\/section>/.exec(markup);
  assert.ok(cover, 'cover section');
  assert.ok(plain(cover[1]).includes('12 Example Road, Mount Eden, Auckland 1024'), 'cover shows street, town/city and postcode');
  assert.ok(legalOrder > -1, 'legal description follows the site address');
  for (const s of ['Greitt er fyrir', 'Takmarkanir', 'Bls.', 'Beton']) assert.ok(!text.includes(s), `no ${s}`);
  // Vottorð: aldrei „Qualifications … Not recorded“; „Prepared and issued by …“ úr gögnum; dagsetning merkt „Draft generated“.
  assert.ok(text.includes('Prepared and issued by Jordan Sample, NZIBI member, LBP 000000 (sample)'), 'certificate prepared-by line with qualifications');
  const certBlock = text.slice(text.indexOf('Certificate of Inspection'), text.indexOf('Property and inspection conditions'));
  assert.ok(certBlock.includes('5/10/2026Draft generated') && !certBlock.includes('Date of inspection5/10/2026Date'), 'certificate signature date is labelled "Draft generated"');
  assert.ok(!certBlock.includes('5/10/2026Date') , 'signature date box is no longer labelled just "Date"');
  const certificateOf = async mutate => {
    const r = buildNzSampleRecord(); mutate(r);
    const t = plain(await renderReportMarkup(r, { pdf: true, dashboardLocale: 'en', brand: 'rondva' }));
    return t.slice(t.indexOf('Certificate of Inspection'), t.indexOf('Property and inspection conditions'));
  };
  for (const value of [null, '', '   ']) {
    const cert = await certificateOf(r => { r.inspectors.qualifications = value; });
    assert.ok(!/Qualifications/.test(cert), `no Qualifications row for ${JSON.stringify(value)}`);
    assert.ok(!/Qualifications[^]{0,12}Not recorded/.test(cert), 'never "Qualifications: Not recorded"');
    assert.ok(cert.includes('Prepared and issued by Jordan Sample') && !cert.includes('Prepared and issued by Jordan Sample,'), `name only for ${JSON.stringify(value)}`);
  }
  console.log('PASS NZS 4306 certificate: no "Not recorded" for qualifications, "Prepared and issued by" from data, date labelled "Draft generated", disclosure without model and without review claim');

  // Defects-tafla (report-3): `alvarleg` undir Significant defects, „None recorded.“ ef engin, ein föst sérfræðingssetning.
  const defectsHeading = text.indexOf('DefectsRef');
  assert.ok(defectsHeading > text.indexOf('Significant defects') && defectsHeading < text.indexOf('Summary of findings'), 'Defects table sits between Significant defects and Summary of findings');
  const defectObs = record.ai_report_data.rooms.flatMap(r => r.observations).filter(o => o.severity === 'alvarleg');
  assert.ok(defectObs.length >= 1, 'fixture has Defects');
  const summaryBlock = text.slice(text.indexOf('Executive summary'), text.indexOf('Summary of findings'));
  for (const o of defectObs) assert.ok(summaryBlock.includes(o.title), `Defects table lists "${o.title}"`);
  const SPECIALIST = 'Minor items and maintenance observations are listed in the element sections (§4 onward). Items above may require evaluation by a suitably qualified specialist before purchase.';
  assert.equal(text.split(SPECIALIST).length - 1, 1, 'specialist sentence printed once');
  assert.ok(text.indexOf(SPECIALIST) > defectsHeading && text.indexOf(SPECIALIST) < text.indexOf('Summary of findings'), 'specialist sentence follows the tables');
  const noDefects = buildNzSampleRecord();
  for (const room of noDefects.ai_report_data.rooms) for (const o of room.observations) if (o.severity === 'alvarleg') o.severity = 'athugasemd';
  const noDefectsText = plain(await renderReportMarkup(noDefects, { pdf: true }));
  assert.ok(noDefectsText.includes('DefectsNone recorded.'), 'no alvarleg → "None recorded."');
  assert.ok(noDefectsText.includes(SPECIALIST), 'specialist sentence also printed when there are no Defects');
  console.log('PASS NZS 4306 Defects table: alvarleg rows under Significant defects, "None recorded." when empty, fixed specialist sentence once, no keyword list');

  console.log('PASS NZS 4306 template: full address on the cover, contract section order, significant-defects table, certificate, moisture table (4 rows, no reading invented), limitations verbatim, AI disclosure, d/m/yyyy');

  // Tóm / blanks legal description → engin lína (og aldrei „null“/„undefined“).
  for (const value of ['', '   ', null, undefined]) {
    const blank = buildNzSampleRecord();
    blank.ai_report_data.inspection.fastanumer = value;
    const blankText = plain(await renderReportMarkup(blank, { pdf: true, dashboardLocale: 'en', brand: 'rondva' }));
    assert.ok(!blankText.includes('Legal description'), `no legal description row for ${JSON.stringify(value)}`);
    assert.ok(!blankText.includes('null') && !blankText.includes('undefined'), `no null/undefined text for ${JSON.stringify(value)}`);
  }
  console.log('PASS NZS 4306 legal description: printed (certificate + property conditions) only when non-empty, never labelled Fastanúmer');

  const none = buildNzSampleRecord();
  for (const room of none.ai_report_data.rooms) for (const o of room.observations) if (o.severity === 'mjog_alvarleg') o.severity = 'alvarleg';
  const noneText = plain(await renderReportMarkup(none, { pdf: true }));
  assert.ok(noneText.includes('Significant defectsNo significant defects were recorded.'));
  assert.ok(!noneText.includes(nz.significant_defects_summary), 'AI paragraph is not shown without significant defects');
  console.log('PASS no mjog_alvarleg → fixed "No significant defects were recorded." (AI paragraph ignored)');

  const html = reportHtml(markup);
  const server = await serveReports({ nz: html }, { photos: samplePhotos(record) });
  try {
    const { reportCopy, reportLocaleOf } = load('src/lib/report/i18n.ts');
    const label = reportCopy(reportLocaleOf(record.ai_report_data)).pageLabel;
    assert.equal(label, 'Page');
    const pdf = path.join(output, 'nzs4306.pdf');
    fs.writeFileSync(pdf, await loadRenderer().renderReportPdf(server.url('nz'), { pageLabel: label }));
    const pdfText = execFileSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8' });
    assert.match(pdfText, /Page 1 \/ \d+/); assert.ok(!pdfText.includes('Bls.'), 'English/NZ footer says Page, never Bls.');
    // Fótur með fyrirtækisnafni fyrir skýrslur sem eru ekki íslenskar: „{Company} · Page n of N“.
    const copy = reportCopy(reportLocaleOf(record.ai_report_data));
    const branded = path.join(output, 'nzs4306-footer.pdf');
    fs.writeFileSync(branded, await loadRenderer().renderReportPdf(server.url('nz'), { pageLabel: copy.pageLabel, pageOfLabel: copy.pageOfLabel, footerCompany: 'Example Inspections Ltd' }));
    const brandedText = execFileSync('pdftotext', ['-layout', branded, '-'], { encoding: 'utf8' });
    assert.match(brandedText, /Example Inspections Ltd · Page 1 of \d+/); assert.match(brandedText, /Example Inspections Ltd · Page 2 of \d+/);
    assert.ok(!/Page 1 \/ \d+/.test(brandedText) && !brandedText.includes('Bls.'), 'branded footer replaces the "Page n / N" footer');
    // Beton (is): fótstrengurinn er bæti fyrir bæti eins og áður; fyrirtækisnafn aldrei í íslenskum fæti.
    const rp = load('src/lib/report/render-pdf.ts');
    assert.equal(rp.buildFooterTemplate({ pageLabel: 'Bls.' }),
      '<div style="width:100%;text-align:center;font-size:8px;color:#8a8278;font-family:Helvetica,Arial,sans-serif;">Bls. <span class="pageNumber"></span> / <span class="totalPages"></span></div>');
    assert.equal(rp.buildFooterTemplate({ pageLabel: 'Bls.', footerCompany: null }), rp.buildFooterTemplate({ pageLabel: 'Bls.' }));
    assert.ok(rp.buildFooterTemplate({ pageLabel: 'Page', pageOfLabel: 'of', footerCompany: 'A & B <Ltd>' }).includes('A &amp; B &lt;Ltd&gt; · Page'), 'company name is HTML-escaped');
    let at = -1;
    for (const h of ORDER) { const i = pdfText.indexOf(h, at + 1); assert.ok(i > at, `PDF order: ${h}`); at = i; }
    for (const s of ['5/10/2026', 'Moisture readings', 'Certificate of Inspection', 'Legal description', 'Lot 1 DP 000000, Record of Title NA000/000 (sample)']) assert.ok(pdfText.includes(s), s);
    console.log(`PASS NZS 4306 PDF via render-pdf.ts: "Page n / N" footer, "{Company} · Page n of N" footer, section order, d/m/yyyy (${pdf})`);
  } finally { await server.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
