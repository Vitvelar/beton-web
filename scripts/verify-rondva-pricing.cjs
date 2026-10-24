/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS verify script, same as the other scripts/verify-*.cjs */
// Verð Rondva (src/lib/rondva-pricing.ts) og textinn á rondva.com eftir útgáfudags-PR og B5 (2026-10-19): Solo US$49.99/15,
// Pro US$99.99/30 (mælt með), Report pack US$69.99/10 sem renna ekki út (dýrari á skýrslu en áætlanirnar), fyrsti mánuður frír: 20 ókeypis
// AI-skýrslur í 30 daga frá FYRSTU AI-skýrslu fyrirtækisins (kom 2026-10-08 í stað stofnmannatilboðsins
// 20 á mánuði til 31. janúar 2027), ein tilboðslína (RONDVA_OFFER_LINE, smíðuð úr RONDVA_TRIAL) og ein
// prufa (RONDVA_TRIAL). Athugar líka að síðurnar noti tölurnar úr einni heimild, að appið sé kynnt sem
// „on the App Store“ (engin biðlista- eða þróunarorð), að /nz, llms.txt, robots.txt, sitemap og JSON-LD
// séu rétt, og að textinn haldi áfram að segja satt (ekkert er selt á vefnum).
// §14 (2026-10-24): landasíður /au /uk /ie /us /ca (rondva-countries.ts + CountryPage.tsx), hreflang, sýnisskýrslurofar.
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

// Hleður .ts-einingu (með @/-samheitum og ./-innflutningi) án byggingar.
const cache = new Map();
function load(rel) {
  if (cache.has(rel)) return cache.get(rel);
  const mod = { exports: {} };
  cache.set(rel, mod.exports);
  const resolve = (id) => {
    if (id.startsWith('@/')) return `src/${id.slice(2)}.ts`;
    if (id.startsWith('./') || id.startsWith('../')) return path.join(path.dirname(rel), `${id}.ts`);
    return null;
  };
  const code = ts.transpileModule(read(rel), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, {
    exports: mod.exports,
    module: mod,
    Response,
    JSON,
    Number,
    Array,
    Object,
    require: (id) => (resolve(id) ? load(resolve(id)) : require(id)),
  });
  cache.set(rel, mod.exports);
  return mod.exports;
}
// vm-samhengið hefur eigin Array/Object-frumgerðir: JSON-umferð svo deepStrictEqual sjái venjuleg gögn.
const plain = (x) => JSON.parse(JSON.stringify(x));

const pricing = load('src/lib/rondva-pricing.ts');
const links = load('src/lib/rondva-links.ts');
const seo = load('src/lib/rondva-seo.ts');
const { usd } = pricing;
const RONDVA_PLANS = plain(pricing.RONDVA_PLANS);
const RONDVA_PACK = plain(pricing.RONDVA_PACK);
const RONDVA_INCLUDED = plain(pricing.RONDVA_INCLUDED);
const RONDVA_TRIAL = plain(pricing.RONDVA_TRIAL);
const RONDVA_PRICE_NOTE = pricing.RONDVA_PRICE_NOTE;
const RONDVA_OFFER_LINE = pricing.RONDVA_OFFER_LINE;

let n = 0;
const pass = (name) => { n++; console.log(`PASS ${name}`); };

// 1. Tölurnar sem eigandinn samþykkti (2026-10-07) og „US$“-merkingin [pricing-4].
assert.deepEqual(
  RONDVA_PLANS.map((p) => [p.id, p.name, p.price, p.reports]),
  [['solo', 'Solo', '49.99', 15], ['pro', 'Pro', '99.99', 30]],
);
assert.equal(RONDVA_PACK.name, 'Report pack');
assert.equal(RONDVA_PACK.price, '69.99');
assert.equal(RONDVA_PACK.reports, 10);
assert.equal(usd('49.99'), 'US$49.99');
assert.equal(usd('99.99'), 'US$99.99');
pass('Solo US$49.99 / 15, Pro US$99.99 / 30, Report pack US$69.99 / 10; usd() prints "US$"');

