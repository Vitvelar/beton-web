/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script */
// isop sýnisskýrsla ÁN AI: tilbúin skoðun (sample-inspection.cjs) → raunverulega skýrslusíðan
// (report/page.tsx → IsopReport) → framleiðsluleiðin render-pdf.ts → PDF. Krefst `next build` (CSS forritsins) og Chrome.
//
//   node scripts/isop-sample/render.cjs [úttaksmappa]            # DRAFT-útgáfur utan git (US + CA)
//   node scripts/isop-sample/render.cjs --public                 # → public/rondva/sample-home-inspection-{us,ca}.pdf
// Sjálfgefin úttaksmappa: <Beton>/plan/rondva/isop-sample (utan git). Skrifar isop-sample-{us,ca}-draft.pdf,
// isop-sample-{us,ca}.html og isop-sample-ai_report_data.json.
// Sýnið er merkt heiðarlega: borði efst á forsíðu og SAMPLE_NOTICE í fæti hverrar síðu. Ekkert á lifandi síðum tengist skránni.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { root, load, renderReportMarkup, reportHtml, serveReports, loadRenderer } = require('../report-fixture.cjs');
const { buildIsopSampleRecord, samplePhotos, SAMPLE_NOTICE } = require('./sample-inspection.cjs');

const VARIANTS = [
  { key: 'us', variant: 'en-US', publicName: 'sample-home-inspection-us.pdf' },
  { key: 'ca', variant: 'en-CA', publicName: 'sample-home-inspection-ca.pdf' },
];
const MAX_PUBLIC_BYTES = 3 * 1024 * 1024;

const escapeHtml = (v) => v.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Borði efst á forsíðu (HTML sem skýrsluskoðarinn prentar með); SAMPLE_NOTICE orðrétt. */
function sampleBanner() {
  return '<div style="border:1.5px solid #b45309;background:#fff7ed;color:#7c2d12;padding:8px 12px;margin:0 0 10px;' +
    'font:600 12px/1.4 Helvetica,Arial,sans-serif;text-align:center;">' + escapeHtml(SAMPLE_NOTICE) + '</div>';
}

/** Ghostscript /ebook (eins og worker tick á stórum skýrslum). */
function compress(inFile, outFile) {
  execFileSync('gs', ['-q', '-dNOPAUSE', '-dBATCH', '-dSAFER', '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.5', '-dPDFSETTINGS=/ebook', `-sOutputFile=${outFile}`, inFile], { stdio: 'inherit' });
}

async function renderOne({ key, variant }, out) {
  const record = buildIsopSampleRecord(variant);
  const markup = sampleBanner() + await renderReportMarkup(record, { pdf: true, dashboardLocale: 'en', brand: 'rondva' });
  // <title> eins og generateMetadata skýrslusíðunnar gefur (PDF-heiti í skoðara).
  const date = load('src/lib/report/date.ts');
  const { reportTitle } = load('src/lib/report/shared.ts', { './date': date });
  const title = escapeHtml(`Sample — ${reportTitle(record.address, record.inspection_date, 'en')}`);
  const html = reportHtml(markup).replace('<meta charset="utf-8">', `<meta charset="utf-8"><title>${title}</title>`);
  fs.writeFileSync(path.join(out, `isop-sample-${key}.html`), html);
  if (key === 'us') fs.writeFileSync(path.join(out, 'isop-sample-ai_report_data.json'), JSON.stringify(record.ai_report_data, null, 2) + '\n');
  const server = await serveReports({ sample: html }, { photos: samplePhotos(record) });
  try {
    const { reportCopy, reportLocaleOf } = load('src/lib/report/i18n.ts');
    const copy = reportCopy(reportLocaleOf(record.ai_report_data));
    const pdf = await loadRenderer().renderReportPdf(server.url('sample'), {
      pageLabel: copy.pageLabel,
      pageOfLabel: copy.pageOfLabel,
      footerCompany: SAMPLE_NOTICE, // fótur hverrar síðu: „{SAMPLE_NOTICE} · Page n of N“
    });
    const file = path.join(out, `isop-sample-${key}-draft.pdf`);
    fs.writeFileSync(file, pdf);
    console.log(`Wrote ${file} (${(pdf.length / 1024).toFixed(0)} KB)`);
    return file;
  } finally { await server.close(); }
}

async function main() {
  const args = process.argv.slice(2);
  const publish = args.includes('--public');
  const dir = args.find(a => !a.startsWith('--'));
  const out = path.resolve(dir || path.join(root, '..', '..', 'plan', 'rondva', 'isop-sample'));
  fs.mkdirSync(out, { recursive: true });
  for (const v of VARIANTS) {
    const raw = await renderOne(v, out);
    if (!publish) continue;
    const dest = path.join(root, 'public', 'rondva', v.publicName);
    // gs /ebook minnkar 644 KB → ~250 KB en missir „fi“-bókstafatengi úr textaútdrætti (pdftotext: „ndings“), svo
    // þjappað er aðeins þegar skráin nær ekki undir mörkin (t.d. ef raunverulegar myndir koma í stað staðgengla).
    if (fs.statSync(raw).size < MAX_PUBLIC_BYTES) fs.copyFileSync(raw, dest); else compress(raw, dest);
    const size = fs.statSync(dest).size;
    if (size >= MAX_PUBLIC_BYTES) throw new Error(`${v.publicName} is ${size} bytes (limit ${MAX_PUBLIC_BYTES})`);
    console.log(`Wrote ${dest} (${(size / 1024).toFixed(0)} KB)`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
