/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS verify script, same as the other scripts/verify-*.cjs */
// Verð Rondva (src/lib/rondva-pricing.ts) og textinn á rondva.com: Solo $49.99/8, Pro $99.99/30
// (mælt með), Report pack $29.99/10 sem renna ekki út, stofnmannatilboð 20 ókeypis skýrslur á
// mánuði til 31. janúar 2027. Athugar líka að síðurnar noti tölurnar úr einni heimild, að
// gömlu verðin og „2 free reports“ séu horfin, að tilboðið nefni ekki Ísland og að textinn
// haldi áfram að segja satt: appið er „coming to the App Store“, ekkert er til sölu á vefnum.
// Keyrt með `node scripts/verify-rondva-pricing.cjs` — engin bygging, engin netköll.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
// Fjarlægir athugasemdir svo athuganir um orðalag snerti aðeins kóðann og textann.
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(read('src/lib/rondva-pricing.ts'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports: mod.exports, module: mod },
);
// vm-samhengið hefur eigin Array/Object-frumgerðir: JSON-umferð svo deepStrictEqual sjái venjuleg gögn.
const plain = (x) => JSON.parse(JSON.stringify(x));
const { usd } = mod.exports;
const RONDVA_PLANS = plain(mod.exports.RONDVA_PLANS);
const RONDVA_PACK = plain(mod.exports.RONDVA_PACK);
const RONDVA_INCLUDED = plain(mod.exports.RONDVA_INCLUDED);
const RONDVA_OFFER = plain(mod.exports.RONDVA_OFFER);
const RONDVA_PRICE_NOTE = mod.exports.RONDVA_PRICE_NOTE;

let n = 0;
const pass = (name) => { n++; console.log(`PASS ${name}`); };

// 1. Tölurnar sem eigandinn samþykkti (2026-10-07).
assert.deepEqual(
  RONDVA_PLANS.map((p) => [p.id, p.name, p.price, p.reports]),
  [['solo', 'Solo', '49.99', 8], ['pro', 'Pro', '99.99', 30]],
);
assert.equal(RONDVA_PACK.name, 'Report pack');
assert.equal(RONDVA_PACK.price, '29.99');
assert.equal(RONDVA_PACK.reports, 10);
assert.equal(usd('49.99'), '$49.99');
pass('Solo $49.99 / 8, Pro $99.99 / 30, Report pack $29.99 / 10');

// 2. Pro er eina áætlunin sem er merkt „mælt með“.
assert.deepEqual(RONDVA_PLANS.filter((p) => p.recommended).map((p) => p.id), ['pro']);
pass('Pro is the only recommended plan');

// 3. Innifalið í öllum áætlunum.
assert.deepEqual(RONDVA_INCLUDED, [
  '2 AI revisions included with every report',
  'Unlimited manual editing and re-exports',
  'Your company branding on every report',
]);
pass('every plan includes 2 AI revisions, unlimited editing and re-exports, company branding');

// 4. Stofnmannatilboðið: 20 á mánuði til 31. janúar 2027, ekkert kort, ekkert Ísland.
assert.equal(RONDVA_OFFER.freeReportsPerMonth, 20);
assert.equal(RONDVA_OFFER.endsOn, '31 January 2027');
for (const text of [RONDVA_OFFER.endsOn, RONDVA_PRICE_NOTE, RONDVA_PACK.blurb, ...RONDVA_PLANS.map((p) => p.blurb), ...RONDVA_INCLUDED]) {
  assert.ok(!/iceland|icelandic/i.test(text), `no mention of Iceland in: ${text}`);
}
assert.equal(RONDVA_PRICE_NOTE, 'Prices in USD; your App Store shows your local price incl. tax.');
pass('founding offer is 20 free reports a month until 31 January 2027; no mention of Iceland; USD / local-price note is exact');

