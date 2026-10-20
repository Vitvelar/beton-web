/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script */
// isop sýnisskýrsla ÁN AI: tilbúin skoðun (sample-inspection.cjs) → raunverulega skýrslusíðan
// (report/page.tsx → IsopReport) → framleiðsluleiðin render-pdf.ts → PDF. Krefst `next build` (CSS forritsins) og Chrome.
//
//   node scripts/isop-sample/render.cjs [úttaksmappa]
// Sjálfgefin úttaksmappa: <Beton>/plan/rondva/isop-sample (utan git). Skrifar isop-sample-us-draft.pdf,
// isop-sample-us.html og isop-sample-ai_report_data.json.
const fs = require('node:fs');
const path = require('node:path');
const { root, load, renderReportMarkup, reportHtml, serveReports, loadRenderer } = require('../report-fixture.cjs');
const { buildIsopSampleRecord, samplePhotos } = require('./sample-inspection.cjs');

async function main() {
  const out = path.resolve(process.argv[2] || path.join(root, '..', '..', 'plan', 'rondva', 'isop-sample'));
  fs.mkdirSync(out, { recursive: true });
  const record = buildIsopSampleRecord();
  const markup = await renderReportMarkup(record, { pdf: true, dashboardLocale: 'en', brand: 'rondva' });
  // <title> eins og generateMetadata skýrslusíðunnar gefur (PDF-heiti í skoðara).
  const date = load('src/lib/report/date.ts');
  const { reportTitle } = load('src/lib/report/shared.ts', { './date': date });
  const title = reportTitle(record.address, record.inspection_date, 'en').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const html = reportHtml(markup).replace('<meta charset="utf-8">', `<meta charset="utf-8"><title>${title}</title>`);
  fs.writeFileSync(path.join(out, 'isop-sample-us.html'), html);
  fs.writeFileSync(path.join(out, 'isop-sample-ai_report_data.json'), JSON.stringify(record.ai_report_data, null, 2) + '\n');
  const server = await serveReports({ sample: html }, { photos: samplePhotos(record) });
  try {
    const { reportCopy, reportLocaleOf } = load('src/lib/report/i18n.ts');
    const copy = reportCopy(reportLocaleOf(record.ai_report_data));
    const pdf = await loadRenderer().renderReportPdf(server.url('sample'), {
      pageLabel: copy.pageLabel,
      pageOfLabel: copy.pageOfLabel,
      footerCompany: record.inspectors.company_name, // eins og worker tick: „{Company} · Page n of N“ á skýrslum sem eru ekki íslenskar
    });
    const file = path.join(out, 'isop-sample-us-draft.pdf');
    fs.writeFileSync(file, pdf);
    console.log(`Wrote ${file} (${(pdf.length / 1024).toFixed(0)} KB)`);
  } finally { await server.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
