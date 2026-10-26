/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script, like the other verify-*.cjs */
// Land fyrirtækis í stillingum (LANDAVAL §2/§1): src/lib/company-country.ts (villuþýðing + hvað hreinsast),
// server action, stillingasíða (aðeins eigandi, aldrei Beton), skýring í nýskráningu og réttindareitur eftir sniði.
// Keyrt með `node scripts/verify-company-country.cjs` — engin bygging, engin netköll.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
function load(rel) {
  const context = { exports: {}, Intl, require: (id) => (id.startsWith('./') ? load(path.join(path.dirname(rel), id) + '.ts') : id === '@/lib/onboarding' ? load('src/lib/onboarding.ts') : require(id)) };
  context.module = { exports: context.exports };
  vm.runInNewContext(ts.transpileModule(read(rel), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, context);
  return context.module.exports;
}
const { countryChangeOutcome: out, normalizeCountryChoice: norm, standardClearedBy: cleared } = load('src/lib/company-country.ts');
let n = 0;
const pass = (name) => { n++; console.log(`PASS ${name}`); };

// 1. Villuþýðing: sömu kóðar og set_company_country (beton-app 20261026210000).
assert.equal(out(null), 'ok');
assert.equal(out(undefined), 'ok');
for (const [message, expected] of [
  ['not_authenticated', 'not_authenticated'], ['invalid_country', 'invalid_country'], ['not_company_owner', 'not_owner'],
  ['company_locked', 'locked'], ['country_not_allowed', 'not_allowed'], ['  company_locked  ', 'locked'], ['boom', 'failed'], ['', 'failed'],
]) assert.equal(out({ message }), expected, message);
assert.equal(out({ code: 'PGRST202', message: 'Could not find the function public.set_company_country(p_country) in the schema cache' }), 'unavailable');
assert.equal(out({ code: '42883', message: 'function public.set_company_country(text) does not exist' }), 'unavailable');
assert.equal(out({ message: 'Could not find the function public.set_company_country' }), 'unavailable');
pass('RPC errors map to calm outcomes; a missing function is "unavailable", not a crash');

// 2. Landsval.
assert.equal(norm('us'), 'US'); assert.equal(norm(' nz '), 'NZ'); assert.equal(norm('XX'), null); assert.equal(norm(''), null); assert.equal(norm(5), null);
pass('country choice is trimmed, upper-cased and must be an ISO country');

// 3. Hvað hreinsast (sama og RPC): nzs_4306 → utan NZ, isop → utan US/CA.
assert.equal(cleared('nzs_4306', 'US'), 'nzs_4306'); assert.equal(cleared('nzs_4306', 'NZ'), null);
assert.equal(cleared('isop', 'GB'), 'isop'); assert.equal(cleared('isop', 'CA'), null); assert.equal(cleared('isop', 'US'), null);
assert.equal(cleared('default', 'US'), null); assert.equal(cleared(null, 'US'), null);
pass('confirmation warns about exactly the report formats the RPC clears');

// 4. Server action: aðeins Rondva, aðeins eigandi, aldrei Beton-fyrirtækið; kallar RPC; endurhleður stillingar.
const actions = read('src/app/(dashboard)/actions.ts');
const act = actions.slice(actions.indexOf('export async function saveCompanyCountry'));
assert.match(act, /getRequestBrand\(\)\) !== "rondva"/);
assert.match(act, /ownerOnly: true/);
assert.match(act, /BETON_COMPANY_ID/);
assert.match(act, /rpc\("set_company_country", \{ p_country: code \}\)/);
assert.match(act, /revalidatePath\("\/dashboard\/settings"\)/);
pass('saveCompanyCountry: Rondva host, owner only, Beton company refused, set_company_country, revalidates settings');

// 5. Stillingasíða: formið aðeins fyrir eiganda (reportSettings er ownerOnly) og aldrei Beton-fyrirtækið.
const page = read('src/app/(dashboard)/dashboard/settings/page.tsx');
assert.match(page, /reportSettings && reportSettings\.country && reportSettings\.companyId !== BETON_COMPANY_ID/);
assert.match(page, /brand === "rondva" \? await ownerReportSettings/);
assert.match(page, /<ReportSettingsForm key=\{reportSettings\.country\}/);
assert.match(page, /showQualifications=\{qualifications !== null && memberStandard !== "default"\}/);
pass('settings page: country card only for the owner on Rondva, never the Beton company; report card reloads on a new country');

// 6. Textar: is + en samhliða; skýring í nýskráningu; réttindareitur isop.
const copy = read('src/lib/i18n/dashboard.ts');
assert.equal((copy.match(/companyCountry: \{/g) ?? []).length, 2);
assert.ok(copy.includes('countryHint: "Sets the address format, required fields and report format. You can change it later in Settings."'));
assert.ok(copy.includes('qualificationsIsop: "Licence and qualifications (printed on the report cover)"'));
assert.ok(copy.includes('qualificationsIsopPlaceholder: "e.g. TREC #12345, InterNACHI member"'));
assert.ok(copy.includes('qualificationsHint: "Shown on the Certificate of Inspection in NZS 4306 reports."'), 'NZS wording unchanged');
pass('is + en strings present; onboarding hint; ISOP qualifications wording; NZS wording unchanged');

const form = read('src/components/dashboard/CompanyBrandingForm.tsx');
assert.match(form, /reportStandard === "isop"/);
assert.match(form, /\.\.\.\(showQualifications \? \{ qualifications:/, 'hidden field never writes the column (stored data kept)');
pass('qualifications: wording follows the report format; a hidden field never touches the stored value');

console.log(`\n${n} checks passed`);