// 5. Síðurnar nota heimildina og sýna tilboðið og athugasemdina.
const landing = read('src/app/(rondva)/rondva/page.tsx');
const support = read('src/app/(rondva)/rondva/support/page.tsx');
const terms = read('src/app/(rondva)/rondva/terms/page.tsx');
const login = read('src/components/rondva/RondvaLogin.tsx');
const pages = { landing, support, terms };
for (const [name, src] of Object.entries(pages)) {
  assert.match(src, /from "@\/lib\/rondva-pricing"/, `${name} imports the pricing module`);
}
for (const [name, src] of [['landing', landing], ['support', support]]) {
  const code = stripComments(src);
  for (const price of ['49.99', '99.99', '29.99']) {
    assert.ok(!code.includes(price), `${name} must read ${price} from rondva-pricing.ts, not hardcode it`);
  }
  assert.match(code, /RONDVA_OFFER/, `${name} shows the founding offer`);
}
assert.match(landing, /RONDVA_PRICE_NOTE/);
assert.match(landing, /RONDVA_PLANS\.map/);
assert.match(landing, /RONDVA_PACK/);
assert.match(landing, /RONDVA_INCLUDED/);
assert.match(landing, /Recommended/);
assert.match(landing, /id="pricing"/);
assert.match(support, /RONDVA_PRICE_NOTE/);
pass('landing and support read prices from one module and show offer, plans, pack and the USD note');

// 6. Gömul verð og „2 free reports“ eru farin úr öllu Rondva-svæðinu.
const rondvaFiles = [
  'src/app/(rondva)/rondva/page.tsx',
  'src/app/(rondva)/rondva/support/page.tsx',
  'src/app/(rondva)/rondva/terms/page.tsx',
  'src/app/(rondva)/rondva/privacy/page.tsx',
  'src/app/(rondva)/rondva/cookies/page.tsx',
  'src/app/(rondva)/layout.tsx',
  'src/components/rondva/RondvaLogin.tsx',
  'src/components/rondva/WaitlistForm.tsx',
];
const stale = [/39\.99/, /complimentary/i, /first 2 AI-drafted/i, /2 AI-drafted reports (are )?free/i, /first 2 .*free/i, /20 AI-drafted reports per month/, /Planned pricing/, /Nothing is for sale yet/];
for (const rel of rondvaFiles) {
  const code = stripComments(read(rel));
  for (const re of stale) assert.ok(!re.test(code), `${rel} still contains ${re}`);
}
pass('no old $39.99, "20 reports per month at $99.99", "first 2 reports free" or "complimentary" wording left');

// 7. Tilboðið á kynningarsíðunni og í /support nefnir ekki Ísland.
for (const [name, src] of [['landing', landing], ['support pricing section', support.slice(support.indexOf('id: "pricing"'), support.indexOf('id: "language"'))]]) {
  assert.ok(!/iceland|icelandic|ísland/i.test(stripComments(src)), `${name} must not mention Iceland`);
}
const termsPricing = terms.slice(terms.indexOf('id: "pricing"'), terms.indexOf('id: "acceptable-use"'));
assert.ok(!/iceland|icelandic/i.test(termsPricing), 'terms pricing section must not mention Iceland');
pass('pricing copy (landing, support, terms) does not mention Iceland');

// 8. Heiðarleiki: appið er „coming to the App Store“; ekkert er selt á vefnum.
const landingCode = stripComments(landing);
assert.match(landingCode, /coming to the App\s+Store/);
assert.match(landingCode, /nothing can be bought on this page/);
assert.match(landingCode, /Join the waitlist/);
assert.match(landingCode, /href="#waitlist"/);
for (const claim of [/available (now )?on the App Store/i, /download on the App Store/i, /get it on the App Store/i, /buy now/i, /subscribe now/i, /start your subscription/i, /free trial/i]) {
  assert.ok(!claim.test(landingCode), `landing must not claim ${claim}`);
  assert.ok(!claim.test(stripComments(support)), `support must not claim ${claim}`);
}
assert.match(stripComments(support), /once it is\s+available/);
assert.match(stripComments(terms), /When paid plans are offered in the app/);
// Innskráningarsíðan lofar „first reports are free“ án talna — engin 2.
assert.ok(!/\b2 (free )?reports\b/i.test(stripComments(login)));
pass('copy stays honest: coming to the App Store, nothing for sale on the web, waitlist CTA kept, no old "2 free reports" in login');

// 9. Tilboðshnapparnir: aðgangur að stjórnborði (BRANDS.rondva.appUrl) og biðlistinn.
assert.match(landing, /href=\{BRANDS\.rondva\.appUrl\}/);
assert.match(landing, /import \{ BRANDS \} from "@\/lib\/brand"/);
pass('offer card links to the company sign-up (app.rondva.com) and keeps the waitlist link');

console.log(`${n} Rondva pricing checks passed; no network calls made.`);
