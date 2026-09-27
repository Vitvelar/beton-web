// Skýrslumál og matskerfi (src/lib/report/settings.ts): sama regla og beton-app
// supabase/functions/generate-report/report-settings.ts (scripts/verify-report-language.cjs
// þar prófar sömu töflu). Keyrt með `node scripts/verify-report-settings.cjs`.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function load(rel) {
  const file = path.join(__dirname, '..', rel);
  const context = { exports: {}, Intl, require: (id) => (id.startsWith('./') ? load(path.join(path.dirname(rel), id) + '.ts') : require(id)) };
  context.module = { exports: context.exports };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, context);
  return context.module.exports;
}
const { resolveReportSettings: r, ratingSchemeOf } = load('src/lib/report/settings.ts');
const { REPORT_COPY } = load('src/lib/report/i18n.ts');
const same = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b);

same(r(null), { locale: 'is', scheme: 'standard' });
same(r({ country_code: 'IS' }), { locale: 'is', scheme: 'standard' });
same(r({ country_code: 'gb' }), { locale: 'en', scheme: 'condition_1_3' });
same(r({ country_code: 'IE' }), { locale: 'en', scheme: 'condition_1_3' });
same(r({ country_code: 'US' }), { locale: 'en', scheme: 'standard' });
same(r({ country_code: 'GB', report_locale: 'is', rating_scheme: 'standard' }), { locale: 'is', scheme: 'standard' });
same(r({ country_code: 'IS', report_locale: 'de', rating_scheme: 'rics' }), { locale: 'is', scheme: 'standard' });
console.log('PASS defaults by country match the edge function; explicit values win; junk ignored');

assert.equal(ratingSchemeOf({}), 'standard');
assert.equal(ratingSchemeOf({ rating_scheme: 'condition_1_3' }), 'condition_1_3');
assert.equal(ratingSchemeOf({ rating_scheme: 'rics' }), 'standard');
console.log('PASS reports without a stamp keep the current scheme');

for (const locale of ['is', 'en']) {
  const t = REPORT_COPY[locale];
  for (const sev of ['athugasemd', 'alvarleg', 'mjog_alvarleg']) {
    assert.ok(t.severity[sev].label && t.conditionSeverity[sev].label && t.conditionSeverity[sev].description, `${locale}.${sev}`);
  }
  for (const v of ['ok', 'warn', 'danger', 'mjog_alvarleg']) assert.ok(t.rating[v] && t.conditionRating[v], `${locale}.${v}`);
}
assert.equal(REPORT_COPY.en.conditionSeverity.mjog_alvarleg.label, 'Condition rating 3');
console.log('PASS both schemes have labels and descriptions in every report language');
