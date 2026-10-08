/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script */
// Skýrslumál og matskerfi (src/lib/report/settings.ts): sama regla og beton-app
// supabase/functions/generate-report/report-settings.ts (scripts/verify-report-language.cjs
// þar prófar sömu töflu). Keyrt með `node scripts/verify-report-settings.cjs`.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function load(rel) {
  const file = path.join(__dirname, '..', rel);
  const context = { exports: {}, Intl, require: (id) => (id.startsWith('./') ? load(path.join(path.dirname(rel), id) + '.ts') : require(id)) };
  context.module = { exports: context.exports };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, context);
  return context.module.exports;
}
const { resolveReportSettings: r, ratingSchemeOf, reportStandardOf } = load('src/lib/report/settings.ts');
const { REPORT_COPY } = load('src/lib/report/i18n.ts');
const same = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b);

// Sama tafla og beton-app scripts/verify-report-language.cjs (samningur:
// plan/rondva/NZ-SKYRSLUSNID-HONNUN.md + ENSK-AFBRIGDI-HONNUN.md). [inntak, vænt]
// Enskt afbrigði (Phase 1): enskar niðurstöður hafa englishVariant eftir landi; íslenskar engan.
const TABLE = [
  [null, { locale: 'is', scheme: 'standard', standard: 'default' }],
  [{ country_code: 'IS' }, { locale: 'is', scheme: 'standard', standard: 'default' }],
  [{ country_code: 'gb' }, { locale: 'en', scheme: 'condition_1_3', standard: 'default', englishVariant: 'en-GB' }],
  [{ country_code: 'IE' }, { locale: 'en', scheme: 'condition_1_3', standard: 'default', englishVariant: 'en-IE' }],
  [{ country_code: 'US' }, { locale: 'en', scheme: 'standard', standard: 'default', englishVariant: 'en-US' }],
  [{ country_code: 'AU' }, { locale: 'en', scheme: 'standard', standard: 'default', englishVariant: 'en-AU' }],
  [{ country_code: ' ca ' }, { locale: 'en', scheme: 'standard', standard: 'default', englishVariant: 'en-CA' }],
  [{ country_code: 'DE' }, { locale: 'en', scheme: 'standard', standard: 'default', englishVariant: 'en' }],
  [{ country_code: 'IS', report_locale: 'en', rating_scheme: 'standard', report_standard: null }, { locale: 'en', scheme: 'standard', standard: 'default', englishVariant: 'en' }],
  [{ country_code: 'GB', report_locale: 'is', rating_scheme: 'standard' }, { locale: 'is', scheme: 'standard', standard: 'default' }],
  [{ country_code: 'IS', report_locale: 'de', rating_scheme: 'rics' }, { locale: 'is', scheme: 'standard', standard: 'default' }],
  // NZS 4306: NZ → nzs_4306 + nz_terms + en; skráð gildi vinna; rusl hunsað.
  [{ country_code: 'NZ' }, { locale: 'en', scheme: 'nz_terms', standard: 'nzs_4306', englishVariant: 'en-NZ' }],
  [{ country_code: ' nz ' }, { locale: 'en', scheme: 'nz_terms', standard: 'nzs_4306', englishVariant: 'en-NZ' }],
  [{ country_code: 'NZ', report_standard: 'default' }, { locale: 'en', scheme: 'standard', standard: 'default', englishVariant: 'en-NZ' }],
  [{ country_code: 'NZ', rating_scheme: 'condition_1_3' }, { locale: 'en', scheme: 'condition_1_3', standard: 'nzs_4306', englishVariant: 'en-NZ' }],
  [{ country_code: 'NZ', report_standard: 'nzs4306', rating_scheme: 'nz' }, { locale: 'en', scheme: 'nz_terms', standard: 'nzs_4306', englishVariant: 'en-NZ' }],
  [{ country_code: 'IS', report_standard: 'nzs_4306' }, { locale: 'is', scheme: 'nz_terms', standard: 'nzs_4306' }],
  [{ country_code: 'GB', report_standard: 'nzs_4306' }, { locale: 'en', scheme: 'nz_terms', standard: 'nzs_4306', englishVariant: 'en-GB' }],
  [{ country_code: 'GB', report_standard: null, rating_scheme: 'nz_terms' }, { locale: 'en', scheme: 'nz_terms', standard: 'default', englishVariant: 'en-GB' }],
  [{ country_code: 'IS', report_standard: 'default', rating_scheme: 'nz_terms', report_locale: 'is' }, { locale: 'is', scheme: 'nz_terms', standard: 'default' }],
];
for (const [input, expected] of TABLE) same(r(input), expected);
console.log('PASS defaults by country match the edge function; explicit values win; junk ignored (incl. NZ → nzs_4306/nz_terms/en)');