// 1b. B5 [pricing-1]: pakkinn er dýrari á skýrslu en Solo og Pro (vefur sýnir verð á skýrslu á öllum þremur
//     spjöldum) og segir „Plans are cheaper per report.“ alls staðar þar sem hann er nefndur (forsíða, /support,
//     llms.txt, JSON-LD). NZ: pakkinn verður að vera ≥ NZ$139.99 í ASC (Solo NZ$99.99 / 15 = 6.67 á skýrslu).
{
  const per = (price, reports) => Number(price) / reports;
  assert.equal(pricing.perReport('49.99', 15), '3.33');
  assert.equal(pricing.perReport('99.99', 30), '3.33');
  assert.equal(pricing.perReport('69.99', 10), '7.00');
  for (const plan of RONDVA_PLANS) {
    assert.ok(per(RONDVA_PACK.price, RONDVA_PACK.reports) > per(plan.price, plan.reports), `pack costs more per report than ${plan.name}`);
  }
  assert.ok(139.99 / RONDVA_PACK.reports > Number(pricing.RONDVA_NZ_SOLO.price) / RONDVA_PLANS[0].reports, 'NZ$139.99 pack > NZ Solo per report');
  assert.equal(RONDVA_PACK.blurb, `For a busy month: top up ${RONDVA_PACK.reports} reports. Plans are cheaper per report.`);
  const landingSrc = stripComments(read('src/app/(rondva)/rondva/page.tsx'));
  assert.match(landingSrc, /\{RONDVA_PACK\.blurb\}/);
  assert.match(landingSrc, /\{usd\(perReport\(plan\.price, plan\.reports\)\)\} per report/);
  assert.match(landingSrc, /\{usd\(perReport\(RONDVA_PACK\.price, RONDVA_PACK\.reports\)\)\} per report\. They never expire\./);
  const supportSrc = stripComments(read('src/app/(rondva)/rondva/support/page.tsx'));
  assert.equal((supportSrc.match(/Plans are cheaper per report\./g) || []).length, 2, '/support FAQ + price list');
  assert.match(read('src/lib/rondva-seo.ts'), /never expire\. Plans are cheaper per report\. \$\{priceNote\}/);
  assert.match(read('src/app/(rondva)/rondva/llms.txt/route.ts'), /never expire\. Plans are cheaper per report\.`/);
}
pass('B5: pack US$7.00/report > Solo and Pro US$3.33/report; per-report price on all three cards; "Plans are cheaper per report." on landing, /support, llms.txt and JSON-LD');

// 2. Pro er eina áætlunin sem er merkt „mælt með“, og Pro-textinn er um einn skoðunarmann [trust-3].
assert.deepEqual(RONDVA_PLANS.filter((p) => p.recommended).map((p) => p.id), ['pro']);
assert.equal(RONDVA_PLANS.find((p) => p.id === 'pro').blurb, 'For a busy inspector — 30 AI reports a month.');
assert.ok(!/team|practice/i.test(RONDVA_PLANS.map((p) => p.blurb).join(' ')), 'no team seats are sold');
pass('Pro is the only recommended plan; Pro blurb: "For a busy inspector — 30 AI reports a month."');

// 3. Innifalið í öllum áætlunum.
assert.deepEqual(RONDVA_INCLUDED, [
  '2 AI revisions included with every report',
  "Manual edits and re-exports don't use a report",
  'Your company branding on every report',
]);
pass('every plan includes 2 AI revisions, company branding, and manual edits/re-exports that don\'t use a report (never "unlimited")');

// 4. Fyrsti mánuður frír: 20 skýrslur / 30 dagar, ekkert kort, ekkert Ísland; stofnmannatilboðið horfið;
//    ein tilboðslína smíðuð úr RONDVA_TRIAL, og athugasemdin um verð í mynt kaupandans.
assert.deepEqual(RONDVA_TRIAL, { freeReports: 20, days: 30 });
assert.equal(pricing.RONDVA_OFFER, undefined, 'RONDVA_OFFER (20 a month until 31 January 2027) is gone');
assert.equal(RONDVA_OFFER_LINE, 'First month free — 20 AI-drafted reports in your first month. No card.');
assert.match(
  read('src/lib/rondva-pricing.ts'),
  /RONDVA_OFFER_LINE = `First month free — \$\{RONDVA_TRIAL\.freeReports\} AI-drafted reports in your first month\. No card\.`/,
  'the offer line is built from RONDVA_TRIAL, not typed twice',
);
for (const text of [RONDVA_OFFER_LINE, RONDVA_PRICE_NOTE, RONDVA_PACK.blurb, ...RONDVA_PLANS.map((p) => p.blurb), ...RONDVA_INCLUDED]) {
  assert.ok(!/iceland|icelandic/i.test(text), `no mention of Iceland in: ${text}`);
}
assert.ok(!/founding|31 January|every month|unlimited|only|compliant|certified|accurate/i.test(RONDVA_OFFER_LINE), 'offer line has no founding-offer or forbidden claim words');
assert.equal(
  RONDVA_PRICE_NOTE,
  'Charged by Apple in your currency incl. GST/VAT. Solo is NZ$99.99 in New Zealand, A$79.99 in Australia and EUR 59.99 in Ireland.',
);
pass('first month free is 20 AI reports for 30 days; founding offer gone; one offer line built from RONDVA_TRIAL; no mention of Iceland; GST/VAT price note is exact');

// 5. Síðurnar nota heimildina og sýna tilboðið og athugasemdina.
const landing = read('src/app/(rondva)/rondva/page.tsx');
const support = read('src/app/(rondva)/rondva/support/page.tsx');
const terms = read('src/app/(rondva)/rondva/terms/page.tsx');
const nz = read('src/app/(rondva)/rondva/nz/page.tsx');
const login = read('src/components/rondva/RondvaLogin.tsx');
const emptyState = read('src/components/rondva/RondvaDashboardEmpty.tsx');
const pages = { landing, support, terms };
for (const [name, src] of Object.entries(pages)) {
  assert.match(src, /from "@\/lib\/rondva-pricing"/, `${name} imports the pricing module`);
}
for (const [name, src] of [['landing', landing], ['support', support], ['nz', nz]]) {
  const code = stripComments(src);
  for (const price of ['49.99', '99.99', '69.99', '29.99']) {
    assert.ok(!code.includes(price), `${name} must read ${price} from rondva-pricing.ts, not hardcode it`);
  }
  assert.ok(!/\bRONDVA_OFFER\b|Founding offer|founding offer|every month\.|free every month|31 January 2027/.test(code), `${name}: founding-offer copy removed`);
}
for (const [name, src] of [['landing', landing], ['support', support]]) {
  const code = stripComments(src);
  assert.match(code, /RONDVA_TRIAL\.freeReports/, `${name} shows the free first month`);
  assert.match(code, /RONDVA_TRIAL\.days/, `${name} shows the 30 days`);
}
assert.match(landing, /RONDVA_PRICE_NOTE/);
assert.match(landing, /RONDVA_PLANS\.map/);
assert.match(landing, /RONDVA_PACK/);
assert.match(landing, /RONDVA_INCLUDED/);
assert.match(landing, /Recommended/);
assert.match(landing, /id="pricing"/);
assert.match(support, /RONDVA_PRICE_NOTE/);
// Hero og stjórnborð lesa tilboðslínuna úr einni fasta; engin harðkóðuð útgáfa.
assert.match(landing, /\{RONDVA_OFFER_LINE\}/);
assert.match(emptyState, /RONDVA_OFFER_LINE/);
assert.match(stripComments(nz), /RONDVA_OFFER_LINE/);
for (const [name, src] of [['landing', landing], ['empty state', emptyState], ['nz', nz]]) {
  assert.ok(!/Your first reports are free|First 30 days free|First month free — /.test(stripComments(src)), `${name} must not hardcode the offer line`);
}
// Skilmálar: prufureglan kemur úr RONDVA_TRIAL, stofnmannatilboðið er horfið.
assert.match(stripComments(terms), /RONDVA_TRIAL\.freeReports/);
assert.ok(!/\bRONDVA_OFFER\b|Founding offer|31 January 2027/.test(stripComments(terms)), 'terms: founding-offer copy removed');
pass('landing, support, terms and /nz read prices, the free first month and the one offer line from one module; founding-offer copy removed');

// 6. Gömul verð, „2 free reports“ og biðlista-/þróunarorð eru farin úr öllu Rondva-svæðinu.
const rondvaFiles = [
  'src/app/(rondva)/rondva/page.tsx',
  'src/app/(rondva)/rondva/nz/page.tsx',
  'src/app/(rondva)/rondva/support/page.tsx',
  'src/app/(rondva)/rondva/terms/page.tsx',
  'src/app/(rondva)/rondva/not-found.tsx',
  'src/app/(rondva)/layout.tsx',
  'src/components/rondva/RondvaLogin.tsx',
  'src/components/rondva/RondvaHeader.tsx',
  'src/components/rondva/RondvaFooter.tsx',
  'src/components/rondva/RondvaDashboardEmpty.tsx',
  'src/components/rondva/ConsentBanner.tsx',
];
const stale = [/39\.99/, /29\.99/, /\b8 AI(-drafted)? reports/, /complimentary/i, /first 2 AI-drafted/i, /2 AI-drafted reports (are )?free/i, /first 2 .*free/i, /20 AI-drafted reports per month/, /Planned pricing/, /Nothing is for sale yet/];
for (const rel of rondvaFiles) {
  const code = stripComments(read(rel));
  for (const re of stale) assert.ok(!re.test(code), `${rel} still contains ${re}`);
}
// Sópið úr PROMPT P2: ekkert utan lagatexta (privacy/cookies) og ónotaða WaitlistForm.tsx.
const sweep = /in development|being built|waitlist|coming to the App Store|before we open/i;
const sweepRoots = ['src/app/(rondva)', 'src/components/rondva'];
const skip = new Set(['src/app/(rondva)/rondva/privacy/page.tsx', 'src/app/(rondva)/rondva/cookies/page.tsx', 'src/components/rondva/WaitlistForm.tsx']);
const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => {
  const rel = `${dir}/${e.name}`;
  return e.isDirectory() ? walk(rel) : /\.(tsx?|css)$/.test(e.name) ? [rel] : [];
});
for (const rel of sweepRoots.flatMap(walk)) {
  if (skip.has(rel)) continue;
  assert.ok(!sweep.test(read(rel)), `${rel} still contains launch-blocking wording (${sweep})`);
}
// 6b. DON'T-SAY (2026-10-19, aðallota): „unlimited“ og markaðsverð á borð við „NZ$500+“ koma hvergi fyrir á Rondva-svæðinu
//     (síður, íhlutir, rondva-*.ts í lib), heldur ekki í lagatextum.
{
  const libRondva = fs.readdirSync(path.join(root, 'src/lib')).filter((f) => /^rondva-.*\.ts$/.test(f)).map((f) => `src/lib/${f}`);
  for (const rel of [...sweepRoots.flatMap(walk), ...libRondva]) {
    const text = read(rel);
    assert.ok(!/unlimited/i.test(text), `${rel} says "unlimited" (DON'T-SAY)`);
    assert.ok(!/NZ\$\s?500|You charge NZ\$/i.test(text), `${rel} quotes a market rate (DON'T-SAY)`);
  }
}
pass('no old prices, "first 2 reports free" or complimentary wording; no "in development / waitlist / coming to the App Store" outside privacy, cookies and the unused WaitlistForm');

// 7. Tilboðið (forsíða frá verðkaflanum, /support-verð, skilmálar) nefnir ekki Ísland.
const landingPricing = stripComments(landing.slice(landing.indexOf('id="pricing"')));
for (const [name, src] of [['landing pricing', landingPricing], ['support pricing section', stripComments(support.slice(support.indexOf('id: "pricing"'), support.indexOf('id: "tax-invoice"')))]]) {
  assert.ok(!/iceland|icelandic|ísland/i.test(src), `${name} must not mention Iceland`);
}
const termsPricing = terms.slice(terms.indexOf('id: "pricing"'), terms.indexOf('id: "acceptable-use"'));
assert.ok(!/iceland|icelandic/i.test(termsPricing), 'terms pricing section must not mention Iceland');
pass('pricing copy (landing pricing section, support, terms) does not mention Iceland');

// 8. Heiðarleiki: appið er á App Store (merki + slóð), ekkert er selt á vefnum, engin biðlistahnappur.
const landingCode = stripComments(landing);
assert.equal(links.APP_STORE_URL, 'https://apps.apple.com/app/id6817769506');
assert.match(landingCode, /<AppStoreBadge \/>/);
assert.match(landingCode, /Inspection app for iPhone · On the App Store/);
assert.match(landingCode, /Rondva is built for/);
assert.match(landingCode, /nothing can\s+be bought on this page/i);
assert.ok(!/href="#waitlist"|<WaitlistForm|id="waitlist"/.test(landingCode), 'landing has no waitlist anchor or form');
assert.match(landingCode, /Not on iPhone\? Email/);
assert.match(landingCode, /In New Zealand\?[\s\S]{0,200}href="\/nz"[\s\S]{0,250}See the NZS 4306 page →/);
for (const claim of [/buy now/i, /subscribe now/i, /start your subscription/i, /free trial/i, /available on Android/i]) {
  assert.ok(!claim.test(landingCode), `landing must not claim ${claim}`);
  assert.ok(!claim.test(stripComments(support)), `support must not claim ${claim}`);
  assert.ok(!claim.test(stripComments(nz)), `nz must not claim ${claim}`);
}
// „See a sample report“ aðeins ef alvöru PDF er til; HAS_SAMPLE true krefst skráarinnar.
assert.match(landingCode, /HAS_SAMPLE \? \(/);
assert.match(stripComments(nz), /HAS_SAMPLE \? \(/);
if (links.HAS_SAMPLE) assert.ok(fs.existsSync(path.join(root, 'public/rondva/sample-nzs4306.pdf')), 'HAS_SAMPLE needs public/rondva/sample-nzs4306.pdf');
else assert.ok(!fs.existsSync(path.join(root, 'public/rondva/sample-nzs4306.pdf')), 'HAS_SAMPLE is false so the sample PDF must not exist yet');
// /support: kaupin eru í appinu (1.3.0 og síðar), ekkert á vefnum.
assert.match(stripComments(support), /bought inside the Rondva iPhone app \(version 1\.3\.0 and later\)/);
assert.match(stripComments(support), /Nothing can\s+be bought on this website/);
assert.match(stripComments(terms), /When paid plans are offered in the app/);
// Innskráningarsíðan: nýr texti, App Store-hlekkur í stað biðlista, engin „2 free reports“.
assert.ok(!/\b2 (free )?reports\b/i.test(stripComments(login)));
assert.match(login, /Sign in with \{appleEnabled \? "Google or Apple" : "Google"\}\. New here\? You&apos;ll set up your\s+company in under a minute\./);
assert.ok(!/approved\s+with/.test(login), 'login no longer says "approved with"');
assert.match(login, /href=\{APP_STORE_URL\}/);
pass('copy stays honest: on the App Store, nothing for sale on the web, no waitlist, sample button gated by HAS_SAMPLE, login points to the App Store');

// 9. Hnappar: App Store-merki + aðgangur að stjórnborði (BRANDS.rondva.appUrl); QR og merki eru til.
assert.match(landing, /href=\{BRANDS\.rondva\.appUrl\}/);
assert.match(landing, /import \{ BRANDS \} from "@\/lib\/brand"/);
assert.match(stripComments(read('src/components/rondva/RondvaHeader.tsx')), /href=\{APP_STORE_URL\}/);
for (const f of ['public/rondva/app-store-badge.svg', 'public/rondva/qr-app-store.svg', 'public/rondva/screens/overview-nz.webp', 'public/rondva/screens/offline-nz.webp']) {
  assert.ok(fs.existsSync(path.join(root, f)), `${f} exists`);
}
assert.ok(read('public/rondva/app-store-badge.svg').includes('Download_on_the_App_Store'), 'official Apple badge');
assert.ok(!read('public/rondva/qr-app-store.svg').includes('<script'), 'QR svg is static');
for (const f of ['overview-nz', 'offline-nz', 'observation-nz']) {
  assert.ok(fs.statSync(path.join(root, `public/rondva/screens/${f}.webp`)).size < 60_000, `${f}.webp < 60 KB`);
}
assert.ok(!/hidden md:block/.test(landingCode.slice(landingCode.indexOf('figure'), landingCode.indexOf('figure') + 400)), 'screenshots are not hidden on phones');
pass('App Store badge, QR and NZ screenshots exist (<60 KB); header CTA links to the App Store; phone shows a screenshot');

// 10. Traustblokkin, teymistexti, „Where the AI stops“, skattareikningur [web-5, trust-3, positioning-3, pricing-4].
const aiStops = read('src/components/rondva/WhereAiStops.tsx');
assert.match(landingCode, /Who builds Rondva/);
assert.ok(landingCode.indexOf('id="who"') > -1 && landingCode.indexOf('id="who"') < landingCode.indexOf('id="pricing"'), 'builder block sits above pricing');
for (const s of ['Hjalti Sigmundsson', 'hjalti@rondva.com', 'Built in Reykjavík with a pre-purchase inspection firm that writes every one of its reports in', 'from about 3 hours 40 minutes to about 30 minutes', 'Your data is stored in the EU (Ireland)', 'Every report says which text was drafted with AI assistance; you review it and issue it under your name.', 'Billed by Apple in your currency. Cancel any time in Settings, no contract.']) {
  assert.ok(landing.replace(/\s+/g, ' ').includes(s), `landing says: ${s}`);
}
assert.ok(/\{BRANDS\.rondva\.company\} · reg\. no\. \{BRANDS\.rondva\.companyId\} · \{BRANDS\.rondva\.companyAddress\}/.test(landing), 'company line has the same fields as /support');
assert.ok(/\{R\.company\} · reg\. no\. \{R\.companyId\} · \{R\.companyAddress\}/.test(support), '/support company line');
assert.ok(/href="\/privacy"[\s\S]{0,120}Your data is stored/.test(landing) && /href="\/terms#availability"/.test(landing), 'trust lines link to /privacy and /terms#availability');
assert.ok(/id: "availability",/.test(terms), '/terms#availability exists');
assert.ok(!/replies within|reply within|within one (NZ )?business day/i.test(landingCode), 'no reply-time promise (Hjalti decides)');
assert.ok(landing.replace(/\s+/g, ' ').includes('built around the inspector on site. Two or three of you? We&apos;ll link your colleagues to one company account.'), 'team wording');
assert.ok(!/three-person team/i.test(landing), 'no "three-person team"');
for (const s of ['Your ratings are locked.', 'The AI cannot change the severity you set on any finding.', 'On NZS 4306 reports, any figure in a finding’s write-up, and every moisture reading, must match a number you entered, or Rondva falls back to your own words.']) {
  assert.ok(aiStops.includes(s), `WhereAiStops says: ${s}`);
}
assert.match(landing, /<WhereAiStops \/>/);
assert.match(nz, /<WhereAiStops \/>/);
const sup = stripComments(support).replace(/\s+/g, ' ');
for (const s of ['Do I get a tax invoice?', 'More than one inspector?', 'Does Rondva write NZS 4306 reports?', 'Where are my photos stored?', 'Does it work with no signal?', 'What happens if Rondva shuts down?', 'on app.rondva.com, in any browser, including your phone&apos;s', 'Need a GST/VAT invoice addressed to your company? Email rondva@rondva.com.', 'Self-serve team invites are coming.', 'stops at the company screen']) {
  assert.ok(sup.includes(s), `support says: ${s}`);
}
assert.ok(!/on the phone or on app\.rondva\.com/.test(sup), 'support no longer says "on the phone or on app.rondva.com"');
pass('builder block above pricing, trust lines with links, team wording, ratings-locked + NZ guard line, tax-invoice and team FAQs, "in any browser"');

// 11. /nz: metadata, H1, skilgreining, innihald úr Nzs4306Report.tsx, NZ$-verð, engar óstaðfestar fullyrðingar.
const nzCode = stripComments(nz);
const nzPlain = nz.replace(/\s+/g, ' ');
assert.match(nzCode, /title: \{ absolute: TITLE \}/);
assert.ok(nzPlain.includes('const TITLE = "NZS 4306 building inspection reports, drafted on your iPhone | Rondva"'));
assert.ok(nzPlain.replace('<span className="whitespace-nowrap">NZS 4306</span>', 'NZS 4306').includes('Your NZS 4306 report, <em>drafted from your site notes.</em>'));
assert.ok(nzPlain.includes('Photos, notes, moisture readings and your own rating for each area, even under the house with no signal. Rondva drafts the report in NZS 4306:2005 order. You review every word, and the PDF goes out under your company name.'));
assert.ok(nzPlain.includes("Rondva is an iPhone app that drafts NZS 4306:2005 pre-purchase inspection reports from the inspector's photos, notes and ratings. The inspector reviews and issues the report."));
assert.ok(nzPlain.includes('Captures with no signal: under the house, in the roof space.'));
assert.ok(nzPlain.includes('Pro and the Report Pack are priced in NZ$ in the App Store.'));
assert.ok(nzPlain.includes('<strong>Solo {soloPrice}/month:</strong> {soloReports} AI-drafted reports a month.'));
assert.ok(!/per report|a report\.|soloPerReport|NZ\$\d+\+/.test(stripComments(nz).replace('never use up a report.', '')), '/nz shows no per-report or market-rate figures (DON\'T-SAY 2026-10-19)');
const nzPricing = load('src/lib/rondva-pricing.ts');
assert.equal(nzPricing.RONDVA_NZ_SOLO.price, '99.99');
assert.equal(nzPricing.nzSoloPerReport, undefined, 'no NZ per-report figure is published');
assert.ok(!/Pro[^.]{0,40}NZ\$\d|Report Pack[^.]{0,40}NZ\$\d/.test(nzPlain), 'no guessed NZ$ prices for Pro or the Report Pack');
// „What's in the report“: hver liður verður að vera kafli í Nzs4306Report.tsx.
const report = read('src/components/report/Nzs4306Report.tsx');
for (const section of ['Executive summary', 'Significant defects', 'Certificate of Inspection', 'Limitations and areas not inspected', 'Gradual deterioration and maintenance', 'Moisture readings', 'Use of AI in this report']) {
  assert.ok(report.includes(section), `Nzs4306Report.tsx has the section "${section}"`);
}
for (const label of ['Site', 'Exterior', 'Roof', 'Roof space', 'Subfloor', 'Interior', 'Services']) assert.ok(read('src/lib/report/nz-elements.ts').includes(`"${label}"`), `nz-elements has ${label}`);
for (const t of ['Executive summary', 'Summary of significant defects', 'Certificate of Inspection', 'Findings by part of the building', 'Gradual deterioration and maintenance', 'Moisture readings', 'Limitations and areas not inspected', 'Use of AI in this report']) assert.ok(nz.includes(`title: "${t}"`), `/nz lists "${t}"`);
assert.ok(!/compliant|certified|NZIBI|approved|accurate|unlimited|used by NZ inspectors|edit on your phone|\bthe only\b|\bonly (app|tool)\b|\bfirst (app|tool)\b/i.test(nzCode), '/nz makes no banned claims');
pass('/nz: exact title, H1, subtitle, definition, caption and price lines; report contents match Nzs4306Report.tsx; no guessed NZ$ prices; no banned claims');

// 12. AI-SEO: JSON-LD, FAQPage, sitemap, llms.txt, robots.txt.
const org = plain(seo.organizationLd());
const app = plain(seo.softwareApplicationLd());
assert.equal(org.name, 'Vitvélar ehf.');
assert.equal(org.address.streetAddress, 'Hjálmholt 2');
assert.equal(org.address.addressCountry, 'IS');
assert.deepEqual(org.sameAs, ['https://apps.apple.com/app/id6817769506']);
assert.equal(app.name, 'Rondva');
assert.equal(app.operatingSystem, 'iOS');
assert.equal(app.applicationCategory, 'BusinessApplication');
assert.equal(app.installUrl, 'https://apps.apple.com/app/id6817769506');
assert.deepEqual(app.offers.map((o) => [o.name, o.price, o.priceCurrency]), [['Free trial', '0', 'USD'], ['Rondva Solo', '49.99', 'USD'], ['Rondva Pro', '99.99', 'USD'], ['Rondva Report pack', '69.99', 'USD']]);
assert.ok(app.offers.slice(1).every((o) => /Price varies by storefront/.test(o.description)), '"price varies by storefront" on paid offers');
const ldString = seo.jsonLdString([org, app, plain(seo.faqPageLd([{ q: 'A?', a: 'B <script>' }])), plain(seo.breadcrumbLd([{ name: 'Rondva', path: '/' }, { name: 'NZ', path: '/nz' }]))]);
assert.ok(!/aggregateRating|"review"/.test(ldString), 'no aggregateRating or review');
assert.ok(!/<script>/.test(ldString), 'JSON-LD escapes "<"');
assert.ok(JSON.parse(ldString)['@graph'].length === 4);
// Eitt script á síðu: hver síða hefur nákvæmlega eitt <JsonLd .../>.
for (const [name, src] of [['landing', landing], ['support', support], ['nz', nz]]) assert.equal((src.match(/<JsonLd\b/g) || []).length, 1, `${name} has exactly one JSON-LD script`);
assert.match(support, /faqPageLd\(FAQ\)/);
assert.match(nz, /faqPageLd\(/);
assert.match(nz, /breadcrumbLd\(/);
// FAQPage-svörin á /support eru sami texti og sést: hver ANSWERS-lykill er birtur með <Lead id=... />.
const answersBlock = support.slice(support.indexOf('const ANSWERS'), support.indexOf('function Lead'));
for (const key of [...answersBlock.matchAll(/^\s{2}(?:"([a-z0-9-]+)"|([a-z0-9]+)):/gm)].map((m) => m[1] || m[2])) {
  assert.ok(support.includes(`<Lead id="${key}" />`), `support shows the answer for ${key}`);
}
// layout, /support og /nz hafa eigin metadata án þróunarorða.
const layout = read('src/app/(rondva)/layout.tsx');
assert.ok(layout.includes('const TITLE = "Rondva: AI-drafted NZS 4306 building inspection reports | iPhone app";'));
assert.ok(!sweep.test(layout));
assert.match(support, /export const metadata/);
pass('JSON-LD (Organization, SoftwareApplication, FAQPage, BreadcrumbList) has no ratings, one script per page; FAQ answers are the visible text; metadata has no launch-blocking wording');

// sitemap, llms.txt og robots.txt (route-föllin keyrð í vm, engin netköll).
(async () => {
  const body = async (rel) => {
    const res = load(rel).GET();
    assert.match(res.headers.get('content-type'), /^(text\/plain|application\/xml); charset=utf-8$/);
    return res.text();
  };
  const sitemap = await body('src/app/(rondva)/rondva/sitemap.xml/route.ts');
  for (const p of ['https://rondva.com</loc>', 'https://rondva.com/nz</loc>', 'https://rondva.com/support</loc>', 'https://rondva.com/llms.txt</loc>']) assert.ok(sitemap.includes(p), `sitemap has ${p}`);
  const llms = await body('src/app/(rondva)/rondva/llms.txt/route.ts');
  const llmsLines = llms.split('\n').filter((l) => l.trim());
  assert.ok(llmsLines.length >= 20 && llmsLines.length <= 30, `llms.txt has 20-30 non-empty lines (${llmsLines.length})`);
  for (const s of ['# Rondva', 'iPhone app', 'NZS 4306:2005', 'Vitvélar ehf.', 'https://apps.apple.com/app/id6817769506', pricing.RONDVA_OFFER_LINE, 'US$49.99', 'US$99.99', 'US$69.99', 'NZ$99.99', 'Plans are cheaper per report.', 'https://rondva.com/nz', 'https://rondva.com/support', 'https://rondva.com/privacy', 'https://rondva.com/terms', 'EU (Ireland)']) assert.ok(llms.includes(s), `llms.txt has ${s}`);
  assert.ok(!sweep.test(llms) && !/aggregateRating|best |the only|certified|compliant/i.test(llms), 'llms.txt: no banned claims');
  const robots = await body('src/app/(rondva)/rondva/robots.txt/route.ts');
  assert.match(robots, /User-agent: \*\nAllow: \//);
  for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Bingbot']) assert.match(robots, new RegExp(`User-agent: ${bot}\\nAllow: /\\n`), `robots allows ${bot}`);
  assert.match(robots, /Disallow: \/dashboard/);
  assert.ok(!/^Disallow: \/$/m.test(robots), 'robots never disallows everything');
  assert.match(robots, /Sitemap: https:\/\/rondva\.com\/sitemap\.xml/);
  // proxy.ts endurskrifar /llms.txt á rondva.com eins og /robots.txt (allt utan /rondva/* fær forskeytið).
  const proxy = read('src/proxy.ts');
  assert.match(proxy, /const target = pathname === "\/" \? RONDVA_ROUTE_PREFIX : `\$\{RONDVA_ROUTE_PREFIX\}\$\{pathname\}`/);
  pass('sitemap lists /nz and /llms.txt; llms.txt is 20-30 facts-only lines; robots allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Bingbot; proxy rewrites /llms.txt like /robots.txt');

  // 13. Stjórnborð: Rondva-tómt ástand í 3 skrefum; Beton-textinn óbreyttur.
  const dash = read('src/app/(dashboard)/dashboard/page.tsx');
  // Tómt ástand Rondva birtist á máli notandans (is/en, textar í katalógnum dashboard-shell.ts).
  assert.match(dash, /\(await getRequestBrand\(\)\) === "rondva"/);
  assert.match(dash, /<RondvaDashboardEmpty locale=\{locale\} \/>/);
  assert.match(dash, /\{t\.emptyTitle\}/);
  assert.match(dash, /\{t\.emptyBody\}/);
  const shellCatalog = read('src/lib/i18n/dashboard-shell.ts');
  for (const s of ['Get Rondva on your iPhone', 'Sign in with the same account you used here.', 'Add your logo and report terms', 'Start your first inspection']) assert.ok(shellCatalog.includes(s), `empty state (en catalog): ${s}`);
  assert.ok(emptyState.includes('href="/dashboard/settings"'), 'empty state links to settings');
  assert.match(emptyState, /<AppStoreBadge \/>/);
  assert.match(emptyState, /<AppStoreQr tone="light" \/>/);
  pass('dashboard empty state: three steps for Rondva (is/en catalog); Beton keeps its Icelandic empty text');

  // 14. Landasíður /au /uk /ie /us /ca (src/lib/rondva-countries.ts + CountryPage.tsx): verð, JSON-LD, bannorð,
  //     heiðarleiki um skýrslusniðið, hreflang, sitemap, llms.txt, fótur og sýnisskýrslur.
  {
    const cm = load('src/lib/rondva-countries.ts');
    const COUNTRIES = plain(cm.COUNTRIES);
    const byCode = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));
    assert.deepEqual(COUNTRIES.map((c) => c.code), ['au', 'uk', 'ie', 'us', 'ca']);
    const pageRel = (cc) => `src/app/(rondva)/rondva/${cc}/page.tsx`;
    const dataSrc = read('src/lib/rondva-countries.ts');
    const compSrc = read('src/components/rondva/CountryPage.tsx');
    const pageSrcs = Object.fromEntries(['au', 'uk', 'ie', 'us', 'ca'].map((cc) => [cc, read(pageRel(cc))]));
    const soloN = RONDVA_PLANS[0].reports;
    const proN = RONDVA_PLANS[1].reports;

    // a. Nákvæm verð landanna (App Store-verð, eigandi 2026-10-24) og skattalína.
    const expected = {
      au: [['solo', 'A$79.99'], ['pro', 'A$149.99'], ['pack', 'A$99.99'], 'Prices include GST.'],
      uk: [['solo', '£49.99'], ['pro', '£99.99'], ['pack', '£69.99'], 'Prices include VAT.'],
      ie: [['solo', '€59.99'], ['pro', '€99.99'], ['pack', '€79.99'], 'Prices include VAT.'],
      us: [['solo', 'US$49.99'], ['pro', 'US$99.99'], ['pack', 'US$69.99'], 'App Store prices in the US exclude sales tax; Apple adds sales tax where it applies.'],
      ca: [['solo', 'CA$69.99'], ['pro', 'CA$129.99'], ['pack', 'CA$99.99'], 'Prices exclude tax; Apple adds GST/HST where it applies.'],
    };
    for (const [cc, [solo, pro, pack, tax]] of Object.entries(expected)) {
      const c = byCode[cc];
      for (const [key, text] of [solo, pro, pack]) assert.equal(cm.money(c, key), text, `${cc} ${key} price`);
      assert.equal(c.taxLine, tax, `${cc} tax line`);
      const a = c.faq.find((f) => f.id === 'price').a;
      assert.equal(
        a,
        `Solo is ${text(solo)} a month for ${soloN} AI-drafted reports, Pro is ${text(pro)} a month for ${proN}, and the Report pack is ${text(pack)} one-time for ${RONDVA_PACK.reports} reports that never expire. Plans are cheaper per report. ${tax} Charged by Apple. ${RONDVA_OFFER_LINE}`,
        `${cc} price answer`,
      );
      assert.ok(c.description.includes(`Solo is ${text(solo)} a month. ${tax}`), `${cc} description has Solo price and tax line`);
      assert.ok(!/\b\d{2,3}\.\d{2}\b/.test(stripComments(pageSrcs[cc])) && !/\b\d{2,3}\.\d{2}\b/.test(stripComments(compSrc)), `${cc}: prices live in the data module, not in JSX`);
    }
    function text(pair) { return pair[1]; }
    // Hvert verð á síðu er eitt af þremur verðum landsins (engin tilbúin verð, ekkert verð á skýrslu, ekkert markaðsverð).
    for (const c of COUNTRIES) {
      const own = new Set(['solo', 'pro', 'pack'].map((k) => cm.money(c, k)));
      const blob = JSON.stringify(c).replace(/Plans are cheaper per report\./g, '');
      for (const m of blob.match(/(?:A|US|CA|NZ)\$\d+(?:\.\d+)?|[£€]\d+(?:\.\d+)?/g) || []) assert.ok(own.has(m), `${c.code}: unexpected amount ${m}`);
      assert.ok(!/per report|\/report|each report|a report costs|market rate|free trial|unlimited/i.test(blob), `${c.code}: no per-report price, market rate, "free trial" or "unlimited"`);
    }
    assert.match(compSrc, /RONDVA_PACK\.blurb/, 'pack card uses RONDVA_PACK.blurb ("Plans are cheaper per report.")');
    assert.match(compSrc, /\{RONDVA_OFFER_LINE\}/);
    assert.equal(pricing.RONDVA_NZ_SOLO.price, '99.99', 'NZ stays Solo NZ$99.99 only');

    // b. Hver síða: gagnaeining, eitt JSON-LD, FAQ = JSON-LD, metadata og útlit.
    for (const [cc, src] of Object.entries(pageSrcs)) {
      assert.match(src, /from "@\/lib\/rondva-countries"/, `${cc} page imports the data module`);
      assert.match(src, new RegExp(`export const metadata = countryMetadata\\(${cc.toUpperCase()}\\)`), `${cc} exports its metadata`);
      assert.match(src, new RegExp(`<CountryPage country=\\{${cc.toUpperCase()}\\} />`), `${cc} renders CountryPage`);
      assert.equal((src.match(/<JsonLd\b/g) || []).length, 0, `${cc}: JSON-LD comes from CountryPage only`);
    }
    assert.equal((compSrc.match(/<JsonLd\b/g) || []).length, 1, 'CountryPage has exactly one JSON-LD script');
    assert.match(compSrc, /faqPageLd\(c\.faq\.map\(\(f\) => \(\{ q: f\.q, a: f\.a \}\)\)\)/);
    assert.match(compSrc, /\{f\.q\}/);
    assert.match(compSrc, /\{f\.a\}/);
    assert.match(compSrc, /breadcrumbLd\(/);
    for (const k of ['organizationLd()', 'softwareApplicationLd()']) assert.ok(compSrc.includes(k), `CountryPage uses ${k}`);
    for (const k of ['RondvaHeader', 'RondvaFooter', 'RevealObserver', 'AppStoreBadge', 'AppStoreQr', 'WhereAiStops']) assert.ok(compSrc.includes(`<${k}`), `CountryPage renders <${k}`);
    for (const c of COUNTRIES) {
      const ld = plain(seo.faqPageLd(c.faq.map((f) => ({ q: f.q, a: f.a }))));
      assert.deepEqual(ld.mainEntity.map((e) => e.acceptedAnswer.text), c.faq.map((f) => f.a), `${c.code}: FAQ answers = JSON-LD answers`);
      assert.equal(new Set(c.faq.map((f) => f.id)).size, c.faq.length, `${c.code}: unique FAQ ids`);
      assert.ok(c.faq.find((f) => f.id === 'what').a === c.lead, `${c.code}: first FAQ answer is the definition paragraph`);
      assert.ok(!/RICS/i.test(JSON.stringify(c)) || !['uk', 'ie'].includes(c.code), `${c.code}: RICS never mentioned`);
      assert.ok(c.eyebrow.includes('iPhone app on the App Store'), `${c.code}: eyebrow`);
      assert.ok(c.h1.em.length > 0 && c.title.endsWith('| Rondva'));
    }

    // c. Bannorð yfir allar landasíður, gagnaeininguna og CountryPage (athugasemdir fjarlægðar).
    const banned = /compliant|complies|certified|approved|endorsed|accredited|meets the standard|in accordance with|the only|\bfirst\b|\bbest\b|unlimited|used by|aggregateRating|customer reviews?|star rating|\d(\.\d)?\s?stars?\b/i;
    const orgs = /\b(RICS|InterNACHI|ASHI|NZIBI|CSA|TREC)\b/;
    for (const [name, src] of [['data module', dataSrc], ['CountryPage', compSrc], ...Object.entries(pageSrcs).map(([cc, s]) => [`${cc} page`, s])]) {
      const code = stripComments(src);
      assert.ok(!banned.test(code), `${name} makes a banned claim: ${(code.match(banned) || [])[0]}`);
      assert.ok(!orgs.test(code), `${name} names a professional body or standard owner: ${(code.match(orgs) || [])[0]}`);
      assert.ok(!sweep.test(code), `${name} has launch-blocking wording`);
    }

    // d. AU: „not“ + „AS 4349.1“ í sömu setningu; engin setning um AS 4349.1 án „not“.
    {
      const au = byCode.au;
      const texts = [au.lead, au.formatLine, au.format.note, ...au.format.items.map((i) => i.body), ...au.faq.map((f) => f.a)];
      const sentences = texts.flatMap((t) => t.split(/(?<=[.?!])\s+/));
      assert.ok(sentences.some((s) => /\bnot\b/.test(s) && s.includes('AS 4349.1')), 'AU: a sentence with "not" and "AS 4349.1"');
      assert.ok(sentences.filter((s) => s.includes('AS 4349.1')).every((s) => /\bnot\b/.test(s)), 'AU: every sentence about AS 4349.1 says "not"');
      assert.ok(au.formatLine.includes('It is not set out in the AS 4349.1 format yet.'), 'AU hero says it is not set out in the AS 4349.1 format yet');
      assert.ok(!/AS 4349/.test(au.title + au.description + au.h1.before + au.h1.em), 'AU title/description/H1 do not mention AS 4349');
      assert.ok(['Minor', 'Serious', 'Very serious'].every((w) => au.formatLine.includes(w) || au.format.items[0].body.includes(w)));
      const en = read('src/lib/report/i18n.ts');
      assert.ok(/rating: \{\s*ok: "Acceptable",\s*warn: "Minor",\s*danger: "Serious",\s*mjog_alvarleg: "Very serious"/.test(en), 'i18n English severity words are Minor / Serious / Very serious');
      assert.ok(!/AS 4349/.test(JSON.stringify([byCode.uk, byCode.ie, byCode.us, byCode.ca])), 'only the AU page mentions AS 4349.1');
    }

    // e. UK og IE: matseinkunnir 1, 2 og 3 (conditionSeverity í i18n.ts), aldrei RICS.
    for (const cc of ['uk', 'ie']) {
      const c = byCode[cc];
      const blob = JSON.stringify(c);
      assert.ok(/condition ratings? of 1, 2 or 3/.test(c.lead) && /condition ratings 1, 2 and 3/i.test(c.format.items[0].title), `${cc}: condition ratings 1, 2 and 3`);
      assert.ok(/Rating 1: no repair is needed at present/.test(c.format.items[0].body) && /Rating 2: a defect that needs repairing or replacing, but is not serious or urgent/.test(c.format.items[0].body) && /Rating 3: a serious defect/.test(c.format.items[0].body));
      assert.ok(!/RICS|Minor, Serious|Very serious|deficienc/i.test(blob), `${cc}: no RICS, no Minor/Serious words, no isop wording`);
      assert.ok(c.formatLine.includes('Rondva is not affiliated with any professional body.'));
      assert.ok(c.format.items.length === 5 && c.format.items.every((i) => i.title && i.body));
    }
    const i18nSrc = read('src/lib/report/i18n.ts');
    for (const s of ['No repair is needed at present.', 'A defect that needs repairing or replacing, but is not considered serious or urgent.', 'Condition rating 1', 'Condition rating 3']) assert.ok(i18nSrc.includes(s), `i18n.ts conditionSeverity: ${s}`);
    {
      const settings = read('src/lib/report/settings.ts');
      assert.match(settings, /CONDITION_RATING_COUNTRIES = new Set\(\["GB", "IE"\]\)/);
      // Sniðin sem UK/IE/AU-síðurnar lýsa eru aðeins til í sjálfgefna skýrslusmiðnum (page.tsx); engar NZ-/isop-greinar.
      const rep = read('src/app/(dashboard)/dashboard/[id]/report/page.tsx');
      for (const k of ['t.tocActionList', 't.actionList', 't.limitationsHeading', 't.conclusion', 't.roomNotes', 't.suggestion', 'brand.termsText', 'brand.termsUrl']) assert.ok(rep.includes(k), `report/page.tsx prints ${k}`);
      assert.match(rep, /\.slice\(0, 10\)/, 'action list = 10 most serious');
    }

    // f. US og CA: tíu kerfi í réttri röð (isop-hönnun §2.1), staða á kerfi, deficiencies-tafla, ekkert „state form“-loforð.
    {
      const systems = ['Roof', 'Exterior', 'Basement, Foundation, Crawlspace & Structure', 'Heating', 'Cooling', 'Plumbing', 'Electrical', 'Fireplace', 'Attic, Insulation & Ventilation', 'Doors, Windows & Interior'];
      assert.deepEqual(plain(cm.ISOP_SYSTEMS), systems);
      const copy = plain(cm.ISOP_COPY);
      assert.deepEqual(copy.systems, systems);
      for (const cc of ['us', 'ca']) {
        const c = byCode[cc];
        assert.deepEqual(c.format.items, copy.items, `${cc} format items are the isop copy`);
        const sysItem = c.format.items.find((i) => i.title === 'Ten systems, in a fixed order');
        let at = -1;
        for (const s of systems) {
          const i = sysItem.body.indexOf(s, at + 1);
          assert.ok(i > at, `${cc}: system "${s}" in order`);
          at = i;
        }
        assert.ok(sysItem.body.includes('Additional items'));
        const all = JSON.stringify(c);
        for (const s of ['Summary of deficiencies', 'Inspected', 'Not inspected', 'Not present', 'Maintenance', 'Repair or replace', 'Major defect', 'not written by the AI', 'Use of AI in this report']) assert.ok(all.includes(s), `${cc} mentions ${s}`);
        assert.ok(/does not replace any (state-required form|form your province requires)/.test(c.formatLine), `${cc}: does not replace a state-required form`);
        assert.ok(!c.screen, `${cc}: no phone figure (the screenshots show NZ content)`);
      }
      assert.ok(byCode.ca.formatLine.includes('Reports are in English only.'), 'CA: English reports only');
      assert.ok(!/Minor, Serious|Very serious|condition rating/i.test(JSON.stringify([byCode.us, byCode.ca])), 'US/CA use the isop rating words, not the AU/UK ones');
      // ISOP-textinn er allur í einum hlut með íslenskri athugasemd um að hann bíði eftir að isop sé í loftinu.
      assert.match(dataSrc, /\/\/ ATH: Allur US\/CA-sniðstextinn er í þessum eina hlut.*\n(?:\/\/.*\n)*export const ISOP_SYSTEMS/);
      assert.equal((dataSrc.match(/export const ISOP_COPY/g) || []).length, 1);
      {
        const outside = dataSrc.slice(0, dataSrc.indexOf('export const ISOP_SYSTEMS')) + dataSrc.slice(dataSrc.indexOf('// ── Hjálparföll'));
        for (const k of ['Summary of deficiencies', 'Repair or replace', 'Major defect', 'Not inspected']) assert.ok(!outside.includes(k), `"${k}" appears only in the ISOP object`);
      }
      for (const cc of ['au', 'uk', 'ie']) assert.ok(!/Summary of deficiencies|Not inspected|Repair or replace/.test(JSON.stringify(byCode[cc])), `${cc} has no isop wording`);
    }

    // g. Skjámyndir: aðeins þar sem innihaldið er satt fyrir landið (AU: athugasemdaskjár með Minor/Serious/Very serious).
    for (const c of COUNTRIES) {
      const blob = JSON.stringify(c);
      assert.ok(!/offline-nz|overview-nz/.test(blob), `${c.code}: no NZ-only screenshot`);
      if (c.code === 'au') assert.equal(c.screen.src, '/rondva/screens/observation-nz.webp');
      else assert.equal(c.screen, undefined, `${c.code}: no phone figure`);
      assert.ok(!/NZ|New Zealand|NZS|WME/.test(blob), `${c.code}: no NZ wording`);
    }
    assert.ok(/Minor, Serious or Very serious/.test(byCode.au.screen.alt), 'AU screenshot alt names the severity words');

    // h. hreflang: einn smiður, sjö færslur, notaður á forsíðu og landasíðum en ekki í sameiginlegu útliti eða /support.
    {
      const langs = plain(cm.rondvaLanguages());
      assert.deepEqual(langs, {
        'en-NZ': 'https://rondva.com/nz', 'en-AU': 'https://rondva.com/au', 'en-GB': 'https://rondva.com/uk', 'en-IE': 'https://rondva.com/ie',
        'en-US': 'https://rondva.com/us', 'en-CA': 'https://rondva.com/ca', 'x-default': 'https://rondva.com',
      });
      assert.equal(Object.keys(langs).length, 7);
      for (const c of COUNTRIES) {
        const md = plain(cm.countryMetadata(c));
        assert.deepEqual(md.alternates.languages, langs, `${c.code} hreflang`);
        assert.equal(md.alternates.canonical, `https://rondva.com${c.path}`, `${c.code} keeps its own canonical`);
        assert.equal(md.openGraph.locale, { au: 'en_AU', uk: 'en_GB', ie: 'en_IE', us: 'en_US', ca: 'en_CA' }[c.code], `${c.code} og:locale`);
        assert.equal(md.openGraph.url, `https://rondva.com${c.path}`);
        assert.equal(md.title.absolute, c.title);
      }
      assert.match(landing, /alternates: \{ canonical: BRANDS\.rondva\.marketingUrl, languages: rondvaLanguages\(\) \}/, 'home page has hreflang');
      assert.match(nz, /alternates: \{ canonical: PAGE_URL, languages: rondvaLanguages\(\) \}/, '/nz has hreflang and its own canonical');
      assert.match(nz, /locale: "en_NZ"/);
      for (const [name, src] of [['layout', layout], ['support', support], ['terms', terms], ['privacy', read('src/app/(rondva)/rondva/privacy/page.tsx')], ['cookies', read('src/app/(rondva)/rondva/cookies/page.tsx')]]) {
        assert.ok(!/rondvaLanguages|en-AU|en-GB/.test(src), `${name} must not get the country hreflang set`);
      }
    }

    // i. sitemap, llms.txt og fótur.
    for (const cc of ['au', 'uk', 'ie', 'us', 'ca']) assert.ok(sitemap.includes(`https://rondva.com/${cc}</loc>`), `sitemap has /${cc}`);
    for (const c of COUNTRIES) {
      const line = llmsLines.find((l) => l.includes(`https://rondva.com${c.path})`));
      assert.ok(line && line.includes(`Solo ${cm.money(c, 'solo')} a month`) && line.includes(c.taxLine), `llms.txt line for ${c.code}`);
    }
    assert.ok(llms.includes('- Countries: New Zealand (NZS 4306:2005 pre-purchase reports), Australia, the United Kingdom, Ireland, the United States and Canada'), 'llms.txt Countries line');
    assert.ok(llmsLines.find((l) => l.includes('/au)')).includes('not set out in the AS 4349.1 format yet'), 'llms.txt AU line is honest');
    const footer = read('src/components/rondva/RondvaFooter.tsx');
    assert.match(footer, /aria-label="Rondva by country"/);
    assert.match(footer, /COUNTRY_LINKS\.map/);
    assert.deepEqual(plain(cm.COUNTRY_LINKS).map((c) => c.name), ['New Zealand', 'Australia', 'United Kingdom', 'Ireland', 'United States', 'Canada']);

    // j. Sýnisskýrslur: rofi á hvert land; true ⇒ skráin í public/rondva/ er til, false ⇒ hún má ekki vera til.
    {
      assert.equal(links.SAMPLE_REPORT_URL, '/sample-nzs4306.pdf');
      // 2026-10-24: NZ (NZS 4306) og AU (almennt enskt snið) eru raunveruleg drög úr generate-report á
      // prófunarfyrirtækinu; UK/IE (einkunnir 1–3) bíða.
      assert.equal(links.HAS_SAMPLE, true);
      const S = plain(cm.SAMPLE_REPORTS);
      assert.deepEqual(Object.fromEntries(Object.entries(S).filter(([, v]) => v).map(([k, v]) => [k, v.enabled])), { nz: true, au: true, uk: false, ie: false });
      assert.deepEqual(Object.fromEntries(Object.entries(S).map(([k, v]) => [k, v && v.url])), {
        nz: '/sample-nzs4306.pdf', au: '/sample-report-au.pdf', uk: '/sample-condition-ratings.pdf', ie: '/sample-condition-ratings.pdf', us: null, ca: null,
      });
      assert.equal(S.nz.enabled, links.HAS_SAMPLE, 'NZ sample flag is HAS_SAMPLE');
      for (const [cc, s] of Object.entries(S)) {
        if (!s) continue;
        const file = path.join(root, 'public/rondva', s.url);
        assert.equal(typeof s.enabled, 'boolean');
        if (s.enabled) {
          assert.ok(fs.existsSync(file), `${cc}: sample flag is true so ${s.url} must exist in public/rondva/`);
          // Viðhengi í sölupósti: PDF undir 3 MB, og lýsigögnin segja að eignin sé skálduð.
          const pdf = fs.readFileSync(file);
          assert.equal(pdf.subarray(0, 5).toString(), '%PDF-', `${cc}: ${s.url} is a PDF`);
          assert.ok(pdf.length < 3 * 1024 * 1024, `${cc}: ${s.url} is under 3 MB`);
          assert.ok(pdf.includes('fictional property'), `${cc}: ${s.url} metadata says the property is fictional`);
        }
        else assert.ok(!fs.existsSync(file), `${cc}: sample flag is false so ${s.url} must not exist yet`);
      }
      assert.match(compSrc, /c\.sample\?\.enabled \?/);
      assert.match(compSrc, /See a sample report \(PDF\)/);
    }
    pass('country pages /au /uk /ie /us /ca: exact local prices and tax lines, one JSON-LD per page with FAQ = visible answers, no banned claims or body names, AU "not … AS 4349.1", UK/IE condition ratings 1-2-3 and no RICS, US/CA ten systems in order, hreflang (7 entries) on home + country pages only, sitemap, llms.txt, footer links, sample flags');
  }

  console.log(`${n} Rondva pricing checks passed; no network calls made.`);
})().catch((e) => { console.error(e); process.exit(1); });
