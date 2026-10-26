/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script, like the other verify-*.cjs */
// Staðsetningarlína „Eign“-töflu almennu skýrslunnar (src/lib/report/address-line.ts, LANDAVAL §7):
// US/CA/AU „Town, ST 12345“, GB/IE/NZ „Town Postcode“, allt annað (íslenska, „en“, eldri skýrslur) null = óbreytt lína.
// Keyrt með `node scripts/verify-report-address.cjs` — engin bygging, engin netköll.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

const root = path.join(__dirname, '..');
function load(rel) {
  const file = path.join(root, rel);
  const context = { exports: {}, require: (id) => (id.startsWith('./') ? load(path.join(path.dirname(rel), id) + '.ts') : require(id)) };
  context.module = { exports: context.exports };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, context);
  return context.module.exports;
}
const { reportLocality: loc, regionOf } = load('src/lib/report/address-line.ts');
let n = 0;
const pass = (name) => { n++; console.log(`PASS ${name}`); };

const denver = { postal_code: '80202', municipality: 'Denver', property_data: { state: 'CO' } };
assert.equal(loc(denver, { locale: 'en', variant: 'en-US' }), 'Denver, CO 80202');
assert.equal(loc({ ...denver, property_data: { isop: { state: 'TX' } } }, { locale: 'en', variant: 'en-US' }), 'Denver, TX 80202');
assert.equal(loc({ ...denver, property_data: { state: 'CO', isop: { state: 'TX' } } }, { locale: 'en', variant: 'en-US' }), 'Denver, CO 80202', 'state wins over isop.state');
assert.equal(loc({ postal_code: 'M5V 2T6', municipality: 'Toronto', property_data: { state: 'ON' } }, { locale: 'en', variant: 'en-CA' }), 'Toronto, ON M5V 2T6');
assert.equal(loc({ postal_code: '2000', municipality: 'Sydney', property_data: { state: 'NSW' } }, { locale: 'en', variant: 'en-AU' }), 'Sydney, NSW 2000');
pass('US / CA / AU: Town, ST postcode (state from property_data.state ?? isop.state)');

assert.equal(loc({ postal_code: '12345', municipality: 'Denver', property_data: {} }, { locale: 'en', variant: 'en-US' }), 'Denver, 12345');
assert.equal(loc({ postal_code: '', municipality: 'Denver', property_data: { state: 'CO' } }, { locale: 'en', variant: 'en-US' }), 'Denver, CO');
assert.equal(loc({ postal_code: '80202', municipality: '', property_data: { state: 'CO' } }, { locale: 'en', variant: 'en-US' }), 'CO 80202');
assert.equal(loc({ postal_code: null, municipality: '  Denver ', property_data: null }, { locale: 'en', variant: 'en-US' }), 'Denver');
assert.equal(loc({}, { locale: 'en', variant: 'en-US' }), '');
pass('missing parts drop out without stray commas or spaces');

assert.equal(loc({ postal_code: 'SW1A 1AA', municipality: 'London', property_data: { state: 'X' } }, { locale: 'en', variant: 'en-GB' }), 'London SW1A 1AA');
assert.equal(loc({ postal_code: 'A65 F4E2', municipality: 'Dublin' }, { locale: 'en', variant: 'en-IE' }), 'Dublin A65 F4E2');
assert.equal(loc({ postal_code: '1010', municipality: 'Auckland' }, { locale: 'en', variant: 'en-NZ' }), 'Auckland 1010');
assert.equal(loc({ postal_code: '1010', municipality: '' }, { locale: 'en', variant: 'en-NZ' }), '1010');
pass('GB / IE / NZ: Town Postcode (state ignored)');

for (const variant of ['en', 'en-US', 'en-GB']) {
  assert.equal(loc({ postal_code: '101', municipality: 'Reykjavík' }, { locale: 'is', variant }), null);
}
assert.equal(loc({ postal_code: '101', municipality: 'Reykjavík' }, { locale: 'en', variant: 'en' }), null);
pass('Icelandic reports and unstamped / "en" reports return null (existing line untouched, Beton identical)');

assert.equal(regionOf(undefined), '');
assert.equal(regionOf({ state: 5 }), '5');
assert.equal(regionOf({ state: '  ', isop: { state: 'WA' } }), 'WA');
pass('regionOf is tolerant of junk');

const page = fs.readFileSync(path.join(root, 'src/app/(dashboard)/dashboard/[id]/report/page.tsx'), 'utf8');
assert.match(page, /reportLocality\(report\.inspection, \{ locale, variant \}\)/);
assert.match(page, /locality !== null \?/);
assert.match(page, /label=\{t\.postcode\}/, 'legacy postcode row kept');
pass('report page uses the helper and keeps the legacy row as the fallback');

console.log(`\n${n} checks passed`);