// ── Enskt afbrigði (samningur ENSK-AFBRIGDI-HONNUN.md): land → afbrigði, stimpill → birting.
const variant = load('src/lib/report/english-variant.ts');
const VARIANT_CONTRACT = [
  ['NZ', 'en-NZ'], ['nz', 'en-NZ'], [' NZ ', 'en-NZ'], ['AU', 'en-AU'], ['GB', 'en-GB'], ['gb', 'en-GB'], ['IE', 'en-IE'],
  ['US', 'en-US'], ['CA', 'en-CA'], ['IS', 'en'], ['UK', 'en'], ['DE', 'en'], ['ZA', 'en'], ['', 'en'], [null, 'en'],
  [undefined, 'en'], [7, 'en'], ['NZL', 'en'], ['hasOwnProperty', 'en'], ['__proto__', 'en'],
];
for (const [country, want] of VARIANT_CONTRACT) assert.equal(variant.resolveEnglishVariant(country), want, String(country));
same([...variant.ENGLISH_VARIANTS], ['en-NZ', 'en-AU', 'en-GB', 'en-IE', 'en-US', 'en-CA', 'en']);
// Vistaðar skýrslur: aðeins gildur stimpill á enskri skýrslu gildir; annars 'en' (eins og áður).
for (const [report, want] of [
  [null, 'en'], [{}, 'en'], [{ report_locale: 'en' }, 'en'], [{ report_locale: 'en', english_variant: 'en-US' }, 'en-US'],
  [{ report_locale: 'en', english_variant: 'en-NZ' }, 'en-NZ'], [{ report_locale: 'en', english_variant: 'en-us' }, 'en'],
  [{ report_locale: 'en', english_variant: 'en-ZA' }, 'en'], [{ report_locale: 'is', english_variant: 'en-US' }, 'en'],
  [{ english_variant: 'en-US' }, 'en'], [{ report_locale: 'en', english_variant: 'en' }, 'en'],
]) assert.equal(variant.englishVariantOf(report), want, JSON.stringify(report));
// Dagsetningar: 'en' == formatReportDate (dd.mm.yyyy) í öllum tilvikum; afbrigði sömu dagatalsreglur.
const dates = load('src/lib/report/date.ts');
const DATE_INPUTS = ['2026-09-21', '2026-01-05', '2026-09-21T00:00:00+14:00', '2026-09-21T23:59:59-10:00', '1/2/2026', '21.09.2026',
  '2024-02-29', '2026-02-29', '2026-13-21', 'unknown', '', null, undefined, '2026-09-22T09:30:00Z'];
for (const input of DATE_INPUTS) assert.equal(variant.formatReportDateFor(input, 'en'), dates.formatReportDate(input), `en ${input}`);
for (const [input, want] of [
  ['2026-09-21', { 'en-NZ': '21/9/2026', 'en-AU': '21/9/2026', 'en-GB': '21/9/2026', 'en-IE': '21/9/2026', 'en-US': '9/21/2026', 'en-CA': '2026-09-21' }],
  ['2026-01-05', { 'en-GB': '5/1/2026', 'en-US': '1/5/2026', 'en-CA': '2026-01-05' }],
  ['2026-09-22T09:30:00Z', { 'en-US': '9/22/2026', 'en-AU': '22/9/2026', 'en-CA': '2026-09-22' }],
  ['2026-02-29', { 'en-US': '2026-02-29', 'en-GB': '2026-02-29' }], [null, { 'en-US': '—', 'en-CA': '—' }], ['unknown', { 'en-GB': 'unknown' }],
]) for (const [v, expected] of Object.entries(want)) assert.equal(variant.formatReportDateFor(input, v), expected, `${v} ${input}`);
for (const input of DATE_INPUTS) assert.equal(variant.formatReportDateFor(input, 'en-NZ'), dates.formatReportDateNz(input), `en-NZ == NZS 4306 ${input}`);
// Stærð: m² óbreytt nema en-US (m² (ft²) aðeins ef tala).
for (const v of ['en', 'en-NZ', 'en-AU', 'en-GB', 'en-IE', 'en-CA']) for (const value of [182.4, '140', 'about 90', 0])
  assert.equal(variant.formatAreaFor(value, v), `${value} m²`);
