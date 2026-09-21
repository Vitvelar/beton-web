// Synthetic fixture only. No authentication, customer records, or AI calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
function load(file, mocks = {}) {
  const filename = path.resolve(root, file);
  const context = { exports: {}, process, console, Uint8Array, setTimeout, clearTimeout,
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : require(name) };
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  }).outputText;
  vm.runInNewContext(code, context, { filename });
  return context.exports;
}
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
assert.equal(shared.reportDownloadName('Þórsgata 1', '2026-09-21'), 'Beton Ástandsskoðun - Þórsgata 1, 21.09.2026.pdf');
const webPromptSource = fs.readFileSync(path.join(root, 'src/app/(dashboard)/dashboard/[id]/actions.ts'), 'utf8');
const appPrompt = fs.existsSync(mobileRoot) ? load('../beton-app/supabase/functions/generate-report/prompt.ts') : null;
const webPrompt = webPromptSource.slice(webPromptSource.indexOf('const SYSTEM_PROMPT = ')).replace('const SYSTEM_PROMPT = ', 'exports.SYSTEM_PROMPT = ');
const promptContext = { exports: {} }; vm.runInNewContext(webPrompt, promptContext);
if (appPrompt) assert.equal(promptContext.exports.SYSTEM_PROMPT, appPrompt.SYSTEM_PROMPT, 'Web and mobile report instructions must remain in sync');
console.log('PASS civil-date boundaries, Icelandic filename and identical report instructions');

async function main() {
  const obs = { id: 'o1', number: '2.1', category: 'thak', title: 'Þak', description: 'Þak og þétting. Áá Éé Íí Óó Úú Ýý Þþ Ðð Ææ Öö. Þéttingar þurfa viðhald.', suggestion: 'Yfirfara þéttingar við þak.', severity: 'alvarleg' };
  const report = {
    inspection: { address: 'Þórsgata 1 — PRÓFUN', postal_code: '101', municipality: 'Reykjavík', customer_name: 'Prófun', inspection_date: '2026-09-21', weather: 'Þurrt', attendees: ['Prófun'], property_data: {}, lookup_failed: true },
    ai_summary: { introduction: 'Ástandsskoðun fór fram 21.09.2026. Tilbúin prófunargögn.', property_description: '', conclusion: 'Viðhaldsþörfin snýr helst að þéttingu þaks. Yfirfara þarf þéttingar til að draga úr hættu á vatnságangi. Ekki liggja fyrir mælingar sem staðfesta leka.' },
    rooms: [{ id: 'r1', name: 'Þak', slug: 'thak', sort_order: 0, ratings: {}, notes: '', observations: [obs] }],
  };
  const record = { ...report.inspection, id: 'fixture', ai_report_data: report, report_generated_at: '2026-09-21T12:00:00Z', rooms: [] };
  const query = { select() { return this; }, limit() { return this; }, eq() { return this; }, or() { return this; }, async maybeSingle() { return { data: record }; } };
  const client = { from: () => query };
  const page = load('src/app/(dashboard)/dashboard/[id]/report/page.tsx', {
    '@/lib/report/typography.css': {}, '@/lib/report/date': date, '@/lib/report/shared': shared,
    'next/navigation': { notFound: () => { throw new Error('Unexpected notFound'); } },
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children), __esModule: true },
    'next/headers': { headers: async () => new Headers() },
    '@/lib/supabase/server': { createClient: async () => client },
    '@/lib/supabase/service': { createServiceClient: () => client },
    '@/lib/supabase/bearer': { getBearerAuthorization: () => null },
  });
  const element = await page.default({ params: Promise.resolve({ id: 'fixture' }), searchParams: Promise.resolve({ pdf: '1' }) });
  const markup = renderToStaticMarkup(element);
  assert.ok(markup.includes('21.09.2026')); assert.ok(!markup.includes('2026-09-21'));
  assert.ok(markup.includes('Þak')); assert.ok(markup.includes(report.ai_summary.conclusion));
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
