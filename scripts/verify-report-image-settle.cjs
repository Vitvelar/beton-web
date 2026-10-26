/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script */
// PDF-workerinn má ekki prenta áður en myndir skýrslunnar hafa hlaðist. networkidle2 leyfir 2 opnar
// beiðnir í 500 ms, svo í skýrslu með 2 myndir skilaði goto áður en þær komu og forsíðan varð grár
// kassi (Rondva US-prófun 2026-10-26, skoðun a4862d97: PDF 340 KB < 375 KB forsíðu-JPEG — Chromium
// setur JPEG óbreytt inn, svo myndin var ekki í PDF-inu). Þetta próf þjónar 2-mynda skýrslu af
// localhost með myndum sem berast eftir 3 s, keyrir renderReportPdf með staðbundnu Chrome og telur
// innfelldar myndir með pdfimages. Án Chrome/pdfimages: aðeins kyrrstæð athugun (SKIP prentað).
// Run: node scripts/verify-report-image-settle.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const Module = require('node:module');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const renderTs = path.join(root, 'src/lib/report/render-pdf.ts');
const source = fs.readFileSync(renderTs, 'utf8');

// Kyrrstætt: beðið eftir myndum á milli goto og page.pdf.
const iGoto = source.indexOf('page.goto(');
const iWait = source.indexOf('await waitForImages(page');
const iPdf = source.indexOf('page.pdf(');
assert.ok(iGoto > 0 && iWait > iGoto && iPdf > iWait, 'waitForImages verður að keyra milli goto og page.pdf');
assert.match(source, /setJavaScriptEnabled\(false\)/, 'JS á að vera óvirkt (pólun úr Node, ekki síðu-hlustarar)');
console.log('ok  static: waitForImages milli goto og page.pdf');

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH
  || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium']
    .find((p) => fs.existsSync(p));
let havePdfImages = true;
try { execFileSync('pdfimages', ['-v'], { stdio: 'ignore' }); } catch { havePdfImages = false; }
if (!CHROME || !havePdfImages) {
  console.log(`SKIP render: ${!CHROME ? 'Chrome' : 'pdfimages (poppler)'} fannst ekki — aðeins kyrrstæð athugun keyrð`);
  process.exit(0);
}
process.env.PUPPETEER_EXECUTABLE_PATH = CHROME;

const m = new Module(renderTs);
m.paths = Module._nodeModulePaths(path.dirname(renderTs));
m.filename = renderTs;
m._compile(ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText, renderTs);
const { renderReportPdf } = m.exports;

const jpgA = fs.readFileSync(path.join(root, 'public/images/inspection.jpg'));
const jpgB = fs.readFileSync(path.join(root, 'public/images/pricing.jpg'));
const font = (f) => fs.readFileSync(path.join(root, 'public/fonts/report', f));
const html = `<!doctype html><html><head><style>
@font-face{font-family:"Beton Report";font-weight:400;src:url(/f/r.ttf)}
@font-face{font-family:"Beton Report";font-weight:700;src:url(/f/b.ttf)}
body{font-family:"Beton Report"} .c{width:600px;height:320px;background:#ccc;overflow:hidden}
img{width:100%;height:100%;object-fit:cover}</style></head><body>
<article class="report-article"><b>Þak</b><div class="c"><img src="/img/a.jpg"></div>
<div class="c"><img src="/img/b.jpg"></div><div class="c"><img src="/img/hang.jpg"></div></article></body></html>`;

function serve(withHang) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/report') {
        res.setHeader('content-type', 'text/html');
        return res.end(withHang ? html : html.replace('<div class="c"><img src="/img/hang.jpg"></div>', ''));
      }
      if (req.url.startsWith('/f/')) return res.end(font(req.url === '/f/r.ttf' ? 'NotoSans-Regular.ttf' : 'NotoSans-Bold.ttf'));
      if (req.url === '/img/hang.jpg') return; // svarar aldrei
      if (req.url.startsWith('/img/')) {
        return setTimeout(() => { res.setHeader('content-type', 'image/jpeg'); res.end(req.url === '/img/a.jpg' ? jpgA : jpgB); }, 3000);
      }
      res.statusCode = 404; res.end();
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function embedded(pdf) {
  const out = path.join(os.tmpdir(), `verify-settle-${process.pid}-${Date.now()}.pdf`);
  fs.writeFileSync(out, pdf);
  try {
    return execFileSync('pdfimages', ['-list', out], { encoding: 'utf8' }).trim().split('\n').slice(2).length;
  } finally { fs.unlinkSync(out); }
}

(async () => {
  const log = console.log;
  console.log = () => {}; // „sleppi gs“-línur renderReportPdf
  const warns = [];
  const warn = console.warn;
  console.warn = (...a) => warns.push(a.join(' '));
  let server;
  try {
    // 1) Tvær myndir sem berast eftir 3 s: báðar verða að vera í PDF-inu (áður: 0).
    server = await serve(false);
    const pdf1 = await renderReportPdf(`http://127.0.0.1:${server.address().port}/report`, { pageLabel: 'Page' });
    server.close();
    const n1 = await embedded(pdf1);
    assert.ok(n1 >= 2, `seinar myndir vantar í PDF (${n1} innfelldar, búist við 2)`);
    assert.ok(pdf1.length > jpgA.length + jpgB.length, 'JPEG-bætin eiga að vera í PDF-inu');
    log(`ok  2 seinar myndir (3 s) innfelldar: ${n1}, ${pdf1.length} B`);

    // 2) Mynd sem svarar aldrei: þakið heldur, PDF prentast samt og viðvörun er skráð.
    server = await serve(true);
    const t0 = Date.now();
    const pdf2 = await renderReportPdf(`http://127.0.0.1:${server.address().port}/report`, { pageLabel: 'Page', imageSettleTimeoutMs: 5000 });
    const ms = Date.now() - t0;
    assert.ok(pdf2.length > 0 && ms < 30_000, `hangandi mynd á ekki að frysta workerinn (${ms} ms)`);
    assert.ok(warns.some((w) => /óhlaðnar 1/.test(w)), `viðvörun um óhlaðna mynd vantar: ${warns.join(' | ')}`);
    assert.ok((await embedded(pdf2)) >= 2, 'myndirnar sem hlóðust eiga að vera í PDF-inu þrátt fyrir hangandi mynd');
    log(`ok  hangandi mynd: prentað eftir ${ms} ms, viðvörun skráð`);
    log('verify-report-image-settle: ALLT Í LAGI');
  } catch (e) {
    log(String(e && e.stack || e));
    process.exitCode = 1;
  } finally {
    console.log = log;
    console.warn = warn;
    if (server) { server.closeAllConnections(); server.close(); }
  }
})();
