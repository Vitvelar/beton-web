// Stjórnborðsskelin (UX-yfirferð 2026-10, sneið W3b): textakatalógurinn
// src/lib/i18n/dashboard-shell.ts hefur sömu lykla/{breytur} á báðum málum, og
// helstu loforð skeljarins eru enn í kóðanum (fastir textaleitir á frumkóða, eins og
// aðrar verify-skriftur hér). Keyrt með `node scripts/verify-dashboard-shell.cjs`.
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
const read = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const { DASHBOARD_SHELL_COPY, shellCopy, format } = load('src/lib/i18n/dashboard-shell.ts');
const { RONDVA_OFFER_LINE, RONDVA_TRIAL } = load('src/lib/rondva-pricing.ts');

let n = 0;
const pass = (name) => { n++; console.log(`PASS ${name}`); };

// Lyklar og {breytur} á báðum málum.
const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
function walk(ref, other, where) {
  if (typeof ref === 'string') {
    assert.equal(typeof other, 'string', `en${where} should be a string`);
    assert.ok(other.trim(), `en${where} is empty`);
    assert.equal(placeholders(other), placeholders(ref), `en${where} {vars}`);
    return;
  }
  assert.deepEqual(Object.keys(other).sort(), Object.keys(ref).sort(), `en${where} keys`);
  for (const k of Object.keys(ref)) walk(ref[k], other[k], `${where}.${k}`);
}
walk(DASHBOARD_SHELL_COPY.is, DASHBOARD_SHELL_COPY.en, '');
pass('shell catalog: en has every Icelandic key and the same {placeholders}');

// Tilboðslínan: enska katalógsins er sama lína og kynningarsíðan sýnir (ein heimild).
assert.equal(format(shellCopy('en').emptyRondva.offerLine, { count: RONDVA_TRIAL.freeReports }), RONDVA_OFFER_LINE);
assert.match(format(shellCopy('is').emptyRondva.offerLine, { count: RONDVA_TRIAL.freeReports }), new RegExp(String(RONDVA_TRIAL.freeReports)));
pass('empty-state offer line matches RONDVA_OFFER_LINE (en) and carries the same number (is)');

// Beton-stjórnborðið er ekki markaðssíða: noindex, engin canonical/OG frá beton.is.
const layout = read('src/app/(dashboard)/layout.tsx');
const betonMeta = layout.slice(layout.indexOf('const betonDashboardMetadata'), layout.indexOf('const rondvaDashboardMetadata'));
assert.match(betonMeta, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
assert.doesNotMatch(betonMeta, /openGraph|twitter|alternates|\.\.\.betonMetadata/);
assert.match(betonMeta, /icons:/);
pass('admin.beton.is metadata: noindex, no canonical/OG/Twitter inherited from beton.is, icons kept');

assert.match(layout, /<main id="content" tabIndex=\{-1\}/);
assert.match(layout, /href="#content"/);
assert.doesNotMatch(layout, /min-h-screen/);
pass('layout: skip link targets main#content (focusable), min-h-dvh');

const header = read('src/components/dashboard/DashboardHeader.tsx');
assert.match(header, /<nav aria-label=/);
assert.match(header, /min-h-11/);
assert.match(header, /whitespace-nowrap/);
assert.match(header, /hidden [^"]*sm:inline/);
pass('header: labelled nav, 44px targets, no wrapped links, section label hidden on phones');

// Engin hrá villuboð til notandans í innskráningunum.
for (const file of ['src/components/dashboard/BetonLogin.tsx', 'src/components/rondva/RondvaLogin.tsx']) {
  const src = read(file);
  assert.doesNotMatch(src, /setError\(\s*error\.message/, `${file} shows a raw error.message`);
  assert.match(src, /role="alert"/, `${file} has no role=alert`);
  assert.doesNotMatch(src, /min-h-screen/, `${file} uses min-h-screen`);
}
assert.match(read('src/components/dashboard/BetonLogin.tsx'), /<h1[ >]/);
pass('logins: no raw error.message, errors are role=alert, Beton login has an <h1>, dvh');

const loginPage = read('src/app/(dashboard)/dashboard/login/page.tsx');
assert.match(loginPage, /signedInDestination\(brand\)/);
assert.match(loginPage, /error \? null/);
pass('login page: signed-in user is redirected on both brands (not when ?error= is present)');

// Listi og skoðun.
const list = read('src/app/(dashboard)/dashboard/page.tsx');
assert.match(list, /after:absolute after:inset-0/);
assert.doesNotMatch(list, /overflow-hidden/);
assert.match(list, /<h1/);
const detail = read('src/app/(dashboard)/dashboard/[id]/page.tsx');
assert.match(detail, /id=\{`room-\$\{room\.id\}`\}/);
assert.match(detail, /scroll-mt-24/);
assert.doesNotMatch(detail, /\btruncate\b/);
assert.equal((detail.match(/<h1/g) ?? []).length, 1);
pass('list: whole-row link, no overflow-hidden, H1 in every state; detail: room anchors, one H1, no truncated titles');

// Nýskráning.
const form = read('src/components/rondva/CompanyOnboardingForm.tsx');
assert.match(form, /noValidate/);
assert.doesNotMatch(form, /text-\[\d+px\]/);
assert.match(form, /role="alert"/);
assert.match(form, /NAVIGATION_TIMEOUT_MS/);
const shellFile = read('src/components/rondva/OnboardingShell.tsx');
assert.doesNotMatch(shellFile, /aria-label="Rondva home"/);
assert.doesNotMatch(read('src/components/rondva/RondvaLogin.tsx'), /aria-label="Rondva home"/);
pass('onboarding: noValidate + role=alert errors + navigation timeout; no hard-coded English aria-labels');

// Tákn og litir: ekkert bg-white / hex / text-[Npx] í skeljarskrám.
const owned = [
  'src/app/(dashboard)/layout.tsx',
  'src/app/(dashboard)/dashboard/page.tsx',
  'src/app/(dashboard)/dashboard/[id]/page.tsx',
  'src/app/(dashboard)/dashboard/settings/page.tsx',
  'src/app/(dashboard)/dashboard/login/page.tsx',
  'src/app/(dashboard)/dashboard/onboarding/page.tsx',
  'src/components/dashboard/DashboardHeader.tsx',
  'src/components/dashboard/SignOutButton.tsx',
  'src/components/dashboard/BetonLogin.tsx',
  'src/components/rondva/RondvaLogin.tsx',
  'src/components/rondva/CompanyOnboardingForm.tsx',
  'src/components/rondva/OnboardingShell.tsx',
  'src/components/rondva/OnboardingPendingActions.tsx',
  'src/components/rondva/RondvaDashboardEmpty.tsx',
];
for (const file of owned) {
  const src = read(file);
  assert.doesNotMatch(src, /\bbg-white\b|\btext-white\b/, `${file}: bg-white/text-white`);
  assert.doesNotMatch(src, /className="[^"]*\[#[0-9a-fA-F]{3,8}\]/, `${file}: hex in className`);
  assert.doesNotMatch(src, /\btext-\[\d+px\]/, `${file}: text-[Npx]`);
}
pass('shell files use tokens (no bg-white/text-white, hex classes or text-[Npx])');

console.log(`${n} dashboard-shell checks passed.`);
