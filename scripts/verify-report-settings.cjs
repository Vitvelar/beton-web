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
// plan/rondva/NZ-SKYRSLUSNID-HONNUN.md). [inntak, vænt { locale, scheme, standard }]
const TABLE = [
  [null, { locale: 'is', scheme: 'standard', standard: 'default' }],
  [{ country_code: 'IS' }, { locale: 'is', scheme: 'standard', standard: 'default' }],
  [{ country_code: 'gb' }, { locale: 'en', scheme: 'condition_1_3', standard: 'default' }],
  [{ country_code: 'IE' }, { locale: 'en', scheme: 'condition_1_3', standard: 'default' }],
  [{ country_code: 'US' }, { locale: 'en', scheme: 'standard', standard: 'default' }],
  [{ country_code: 'GB', report_locale: 'is', rating_scheme: 'standard' }, { locale: 'is', scheme: 'standard', standard: 'default' }],
  [{ country_code: 'IS', report_locale: 'de', rating_scheme: 'rics' }, { locale: 'is', scheme: 'standard', standard: 'default' }],
  // NZS 4306: NZ → nzs_4306 + nz_terms + en; skráð gildi vinna; rusl hunsað.
  [{ country_code: 'NZ' }, { locale: 'en', scheme: 'nz_terms', standard: 'nzs_4306' }],
  [{ country_code: ' nz ' }, { locale: 'en', scheme: 'nz_terms', standard: 'nzs_4306' }],
  [{ country_code: 'NZ', report_standard: 'default' }, { locale: 'en', scheme: 'standard', standard: 'default' }],
  [{ country_code: 'NZ', rating_scheme: 'condition_1_3' }, { locale: 'en', scheme: 'condition_1_3', standard: 'nzs_4306' }],
  [{ country_code: 'NZ', report_standard: 'nzs4306', rating_scheme: 'nz' }, { locale: 'en', scheme: 'nz_terms', standard: 'nzs_4306' }],
  [{ country_code: 'IS', report_standard: 'nzs_4306' }, { locale: 'is', scheme: 'nz_terms', standard: 'nzs_4306' }],
  [{ country_code: 'GB', report_standard: 'nzs_4306' }, { locale: 'en', scheme: 'nz_terms', standard: 'nzs_4306' }],
  [{ country_code: 'GB', report_standard: null, rating_scheme: 'nz_terms' }, { locale: 'en', scheme: 'nz_terms', standard: 'default' }],
  [{ country_code: 'IS', report_standard: 'default', rating_scheme: 'nz_terms', report_locale: 'is' }, { locale: 'is', scheme: 'nz_terms', standard: 'default' }],
];
for (const [input, expected] of TABLE) same(r(input), expected);
console.log('PASS defaults by country match the edge function; explicit values win; junk ignored (incl. NZ → nzs_4306/nz_terms/en)');

// Jafngildi við edge-útgáfuna í beton-app, ef NZ-grein appsins er til staðar (aðeins lesið
// með `git show`, aldrei skipt um grein). BETON_APP_SETTINGS_REF yfirskrifar greinina.
(function appParity() {
  const ref = process.env.BETON_APP_SETTINGS_REF || 'origin/claude/nz-pr1-settings';
  const file = 'supabase/functions/generate-report/report-settings.ts';
  const candidates = [process.env.BETON_APP_DIR, path.join(__dirname, '../../beton-app'), path.join(__dirname, '../../../beton-app')].filter(Boolean);
  let source = null, where = null;
  for (const dir of candidates) {
    if (!fs.existsSync(path.join(dir, '.git'))) continue;
    try { source = execFileSync('git', ['-C', dir, 'show', `${ref}:${file}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); where = dir; break; } catch { /* greinin ekki til hér */ }
  }
  if (!source || !source.includes('nzs_4306')) {
    console.log(`SKIP app parity: ${ref}:${file} not found (or without nzs_4306) — web implements the contract table above`);
    return;
  }
  const context = { exports: {}, Intl, require };
  context.module = { exports: context.exports };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, context);
  const app = context.module.exports.resolveReportSettings;
  for (const [input] of TABLE) same(app(input), JSON.parse(JSON.stringify(r(input))));
  same(context.module.exports.LEGACY_REPORT_SETTINGS, { locale: 'is', scheme: 'standard', standard: 'default' });
  console.log(`PASS web settings === edge report-settings.ts (${ref} in ${where}) for all ${TABLE.length} rows`);
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
