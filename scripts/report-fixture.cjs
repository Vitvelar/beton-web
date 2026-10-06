/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script, like the other verify-*.cjs */
// Sameiginlegt fyrir verify-report-format.cjs, verify-report-identity.cjs og scripts/nz-sample/:
// hleður .ts/.tsx-einingum án byggingar og rendrar RAUNVERULEGU skýrslusíðuna
// (src/app/(dashboard)/dashboard/[id]/report/page.tsx) úr tilbúnum gögnum, og þaðan
// í PDF um framleiðsluleiðina (src/lib/report/render-pdf.ts). Engin auðkenning,
// engin viðskiptavinagögn, ekkert AI-kall, ekkert net nema 127.0.0.1.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const root = path.resolve(__dirname, '..');

// Finnur .ts/.tsx fyrir `@/…` og `./…` innflutning svo síðan geti hlaðið eigin einingar.
function resolveTs(base) {
  for (const f of [base, base + '.ts', base + '.tsx', path.join(base, 'index.ts')]) if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  return null;
}
function load(file, mocks = {}) {
  const filename = path.resolve(root, file);
  const local = name => {
    const base = name.startsWith('@/') ? path.join(root, 'src', name.slice(2))
      : name.startsWith('.') ? path.resolve(path.dirname(filename), name) : null;
    const found = base && resolveTs(base);
    return found ? load(path.relative(root, found), mocks) : require(name);
  };
  const context = { exports: {}, process, console, Uint8Array, setTimeout, clearTimeout, Intl,
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : local(name) };
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  }).outputText;
  vm.runInNewContext(code, context, { filename });
  return context.exports;
}

const PAGE_FILE = 'src/app/(dashboard)/dashboard/[id]/report/page.tsx';

// Supabase-líki: hvert select á `inspections` skilar færslunni; myndir fá fastar
// afstæðar slóðir (/fixture-photos/<storage_path>) svo markup-ið sé ákvarðað.
function fixtureClient(record) {
  const query = {
    select() { return this; }, limit() { return this; }, eq() { return this; }, or() { return this; },
    async maybeSingle() { return { data: record, error: null }; },
  };
  return {
    from: () => query,
    storage: { from: () => ({ async createSignedUrl(p) { return { data: { signedUrl: `/fixture-photos/${p}` }, error: null }; } }) },
  };
}

// Hleður skýrslusíðunni með sömu mocks og verify-report-format notaði frá upphafi.
function loadReportPage(record, { dashboardLocale = 'is', brand = 'beton' } = {}) {
  const date = load('src/lib/report/date.ts');
  const shared = load('src/lib/report/shared.ts', { './date': date });
  const client = fixtureClient(record);
  return load(PAGE_FILE, {
    '@/lib/report/typography.css': {}, '@/lib/report/date': date, '@/lib/report/shared': shared,
    'next/navigation': { notFound: () => { throw new Error('Unexpected notFound'); } },
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children), __esModule: true },
    'next/headers': { headers: async () => new Headers() },
    '@/lib/supabase/server': { createClient: async () => client },
    '@/lib/supabase/service': { createServiceClient: () => client },
    '@/lib/supabase/bearer': { getBearerAuthorization: () => null },
    '@/lib/request-brand': { getDashboardLocale: async () => dashboardLocale, getRequestBrand: async () => brand },
  });
}

async function renderReportMarkup(record, { pdf = true, ...opts } = {}) {
  const page = loadReportPage(record, opts);
  const element = await page.default({ params: Promise.resolve({ id: record.id || 'fixture' }), searchParams: Promise.resolve(pdf ? { pdf: '1' } : {}) });
  return renderToStaticMarkup(element);
}

// Raunverulegir þýddir stílar forritsins (.next/static eftir `next build`) + skýrsluletrið.
function applicationCss() {
  function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(x => x.isDirectory() ? walk(path.join(dir, x.name)) : [path.join(dir, x.name)]); }
  const staticDir = path.join(root, '.next/static');
  const cssFiles = fs.existsSync(staticDir) ? walk(staticDir).filter(x => x.endsWith('.css')).sort() : [];
  if (!cssFiles.length) throw new Error('Run next build first to produce application styles');
  return cssFiles.map(x => fs.readFileSync(x, 'utf8')).join('\n') + '\n' + fs.readFileSync(path.join(root, 'src/lib/report/typography.css'), 'utf8');
}

function reportHtml(markup, css = applicationCss()) {
  return '<!doctype html><html lang="is"><meta charset="utf-8"><style>' + css + '</style><body>' + markup + '</body></html>';
}

const PUBLIC_ASSETS = {
  '/fonts/report/NotoSans-Regular.ttf': 'fonts/report/NotoSans-Regular.ttf',
  '/fonts/report/NotoSans-Bold.ttf': 'fonts/report/NotoSans-Bold.ttf',
  '/images/beton-logo.webp': 'images/beton-logo.webp',
};
const TYPES = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf' };

// Staðbundinn þjónn: /report/<nafn> = HTML, letur og merki úr public/, myndir úr `photos`
// (kort slóð → { body, type }) eða `photoDir`. Skilar { url(name), close() }.
async function serveReports(pages, { photos = {}, photoDir = null, failFonts = () => false } = {}) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    if (url.startsWith('/report/') && Object.hasOwn(pages, url.slice(8))) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(pages[url.slice(8)]); return;
    }
    if (PUBLIC_ASSETS[url] && !(failFonts() && url.startsWith('/fonts/'))) { res.end(fs.readFileSync(path.join(root, 'public', PUBLIC_ASSETS[url]))); return; }
    if (url.startsWith('/fixture-photos/')) {
      const key = url.slice('/fixture-photos/'.length);
      const photo = photos[key];
      if (photo) { res.setHeader('Content-Type', photo.type); res.end(photo.body); return; }
      const file = photoDir && path.join(photoDir, path.basename(key));
      if (file && fs.existsSync(file)) { res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file)); return; }
    }
    res.statusCode = 404; res.end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {
    url: name => `http://127.0.0.1:${server.address().port}/report/${name}`,
    close: () => new Promise(resolve => server.close(resolve)),
  };
}

function loadRenderer() {
  process.env.PUPPETEER_EXECUTABLE_PATH ||= '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  return load('src/lib/report/render-pdf.ts');
}

// Tilbúin staðgengilsmynd (SVG með lit og merkimiða) — aldrei raunmyndir viðskiptavina.
function placeholderSvg(label, { width = 800, height = 600, fill = '#9aa5b1' } = {}) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="100%" height="100%" fill="${fill}"/>` +
    `<rect x="16" y="16" width="${width - 32}" height="${height - 32}" fill="none" stroke="#ffffff" stroke-width="4" stroke-dasharray="18 12"/>` +
    `<text x="50%" y="46%" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" fill="#ffffff">PLACEHOLDER PHOTO</text>` +
    `<text x="50%" y="58%" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#ffffff">${esc(label)}</text>` +
    '</svg>', 'utf8');
}

module.exports = { root, resolveTs, load, PAGE_FILE, fixtureClient, loadReportPage, renderReportMarkup, applicationCss, reportHtml, serveReports, loadRenderer, placeholderSvg };
