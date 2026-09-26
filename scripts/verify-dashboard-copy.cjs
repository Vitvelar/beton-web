// Stjórnborðskatalógið (src/lib/i18n/dashboard.ts): hvert tungumál hefur sömu lykla og
// sömu {breytur} og íslenskan, fill() skilar sömu textahnútum og JSX, og plural()
// velur form eftir tungumáli. Keyrt með `node scripts/verify-dashboard-copy.cjs`.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

// Hleður .ts-einingu (og innri ./-innflutning hennar) án byggingar.
function load(rel) {
  const file = path.join(__dirname, '..', rel);
  const context = { exports: {}, Intl, require: (id) => (id.startsWith('./') ? load(path.join(path.dirname(rel), id) + '.ts') : require(id)) };
  context.module = { exports: context.exports };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, context);
  return context.module.exports;
}
const context = { module: { exports: load('src/lib/i18n/dashboard.ts') } };
const { DASHBOARD_COPY, DASHBOARD_LOCALES, LOCALE_NAMES, USER_LOCALE_KEY, fill, plural, localeForBrand, dashboardCopy, categoryLabel } = context.module.exports;

let n = 0;
const pass = (name) => { n++; console.log(`PASS ${name}`); };

// Lyklar og {breytur} bornar saman við íslensku fyrir hvert tungumál.
const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
function walk(ref, other, where, locale) {
  if (where.endsWith('.categories')) return; // birtingarheiti; íslenska notar geymda gildið
  const pluralLeaf = where.match(/\.(roomPhotos|subtitle)$/);
  if (pluralLeaf) {
    assert.equal(typeof other.other, 'string', `${locale}${where}.other`);
    for (const form of Object.values(other)) assert.equal(placeholders(form), placeholders(ref.other), `${locale}${where} {vars}`);
    return;
  }
  if (typeof ref === 'string') {
    assert.equal(typeof other, 'string', `${locale}${where} should be a string`);
    assert.ok(other.trim(), `${locale}${where} is empty`);
    assert.equal(placeholders(other), placeholders(ref), `${locale}${where} {vars}`);
    return;
  }
  if (typeof ref === 'function') {
    assert.equal(typeof other, 'function', `${locale}${where} should be a function`);
    assert.equal(other.length, ref.length, `${locale}${where} arity`);
    return;
  }
  assert.deepEqual(Object.keys(other).sort(), Object.keys(ref).sort(), `${locale}${where} keys`);
  for (const k of Object.keys(ref)) walk(ref[k], other[k], `${where}.${k}`, locale);
}
for (const locale of DASHBOARD_LOCALES) walk(DASHBOARD_COPY.is, DASHBOARD_COPY[locale], '', locale);
pass(`every locale (${DASHBOARD_LOCALES.join(', ')}) has the Icelandic keys and {placeholders}`);

assert.deepEqual([...fill('Rými ({count})', { count: 3 })], ['Rými (', 3, ')']);
assert.deepEqual([...fill('{count} ath.', { count: 2 })], [2, ' ath.']);
assert.deepEqual([...fill('{address} — {count} athugasemdir', { address: 'Gata 1', count: 0 })], ['Gata 1', ' — ', 0, ' athugasemdir']);
assert.deepEqual([...fill('Skoðunarmaður: {name}. Nafnið', { name: undefined })], ['Skoðunarmaður: ', undefined, '. Nafnið']);
pass('fill() yields the same text nodes the JSX used to');

const photos = DASHBOARD_COPY.en.inspection.roomPhotos;
assert.equal(plural('en', 1, photos), '{count} photo');
assert.equal(plural('en', 4, photos), '{count} photos');
for (const c of [0, 1, 2, 21]) assert.equal(plural('is', c, DASHBOARD_COPY.is.inspection.roomPhotos), '{count} myndir');
pass('plural() picks the locale form (Beton text unchanged for every count)');

assert.equal(localeForBrand('beton'), 'is');
assert.equal(localeForBrand('beton', 'en'), 'is');
assert.equal(localeForBrand('rondva'), 'en');
assert.equal(localeForBrand('rondva', 'is'), 'is');
assert.equal(localeForBrand('rondva', 'xx'), 'en');
pass('Beton is always Icelandic; Rondva defaults to English and accepts a supported preference');

assert.equal(categoryLabel(dashboardCopy('is'), 'Veggir'), 'Veggir');
assert.equal(categoryLabel(dashboardCopy('en'), 'Veggir'), 'Walls');
assert.equal(categoryLabel(dashboardCopy('en'), 'Óþekkt'), 'Óþekkt');
assert.equal(dashboardCopy('en').severity.athugasemd, 'Minor');
assert.equal(dashboardCopy('en').severity.mjog_alvarleg, 'Very serious');
pass('severity and category labels match beton-app lib/i18n/labels.ts; unknown categories show the stored value');

for (const locale of DASHBOARD_LOCALES) assert.ok(LOCALE_NAMES[locale], `LOCALE_NAMES.${locale}`);
assert.deepEqual(Object.keys(LOCALE_NAMES).sort(), [...DASHBOARD_LOCALES].sort());
// Samningur við beton-app (lib/i18n): sama lykill í user_metadata.
assert.equal(USER_LOCALE_KEY, 'ui_locale');
pass('every locale has a picker name; the preference key matches the app (user_metadata.ui_locale)');

console.log(`${n} dashboard-copy checks passed.`);
