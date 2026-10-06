// Synthetic fixture only. No authentication, customer records, or AI calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { renderToStaticMarkup } = require('react-dom/server');
const { execFileSync } = require('node:child_process');
const { root, load, loadReportPage } = require('./report-fixture.cjs');
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
  // Use the real compiled application styles, not a redesigned test report.
  function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(x => x.isDirectory() ? walk(path.join(dir, x.name)) : [path.join(dir, x.name)]); }
  const cssFiles = walk(path.join(root, '.next/static')).filter(x => x.endsWith('.css'));
  assert.ok(cssFiles.length, 'Run next build first to produce application styles');
  const css = cssFiles.map(x => fs.readFileSync(x, 'utf8')).join('\n') + '\n' + fs.readFileSync(path.join(root, 'src/lib/report/typography.css'), 'utf8');
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
    const fonts = execFileSync('pdffonts', [pdf], { encoding: 'utf8' });
    assert.match(fonts, /NotoSans-Bold/); assert.match(fonts, /NotoSans-Regular/);
    fs.writeFileSync(path.join(output, 'extracted.txt'), text); fs.writeFileSync(path.join(output, 'fonts.txt'), fonts);
    failFonts = true;
    await assert.rejects(renderer.renderReportPdf(url), /font|network|Skýrsluletur/i);
    console.log('PASS real report page → production PDF renderer: dates, Þak, all Icelandic glyphs, embedded fonts, missing-font failure');
    console.log(`Review artifact: ${pdf}`);
  } finally { await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