assert.equal(variant.formatAreaFor(182.4, 'en-US'), '182.4 m² (1,963 ft²)');
assert.equal(variant.formatAreaFor(140, 'en-US'), '140 m² (1,507 ft²)');
assert.equal(variant.formatAreaFor('92,5', 'en-US'), '92,5 m²', 'non-numeric text untouched');
assert.equal(variant.formatAreaFor('about 90', 'en-US'), 'about 90 m²');
assert.equal(variant.formatAreaFor(' 75 ', 'en-US'), ' 75  m² (807 ft²)');
console.log(`PASS English variant: ${VARIANT_CONTRACT.length} country rows, stamp only on English reports, dates (en == dd.mm.yyyy; en-NZ == NZS 4306), area m² (ft² only en-US)`);

// Jafngildi við edge-útgáfuna í beton-app (aðeins lesið með `git show`, aldrei skipt um grein).
// Fyrsta tilvísun sem hefur afbrigðissamninginn (resolveEnglishVariant) er notuð:
// BETON_APP_SETTINGS_REF, annars origin/main, annars origin/claude/en-variant-report.
(function appParity() {
  const refs = process.env.BETON_APP_SETTINGS_REF ? [process.env.BETON_APP_SETTINGS_REF] : ['origin/main', 'origin/claude/en-variant-report'];
  const file = 'supabase/functions/generate-report/report-settings.ts';
  const candidates = [process.env.BETON_APP_DIR, path.join(__dirname, '../../beton-app'), path.join(__dirname, '../../../beton-app')].filter(Boolean);
  let source = null, where = null, ref = refs[0];
  search: for (const r of refs) for (const dir of candidates) {
    if (!fs.existsSync(path.join(dir, '.git'))) continue;
    try {
      const text = execFileSync('git', ['-C', dir, 'show', `${r}:${file}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      if (text.includes('resolveEnglishVariant')) { source = text; where = dir; ref = r; break search; }
    } catch { /* greinin ekki til hér */ }
  }
  if (!source) {
    console.log(`SKIP app parity: ${refs.join(' / ')}:${file} not found with resolveEnglishVariant — web implements the contract table above`);
    return;
  }
  const context = { exports: {}, Intl, require };
  context.module = { exports: context.exports };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, context);
  const app = context.module.exports.resolveReportSettings;
  for (const [input] of TABLE) same(app(input), JSON.parse(JSON.stringify(r(input))));
  same(context.module.exports.LEGACY_REPORT_SETTINGS, { locale: 'is', scheme: 'standard', standard: 'default' });
  for (const [country] of VARIANT_CONTRACT) assert.equal(context.module.exports.resolveEnglishVariant(country), variant.resolveEnglishVariant(country), String(country));
  same([...context.module.exports.ENGLISH_VARIANTS], [...variant.ENGLISH_VARIANTS]);
  console.log(`PASS web settings === edge report-settings.ts (${ref} in ${where}) for all ${TABLE.length} rows + ${VARIANT_CONTRACT.length} country→variant rows`);
})();

assert.equal(ratingSchemeOf({}), 'standard');
assert.equal(ratingSchemeOf({ rating_scheme: 'condition_1_3' }), 'condition_1_3');
assert.equal(ratingSchemeOf({ rating_scheme: 'nz_terms' }), 'nz_terms');
assert.equal(ratingSchemeOf({ rating_scheme: 'rics' }), 'standard');
assert.equal(reportStandardOf({}), 'default');
assert.equal(reportStandardOf({ report_standard: 'nzs_4306' }), 'nzs_4306');
assert.equal(reportStandardOf({ report_standard: 'NZS 4306' }), 'default');
console.log('PASS reports without a stamp keep the current scheme and format');

for (const locale of ['is', 'en']) {
  const t = REPORT_COPY[locale];
  for (const sev of ['athugasemd', 'alvarleg', 'mjog_alvarleg']) {
    assert.ok(t.severity[sev].label && t.conditionSeverity[sev].label && t.conditionSeverity[sev].description, `${locale}.${sev}`);
  }
  for (const sev of ['athugasemd', 'alvarleg', 'mjog_alvarleg']) assert.ok(t.nzSeverity[sev].label && t.nzSeverity[sev].description, `${locale}.nz.${sev}`);
  for (const v of ['ok', 'warn', 'danger', 'mjog_alvarleg']) assert.ok(t.rating[v] && t.conditionRating[v] && t.nzRating[v], `${locale}.${v}`);
}
assert.equal(REPORT_COPY.en.conditionSeverity.mjog_alvarleg.label, 'Condition rating 3');
// nz_terms (samningur): rýmiseinkunn ok→Satisfactory, warn→Maintenance, danger→Defect,
// mjog_alvarleg→Significant defect; alvarleiki athugasemd→Maintenance, alvarleg→Defect,
// mjog_alvarleg→Significant defect.
same(REPORT_COPY.en.nzRating, { ok: 'Satisfactory', warn: 'Maintenance', danger: 'Defect', mjog_alvarleg: 'Significant defect' });
same(Object.fromEntries(Object.entries(REPORT_COPY.en.nzSeverity).map(([k, v]) => [k, v.label])), { athugasemd: 'Maintenance', alvarleg: 'Defect', mjog_alvarleg: 'Significant defect' });
const dashboard = load('src/lib/i18n/dashboard.ts');
same(dashboard.DASHBOARD_COPY.en.nzSeverity, { athugasemd: 'Maintenance', alvarleg: 'Defect', mjog_alvarleg: 'Significant defect' });
console.log('PASS all three schemes (standard, condition_1_3, nz_terms) have labels and descriptions in every report language; NZ words match the contract');

// ── Stafsetning fastra texta: en-US fær US-stafsetningu; öll önnur afbrigði nota `en` óbreytt.
{
  const { reportCopy, REPORT_COPY } = load('src/lib/report/i18n.ts');
  for (const v of ['en', 'en-NZ', 'en-AU', 'en-GB', 'en-IE', 'en-CA']) assert.equal(reportCopy('en', v), REPORT_COPY.en, v);
  for (const v of ['en', 'en-US', 'en-GB']) assert.equal(reportCopy('is', v), REPORT_COPY.is, `is ${v}`);
  assert.equal(reportCopy('en'), REPORT_COPY.en);
  const us = reportCopy('en', 'en-US');
  const flat = (o) => JSON.stringify(o);
  const BRITISH = /\b(colour|metre|centre|analys|mould|behaviour|favour|labour|organis|summaris|recognis|licence|programme|grey|fibre|aluminium|storey|kerb|tyre|catalogue|defence|cheque|draught|plough|travell|modell|levell|jewellery|odour|vapour|harbour|neighbour|apologis|realis|minimis|prioritis|utilis)/i;
  assert.ok(!BRITISH.test(flat(us)), `en-US copy still has British spelling: ${flat(us).match(BRITISH)}`);
  assert.ok(flat(us).includes('Damp, mold or other defects'));
  // Eini munurinn á en og en-US er mould → mold (sama uppbygging, sömu lyklar).
  assert.equal(flat(us), flat(REPORT_COPY.en).replace(/mould/g, 'mold').replace(/Mould/g, 'Mold'));
  assert.ok(BRITISH.test(flat(REPORT_COPY.en)), 'en copy (Commonwealth) is untouched');
  console.log('PASS static report labels: en-US uses US spelling (mould → mold only change); every other variant and Icelandic use the existing copy object');
}
