/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script */
// NZS 4306 sýnisskýrsla ÁN AI: tilbúin skoðun (sample-inspection.cjs) → raunverulega
// skýrslusíðan (report/page.tsx → Nzs4306Report) → framleiðsluleiðin render-pdf.ts → PDF.
// Krefst `next build` (CSS forritsins) og Chrome.
//
//   node scripts/nz-sample/render.cjs [úttaksmappa]
// Sjálfgefin úttaksmappa: <Beton>/plan/rondva/nz-sample (utan git). Skrifar
// nz-sample-report-draft.pdf, nz-sample-report.html og nz-sample-ai_report_data.json.
const fs = require('node:fs');
const path = require('node:path');
const { root, load, renderReportMarkup, reportHtml, serveReports, loadRenderer } = require('../report-fixture.cjs');
const { buildNzSampleRecord, samplePhotos } = require('./sample-inspection.cjs');

async function main() {
  const out = path.resolve(process.argv[2] || path.join(root, '..', '..', 'plan', 'rondva', 'nz-sample'));
  fs.mkdirSync(out, { recursive: true });
  const record = buildNzSampleRecord();
  const markup = await renderReportMarkup(record, { pdf: true, dashboardLocale: 'en', brand: 'rondva' });
  // <title> eins og generateMetadata skýrslusíðunnar gefur (PDF-heiti í skoðara).
  const date = load('src/lib/report/date.ts');
  const { reportTitle } = load('src/lib/report/shared.ts', { './date': date });
  const title = reportTitle(record.address, record.inspection_date, 'en').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const html = reportHtml(markup).replace('<meta charset="utf-8">', `<meta charset="utf-8"><title>${title}</title>`);
  fs.writeFileSync(path.join(out, 'nz-sample-report.html'), html);
  fs.writeFileSync(path.join(out, 'nz-sample-ai_report_data.json'), JSON.stringify(record.ai_report_data, null, 2) + '\n');
  const server = await serveReports({ sample: html }, { photos: samplePhotos(record) });
  try {
    const { reportCopy, reportLocaleOf } = load('src/lib/report/i18n.ts');
    const pdf = await loadRenderer().renderReportPdf(server.url('sample'), {
      pageLabel: reportCopy(reportLocaleOf(record.ai_report_data)).pageLabel,
    });
    const file = path.join(out, 'nz-sample-report-draft.pdf');
    fs.writeFileSync(file, pdf);
    console.log(`Wrote ${file} (${(pdf.length / 1024).toFixed(0)} KB)`);
  } finally { await server.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
