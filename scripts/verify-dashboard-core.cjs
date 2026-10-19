// Stjórnborð: gagnasannleikur, stöður og villumeðhöndlun (UX-umferð 2026-10, sneið W3a).
// Keyrt með `node scripts/verify-dashboard-core.cjs`.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
function load(rel) {
  const context = { exports: {}, Intl, URL, require: (id) => (id.startsWith('./') ? load(path.join(path.dirname(rel), id) + '.ts') : require(id)) };
  context.module = { exports: context.exports };
  vm.runInNewContext(ts.transpileModule(read(rel), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, context);
  return context.module.exports;
}
let n = 0;
const pass = (name) => { n++; console.log(`PASS ${name}`); };

// Skilmálaslóð: https:// bætt við, ónothæft hafnað, autt = engin.
const { normalizeTermsUrl } = load('src/lib/terms-url.ts');
assert.equal(normalizeTermsUrl(''), '');
assert.equal(normalizeTermsUrl('  '), '');
assert.equal(normalizeTermsUrl('example.com/terms'), 'https://example.com/terms');
assert.equal(normalizeTermsUrl('http://example.com'), 'http://example.com');
assert.equal(normalizeTermsUrl('https://example.com/a b'.replace(' ', '%20')), 'https://example.com/a%20b');
assert.equal(normalizeTermsUrl('javascript:alert(1)'), null);
assert.equal(normalizeTermsUrl('ftp://example.com'), null);
assert.equal(normalizeTermsUrl('nodots'), null);
assert.equal(normalizeTermsUrl('mailto:a@b.com'), null);
pass('terms URL: https:// is added, unusable values are rejected, empty means none');

// Stöður: allar stöður hafa texta á báðum málum og lit í StatusBadge.
const { DASHBOARD_COPY } = load('src/lib/i18n/dashboard.ts');
const types = read('src/lib/supabase/types.ts');
const statuses = ['draft', 'inspecting', 'completed', 'generating', 'rendering_pdf', 'report_ready', 'error'];
const badge = read('src/components/dashboard/StatusBadge.tsx');
for (const status of statuses) {
  assert.ok(types.includes(`"${status}"`), `InspectionStatus has ${status}`);
  assert.ok(new RegExp(`\\b${status}:`).test(badge), `StatusBadge maps ${status}`);
  for (const locale of ['is', 'en']) assert.ok(DASHBOARD_COPY[locale].status[status], `${locale}.status.${status}`);
}
pass('every inspection status has a type, a badge tone and a label in is and en');

// Engin textasniðmát sem birta hráa villu: villutextar eru strengir án {message}.
for (const locale of ['is', 'en']) {
  const c = DASHBOARD_COPY[locale];
  for (const key of ['observationUpdateFailed', 'queueFailed', 'reportUpdateFailed', 'reportDownloadFailed', 'driveFailed']) {
    assert.equal(typeof c.actions[key], 'string', `${locale}.actions.${key} is a plain string`);
  }
  assert.equal(typeof c.branding.uploadFailed, 'string');
}
pass('server error texts are fixed catalog strings (no raw Supabase message)');

// Server-aðgerðir.
const actions = read('src/app/(dashboard)/dashboard/[id]/actions.ts');
assert.ok(!/\|\|\s*undefined/.test(read('src/components/dashboard/ObservationForm.tsx')), 'form no longer drops cleared fields');
assert.ok(/description:\s*clean\(data\.description\)/.test(actions), 'cleared description is sent as null');
assert.ok(/titleRequired/.test(actions), 'server checks the title');
assert.ok(!/error:\s*[a-zA-Z]*[eE]rr(or)?\.message/.test(actions.replace(/console\.error\([^)]*\)/g, '')), 'no raw error.message returned to the client');
pass('updateObservation clears empty fields, requires a title, and never returns raw error text');

assert.ok(/signOut\(\{ scope: "local" \}\)/.test(read('src/app/(dashboard)/actions.ts')), 'signOut is local');
pass('sign out only ends this browser session (scope: local)');

// Inneign: staðfestingarflaggið fer aðeins með þegar notandinn samþykkti.
assert.ok(/options\?\.confirmAdditionalCredit === true \? \{ confirm_additional_credit: true \} : \{\}/.test(actions));
const ra = read('src/app/(dashboard)/dashboard/[id]/report-actions.tsx');
assert.ok(!ra.includes('text-stone'), 'no undefined text-stone class');
assert.ok(/handleGenerate\(true\)/.test(ra) && /setDialog\("regenerate"\)/.test(ra), 'regenerate asks first; extra credit needs its own yes');
assert.ok(/observationCount === 0/.test(ra), 'create report disabled with 0 observations');
pass('regenerate confirms first; the extra-credit flag is only sent after an explicit yes');

// PDF-leið: Bearer fær JSON eins og áður, vafri er sendur á skýrslusíðuna.
const route = read('src/app/(dashboard)/dashboard/[id]/report/pdf/route.ts');
assert.ok(/const browser = !bearerAuthorization && isBrowser/.test(route), 'only non-Bearer HTML requests are redirected');
for (const status of ['"missing"', '"pending"', '"error"']) assert.ok(route.includes(`backToReport(${status})`), status);
for (const json of ['status: 401', 'status: 404', 'status: 500', 'status: 202']) assert.ok(route.includes(json), `${json} JSON kept for apps`);
pass('PDF route: browsers are redirected with ?pdf=…, Bearer callers keep the JSON responses');

// Villumörk til staðar.
for (const f of ['error.tsx', 'not-found.tsx', 'loading.tsx', '[...rest]/page.tsx', 'settings/loading.tsx', '[id]/loading.tsx', '[id]/observation/[obsId]/loading.tsx', '[id]/report/edit/loading.tsx']) {
  assert.ok(fs.existsSync(path.join(root, 'src/app/(dashboard)/dashboard', f)), f);
}
assert.ok(fs.existsSync(path.join(root, 'src/app/global-error.tsx')));
pass('error, not-found, catch-all, loading and global-error boundaries exist');

console.log(`${n} dashboard-core checks passed.`);
