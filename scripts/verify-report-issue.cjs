/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script, like the other verify-*.cjs */
// „Sign & issue“ (report-2 PR 2): útgáfa NZS 4306-skýrslu.
//   node scripts/verify-report-issue.cjs
// Hluti A–C þarf ekkert nema node. Hluti D (PDF um render-pdf.ts → pdftotext) þarf `next build` (CSS
// forritsins) og Chrome, eins og verify-report-format.cjs; án byggingar er honum sleppt (SKIP).
// Engin auðkenning, engin viðskiptavinagögn, ekkert AI-kall, ekkert gagnagrunnskall.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { root, load, renderReportMarkup, reportHtml, serveReports, loadRenderer } = require('./report-fixture.cjs');
const { buildNzSampleRecord, issueNzSampleRecord, samplePhotos } = require('./nz-sample/sample-inspection.cjs');

const issueLib = load('src/lib/report/issue.ts');
const plain = html => html.replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const OPTS = { pdf: true, dashboardLocale: 'en', brand: 'rondva' };
const DRAFT_MARK = 'DRAFT — not issued';
const clone = value => JSON.parse(JSON.stringify(value));
const NOW = new Date('2026-10-20T20:15:00Z'); // 21.10.2026 09:15 í Auckland

async function main() {
  // ── A. issue.ts: hash, gildi, synjanir ──────────────────────────────────────
  const base = buildNzSampleRecord().ai_report_data;
  // hash óháð lyklaröð, undefined hunsað, `issue` ekki með
  const shuffled = Object.fromEntries(Object.entries(clone(base)).reverse());
  assert.equal(issueLib.reportContentHash(shuffled), issueLib.reportContentHash(base), 'content hash ignores key order');
  assert.equal(issueLib.reportContentHash({ ...base, issue: { anything: 1 } }), issueLib.reportContentHash(base), 'content hash excludes `issue`');
  assert.equal(issueLib.reportContentHash({ ...base, extra: undefined }), issueLib.reportContentHash(base), 'undefined keys ignored');
  const edited = clone(base); edited.ai_summary.conclusion += ' x';
  assert.notEqual(issueLib.reportContentHash(edited), issueLib.reportContentHash(base), 'text change changes the hash');
  console.log('PASS content hash: key-order independent, excludes `issue`, changes with any text change');

  assert.equal(issueLib.isIssuable(base), true);
  assert.equal(issueLib.isIssuable({ ...base, report_standard: 'default' }), false, 'default format is not issuable');
  assert.equal(issueLib.isIssuable({}), false);
  assert.equal(issueLib.isIssuable(null), false);

  const built = issueLib.buildIssue({ report: base, profileName: 'Profile Name', qualifications: '  NZIBI member  ', userId: 'u-1', now: NOW, timeZone: 'Pacific/Auckland' });
  assert.ok(built.issue, 'issues an NZS report');
  assert.equal(built.issue.issued_on, '2026-10-21', 'civil date is the inspector\'s local day, not UTC');
  assert.equal(built.issue.time_zone, 'Pacific/Auckland');
  assert.equal(built.issue.issued_at, '2026-10-20T20:15:00.000Z');
  assert.equal(built.issue.issued_by.name, 'Jordan Sample', 'inspection\'s own inspectorName wins over the profile name (same rule as the report page)');
  assert.equal(built.issue.issued_by.qualifications, 'NZIBI member');
  assert.equal(built.issue.issued_by.user_id, 'u-1');
  const noInspName = clone(base); delete noInspName.inspection.property_data.inspectorName;
  assert.equal(issueLib.buildIssue({ report: noInspName, profileName: ' Profile Name ', qualifications: null, userId: null, now: NOW }).issue.issued_by.name, 'Profile Name');
  assert.equal(issueLib.buildIssue({ report: noInspName, profileName: '  ', qualifications: null, userId: null, now: NOW }).refusal, 'no_name', 'no name anywhere → refuse (never the default name)');
  assert.equal(issueLib.buildIssue({ report: { ...base, report_standard: 'default' }, profileName: 'x', qualifications: null, userId: null, now: NOW }).refusal, 'not_issuable');
  const issuedReport = { ...base, issue: built.issue };
  assert.equal(issueLib.buildIssue({ report: issuedReport, profileName: 'x', qualifications: null, userId: null, now: NOW }).refusal, 'already_issued');
  // UTC-dagur og fall á UTC fyrir óþekkt belti
  assert.equal(issueLib.civilDateInZone(NOW, 'Pacific/Auckland').date, '2026-10-21');
  assert.equal(issueLib.civilDateInZone(NOW, 'UTC').date, '2026-10-20');
  assert.deepEqual({ ...issueLib.civilDateInZone(NOW, 'Not/AZone') }, { date: '2026-10-20', timeZone: 'UTC' });
  assert.deepEqual({ ...issueLib.civilDateInZone(NOW, undefined) }, { date: '2026-10-20', timeZone: 'UTC' });
  assert.equal(issueLib.civilDateInZone(new Date('2026-10-20T20:15:00Z'), 'America/Los_Angeles').date, '2026-10-20');
  console.log('PASS buildIssue: local civil date (NZ day, not UTC), name rule = report page rule, refuses default format / no name / already issued');

  // gild útgáfa ↔ óbreytt efni; hvaða breyting sem er → drög
  const issue = issueLib.issueOf(issuedReport);
  assert.deepEqual(JSON.parse(JSON.stringify(issue)), { issuedOn: '2026-10-21', inspectorName: 'Jordan Sample', qualifications: 'NZIBI member' });
  assert.equal(issueLib.hasStaleIssue(issuedReport), false);
  assert.ok(issueLib.issueOf(JSON.parse(JSON.stringify(issuedReport))), 'issue survives a JSON round trip (jsonb)');
  assert.ok(issueLib.issueOf(Object.fromEntries(Object.entries(issuedReport).reverse())), 'issue survives jsonb key reordering');
  const tamperers = {
    'summary text': r => { r.ai_summary.conclusion = 'Changed.'; },
    'observation text': r => { r.rooms[0].observations[0].description += '!'; },
    'rating': r => { r.rooms[0].ratings.site_drainage = 'ok'; },
    'severity': r => { r.rooms[0].observations[0].severity = 'athugasemd'; },
    'nzs4306 summary': r => { r.nzs4306.significant_defects_summary = 'x'; },
    'limitations': r => { r.nzs4306.conditions.limitations = 'x'; },
    'inspection field': r => { r.inspection.customer_name = 'Someone Else'; },
  };
  for (const [name, mutate] of Object.entries(tamperers)) {
    const r = clone(issuedReport); mutate(r);
    assert.equal(issueLib.issueOf(r), null, `${name} edited after issue → draft`);
    assert.equal(issueLib.hasStaleIssue(r), true, `${name}: stale issue is detected`);
  }
  for (const [name, mutate] of Object.entries({
    'no name': r => { r.issue.issued_by.name = ' '; }, 'bad date': r => { r.issue.issued_on = '2026-13-45'; },
    'no hash': r => { delete r.issue.content_sha256; }, 'wrong hash': r => { r.issue.content_sha256 = 'a'.repeat(64); },
    'not an object': r => { r.issue = 'issued'; }, 'default format': r => { r.report_standard = 'default'; },
  })) {
    const r = clone(issuedReport); mutate(r);
    assert.equal(issueLib.issueOf(r), null, `${name} → not issued`);
  }
  assert.deepEqual(clone(issueLib.withoutIssue(issuedReport)), clone(base), 'withoutIssue strips only the issue');
  assert.equal(issueLib.issueOf(issueLib.withoutIssue(issuedReport)), null, 'edit (updateReportText) and regeneration (edge) both drop `issue` → draft');
  console.log(`PASS issueOf: valid only for unchanged content (${Object.keys(tamperers).length} edit kinds + 6 malformed forms → draft); survives jsonb round trip`);

  // ── B. Skýrslusíðan: drög og útgefin ────────────────────────────────────────
  const draftRecord = buildNzSampleRecord();
  const draftMarkup = await renderReportMarkup(draftRecord, OPTS);
  const draft = plain(draftMarkup);
  const issuedRecord = issueNzSampleRecord(draftRecord, { now: NOW, timeZone: 'Pacific/Auckland' });
  const issuedMarkup = await renderReportMarkup(issuedRecord, OPTS);
  const issuedText = plain(issuedMarkup);

  assert.equal(draftMarkup.split(DRAFT_MARK).length - 1, 1, 'draft carries the watermark element');
  assert.ok(draftMarkup.includes('rpt-draft-mark'), 'draft watermark element');
  assert.ok(!issuedMarkup.includes(DRAFT_MARK) && !issuedMarkup.includes('rpt-draft-mark'), 'issued report has no watermark');
  for (const s of ['Draft — not yet issued', 'Certificate: to be signed when the inspector issues this report.', 'Until then this draft carries no signature.', 'Not yet reviewed or issued.']) assert.ok(draft.includes(s), `draft says "${s}"`);
  for (const s of ['I certify', 'Prepared in accordance with NZS 4306:2005', 'Prepared and issued by', 'Reviewed and issued by', 'Signature', 'Date issued']) assert.ok(!draft.includes(s), `draft never says "${s}"`);
  assert.ok(issuedText.includes('Prepared in accordance with NZS 4306:2005'), 'issued cover');
  assert.ok(issuedText.includes('I certify that I carried out the inspection of the property at the site address above on the date stated, and that this report has been prepared in accordance with NZS 4306:2005.'), 'issued certificate');
  assert.ok(issuedText.includes('Prepared and issued by Jordan Sample, NZIBI member, LBP 000000 (sample) · 21/10/2026'), 'issued prepared-by line');
  assert.ok(issuedText.includes('Observations and ratings by Jordan Sample, Example Inspections Ltd. Text drafted with AI assistance (5/10/2026). Reviewed and issued by Jordan Sample on 21/10/2026.'), 'issued disclosure');
  assert.ok(issuedText.includes('Issued by') && issuedText.includes('Date issued'), 'issued signature block');
  for (const s of ['Not yet reviewed or issued', 'Draft — not yet issued', 'Certificate: to be signed', 'This draft carries no signature']) assert.ok(!issuedText.includes(s), `issued report never says "${s}"`);
  for (const s of ['Drafting model', 'made and reviewed by']) assert.ok(!issuedText.includes(s) && !draft.includes(s), `no "${s}"`);
  // Aðeins þetta breytist: yfirlýsingin/vottorðið/forsíðulínan/vatnsmerkið — restin af textanum er eins.
  const strip = t => t.replace(/Draft — not yet issued|Prepared in accordance with NZS 4306:2005/g, '').replace(DRAFT_MARK, '');
  const sectionAfter = (t, from) => t.slice(t.indexOf(from));
  assert.equal(sectionAfter(strip(draft), 'Property and inspection conditions').slice(0, 20000).replace(/Use of AI in this report[^]*$/, ''),
    sectionAfter(strip(issuedText), 'Property and inspection conditions').slice(0, 20000).replace(/Use of AI in this report[^]*$/, ''), 'sections 3 … limitations are identical in draft and issued');
  console.log('PASS NZS 4306 draft vs issued: watermark + "Draft — not yet issued" + no certification before issue; certificate, signature block, "Prepared and issued by … · 21/10/2026" and "Reviewed and issued by … on 21/10/2026" after');

  // útgefin → breytt efni → drög; útgefin undir geymdu nafni þótt prófíll breytist
  const tampered = issueNzSampleRecord(buildNzSampleRecord(), { now: NOW, timeZone: 'Pacific/Auckland' });
  tampered.ai_report_data.ai_summary.conclusion = 'Edited after issue.';
  const tamperedMarkup = await renderReportMarkup(tampered, OPTS);
  assert.ok(tamperedMarkup.includes(DRAFT_MARK) && !plain(tamperedMarkup).includes('I certify'), 'content changed after issue → watermark again, no certification');
  const renamed = issueNzSampleRecord(buildNzSampleRecord(), { now: NOW, timeZone: 'Pacific/Auckland' });
  renamed.inspectors.full_name = 'Someone Else'; renamed.inspectors.qualifications = 'Other quals';
  const renamedText = plain(await renderReportMarkup(renamed, OPTS));
  assert.ok(renamedText.includes('Prepared and issued by Jordan Sample, NZIBI member, LBP 000000 (sample) · 21/10/2026') && !renamedText.includes('Other quals'), 'issued name/qualifications are frozen at issue time');
  // enginn útgáfa án réttinda: engin kommu
  const noQuals = buildNzSampleRecord(); noQuals.inspectors.qualifications = null;
  const noQualsText = plain(await renderReportMarkup(issueNzSampleRecord(noQuals, { now: NOW }), OPTS));
  assert.ok(noQualsText.includes('Prepared and issued by Jordan Sample · ') && !noQualsText.includes('Prepared and issued by Jordan Sample,'), 'no qualifications → name only');
  console.log('PASS issue lifecycle in the page: edited-after-issue → draft again; issued name/qualifications frozen; no stray comma without qualifications');

  // ── C. Beton / önnur snið: óbreytt ───────────────────────────────────────────
  // Útgáfa í ai_report_data á skýrslu sem er EKKI NZS 4306 (t.d. fölsuð) hefur engin áhrif: ekkert vatnsmerki, markup eins.
  for (const locale of ['is', 'en']) {
    const plainRec = buildNzSampleRecord();
    delete plainRec.ai_report_data.report_standard; plainRec.ai_report_data.report_locale = locale;
    const withIssue = clone(plainRec);
    withIssue.ai_report_data.issue = { ...built.issue, content_sha256: issueLib.reportContentHash(withIssue.ai_report_data) };
    const a = await renderReportMarkup(plainRec, { pdf: true, dashboardLocale: locale, brand: locale === 'is' ? 'beton' : 'rondva' });
    const b = await renderReportMarkup(withIssue, { pdf: true, dashboardLocale: locale, brand: locale === 'is' ? 'beton' : 'rondva' });
    assert.equal(a, b, `non-NZS (${locale}) report ignores ai_report_data.issue`);
    assert.ok(!a.includes('rpt-draft-mark') && !a.includes(DRAFT_MARK) && !a.includes('Draft — not yet issued'), `no watermark on a non-NZS (${locale}) report`);
  }
  console.log('PASS Beton/default format: no watermark, no sign flow, markup unchanged by a (forged) `issue` key (identity goldens: verify-report-identity.cjs)');

  // Skýrsluspjaldið (ReportActions): án `issue` propsins nákvæmlega eins og á origin/main (Beton og öll önnur snið).
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const cardMocks = {
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children), __esModule: true },
    '@/components/dashboard/ReportProgress': { ReportProgress: () => null },
    './actions': { generateReport: async () => ({}), sendToDrive: async () => ({}), issueReport: async () => ({}) },
  };
  const CARD = 'src/app/(dashboard)/dashboard/[id]/report-actions.tsx';
  const cardProps = { inspectionId: 'i-1', reportUrl: 'https://example.test/r.pdf', hasAiReport: true, canSendToDrive: true };
  const renderCard = (file, props, locale) => renderToStaticMarkup(React.createElement(load(file, cardMocks).ReportActions, { ...cardProps, locale, ...props }));
  const issueUi = { token: 't', issuedOn: null, issuedBy: null, name: 'Jordan Sample', qualifications: 'NZIBI member', ready: true, rendering: false };
  const draftCard = renderCard(CARD, { issue: issueUi }, 'en');
  const issuedCard = renderCard(CARD, { issue: { ...issueUi, issuedOn: '2026-10-21', issuedBy: 'Jordan Sample' } }, 'en');
  const renderingCard = renderCard(CARD, { issue: { ...issueUi, issuedOn: '2026-10-21', issuedBy: 'Jordan Sample', ready: false, rendering: true } }, 'en');
  assert.ok(draftCard.includes('Sign &amp; issue') && draftCard.includes('Draft — not issued') && draftCard.includes('I have reviewed this report and issue it under my name.') && draftCard.includes('Jordan Sample') && draftCard.includes('NZIBI member'), 'draft card: button, status, dialog with name + qualifications + confirmation');
  assert.ok(draftCard.includes('<dialog') && /<button[^>]*disabled=""[^>]*>Issue report<\/button>/.test(draftCard), 'the dialog confirm button starts disabled');
  assert.ok(!issuedCard.includes('>Sign &amp; issue<') && issuedCard.includes('Issued by Jordan Sample on 21/10/2026'), 'issued card: no Sign & issue button, shows who/when');
  assert.ok(renderingCard.includes('The issued PDF is being created') && !renderingCard.includes('Download PDF'), 'while the issued PDF renders the old (draft) PDF is not offered');
  assert.ok(/<button[^>]*disabled=""[^>]*>Sign &amp; issue<\/button>/.test(renderCard(CARD, { issue: { ...issueUi, ready: false, rendering: true } }, 'en')), 'Sign & issue is disabled until the PDF is ready');
  const isCard = renderCard(CARD, { issue: issueUi }, 'is');
  assert.ok(isCard.includes('Ég hef yfirfarið þessa skýrslu') && isCard.includes('Drög — ekki útgefin'), 'Icelandic dashboard copy exists');
  const bare = renderCard(CARD, {}, 'is');
  assert.ok(!bare.includes('<dialog') && !bare.includes('issue') && !bare.toLowerCase().includes('draft'), 'no issue prop → no dialog, no status line');
  let baseCard = null;
  try {
    const old = execFileSync('git', ['-C', root, 'show', `origin/main:${CARD}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'verify-report-issue-card-')), 'report-actions.tsx');
    fs.writeFileSync(tmp, old);
    baseCard = tmp;
  } catch { /* origin/main ekki aðgengilegt (grunn klón) */ }
  if (baseCard) {
    for (const locale of ['is', 'en']) assert.equal(renderCard(CARD, {}, locale), renderCard(baseCard, {}, locale), `report card without \`issue\` is byte-identical to origin/main (${locale})`);
    console.log('PASS ReportActions: without the `issue` prop the card is byte-identical to origin/main (is, en); with it: Sign & issue + dialog (draft), status line (issued), no stale download while rendering');
  } else {
    console.log('PASS ReportActions states (draft / issued / rendering, is+en); SKIP byte comparison with origin/main (not reachable)');
  }

  // Server-aðgerðin og viðmótið: vörn gegn Beton, eiganda, stöðu og samhliða breytingum.
  const actions = fs.readFileSync(path.join(root, 'src/app/(dashboard)/dashboard/[id]/actions.ts'), 'utf8');
  const issueFn = actions.slice(actions.indexOf('export async function issueReport'), actions.indexOf('export async function getReportProgress'));
  assert.ok(issueFn.length > 2000 && issueFn.includes('enqueuePdfRender'), 'sliced the whole issueReport function');
  assert.ok(/getRequestBrand\(\)\) !== "rondva"/.test(issueFn), 'issueReport refuses any host except app.rondva.com');
  assert.ok(/isIssuable\(report\)/.test(issueFn) && /resolveBranding\(inspector\)\.isBeton/.test(issueFn), 'issueReport refuses non-NZS reports and the Beton company');
  assert.ok(/inspector\.id !== inspection\.inspector_id/.test(issueFn), 'only the inspector who owns the inspection can issue');
  assert.ok(/snapshotToken\(report\) !== expectedToken/.test(issueFn) && /\.eq\("status", "report_ready"\)/.test(issueFn) && /\.eq\("updated_at", inspection\.updated_at\)/.test(issueFn), 'issue is conditional on the reviewed snapshot (token + status + updated_at)');
  assert.ok(/confirmed !== true/.test(issueFn), 'issue needs the explicit confirmation');
  assert.ok(/await revert\(\)/.test(issueFn) && /issueRenderBusy/.test(issueFn), 'issue is rolled back when no fresh PDF render can be queued');
  assert.ok(/\.eq\("ai_report_data->issue->>issued_at", built\.issue\.issued_at\)/.test(issueFn), 'the rollback only applies while the snapshot still carries THIS issue (never clobbers a newer AI run/edit)');
  assert.ok(!/anthropic|generate-report|functions\.invoke/i.test(issueFn), 'issuing never runs the AI');
  const updateFn = actions.slice(actions.indexOf('export async function updateReportText'), actions.indexOf('export async function issueReport'));
  assert.ok(/\.\.\.withoutIssue\(snapshot\)/.test(updateFn), 'a text edit drops the issue (report returns to draft)');
  const ui = fs.readFileSync(path.join(root, 'src/app/(dashboard)/dashboard/[id]/page.tsx'), 'utf8');
  assert.ok(/brand !== "rondva"/.test(ui) && /isIssuable\(report\)\) return null/.test(ui), 'the inspection page offers Sign & issue only on app.rondva.com for NZS reports');
  const card = fs.readFileSync(path.join(root, 'src/app/(dashboard)/dashboard/[id]/report-actions.tsx'), 'utf8');
  assert.ok(/issue && !issue\.issuedOn/.test(card) && /disabled=\{!confirmed \|\| issuing\}/.test(card), 'Sign & issue button needs `issue`; the confirm button needs the checkbox');
  const copy = load('src/lib/i18n/dashboard.ts');
  assert.equal(copy.DASHBOARD_COPY.en.reportActions.issueConfirmLabel, 'I have reviewed this report and issue it under my name.');
  assert.equal(copy.DASHBOARD_COPY.en.reportActions.issueButton, 'Sign & issue');
  console.log('PASS issueReport / UI guards: rondva host only, NZS only, never the Beton company, owner only, token+status+updated_at conditional write, explicit confirmation, rollback without a fresh render, never runs the AI; text edit drops the issue');

  // ── D. PDF: vatnsmerki á HVERRI síðu óútgefinnar skýrslu, ekkert á útgefinni ──────
  let built_ = true;
  try { require('./report-fixture.cjs').applicationCss(); } catch { built_ = false; }
  if (!built_) { console.log('SKIP PDF checks: run `next build` first (application CSS), then re-run'); return; }
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-report-issue-'));
  const pages = { draft: reportHtml(draftMarkup), issued: reportHtml(issuedMarkup) };
  const server = await serveReports(pages, { photos: samplePhotos(draftRecord) });
  try {
    const renderer = loadRenderer();
    const pdfs = {};
    for (const name of Object.keys(pages)) {
      const file = path.join(out, `${name}.pdf`);
      fs.writeFileSync(file, await renderer.renderReportPdf(server.url(name), { pageLabel: 'Page', pageOfLabel: 'of', footerCompany: 'Example Inspections Ltd' }));
      pdfs[name] = file;
    }
    const pageCount = file => Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [file], { encoding: 'utf8' }))[1]);
    const rawPage = (file, n) => execFileSync('pdftotext', ['-raw', '-f', String(n), '-l', String(n), file, '-'], { encoding: 'utf8' });
    const nDraft = pageCount(pdfs.draft);
    assert.equal(pageCount(pdfs.issued), nDraft, 'the watermark and the certificate change no page breaks');
    for (let n = 1; n <= nDraft; n++) {
      assert.ok(rawPage(pdfs.draft, n).includes('DRAFT'), `draft page ${n}/${nDraft} carries the watermark`);
      assert.ok(!rawPage(pdfs.issued, n).includes('DRAFT'), `issued page ${n}/${nDraft} carries no watermark`);
    }
    const draftPdf = execFileSync('pdftotext', ['-layout', pdfs.draft, '-'], { encoding: 'utf8' });
    const issuedPdf = execFileSync('pdftotext', ['-layout', pdfs.issued, '-'], { encoding: 'utf8' });
    for (const s of ['Draft — not yet issued', 'Certificate: to be signed when the inspector issues this report.', 'Not yet reviewed or issued.']) assert.ok(draftPdf.includes(s), `draft PDF: ${s}`);
    assert.ok(!draftPdf.includes('I certify'), 'draft PDF never certifies');
    for (const s of ['Prepared and issued by Jordan Sample, NZIBI member, LBP 000000 (sample) · 21/10/2026', 'Reviewed and issued by Jordan Sample on 21/10/2026.', 'I certify that I carried out']) assert.ok(issuedPdf.replace(/\s+/g, ' ').includes(s), `issued PDF: ${s}`);
    console.log(`PASS PDF via render-pdf.ts: DRAFT watermark on all ${nDraft}/${nDraft} draft pages, on 0 issued pages; same page count; certificate + "Prepared and issued by" only on the issued PDF (${out})`);
  } finally { await server.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
