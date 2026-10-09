/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS verify script, same as the other scripts/verify-*.cjs */
// Verð Rondva (src/lib/rondva-pricing.ts) og textinn á rondva.com eftir útgáfudags-PR: Solo US$49.99/8,
// Pro US$99.99/30 (mælt með), Report pack US$29.99/10 sem renna ekki út, stofnmannatilboð 20 ókeypis
// skýrslur á mánuði til 31. janúar 2027, ein tilboðslína (RONDVA_OFFER_LINE) og ein prufa
// (RONDVA_TRIAL). Athugar líka að síðurnar noti tölurnar úr einni heimild, að appið sé kynnt sem
// „on the App Store“ (engin biðlista- eða þróunarorð), að /nz, llms.txt, robots.txt, sitemap og JSON-LD
// séu rétt, og að textinn haldi áfram að segja satt (ekkert er selt á vefnum).
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
const RONDVA_OFFER = plain(pricing.RONDVA_OFFER);
const RONDVA_TRIAL = plain(pricing.RONDVA_TRIAL);
const RONDVA_PRICE_NOTE = pricing.RONDVA_PRICE_NOTE;
const RONDVA_OFFER_LINE = pricing.RONDVA_OFFER_LINE;

let n = 0;
const pass = (name) => { n++; console.log(`PASS ${name}`); };

// 1. Tölurnar sem eigandinn samþykkti (2026-10-07) og „US$“-merkingin [pricing-4].
assert.deepEqual(
  RONDVA_PLANS.map((p) => [p.id, p.name, p.price, p.reports]),
  [['solo', 'Solo', '49.99', 8], ['pro', 'Pro', '99.99', 30]],
);
assert.equal(RONDVA_PACK.name, 'Report pack');
assert.equal(RONDVA_PACK.price, '29.99');
assert.equal(RONDVA_PACK.reports, 10);
assert.equal(usd('49.99'), 'US$49.99');
assert.equal(usd('99.99'), 'US$99.99');
pass('Solo US$49.99 / 8, Pro US$99.99 / 30, Report pack US$29.99 / 10; usd() prints "US$"');

// 2. Pro er eina áætlunin sem er merkt „mælt með“, og Pro-textinn er um einn skoðunarmann [trust-3].
assert.deepEqual(RONDVA_PLANS.filter((p) => p.recommended).map((p) => p.id), ['pro']);
assert.equal(RONDVA_PLANS.find((p) => p.id === 'pro').blurb, 'For a busy inspector — 30 AI reports a month.');
assert.ok(!/team|practice/i.test(RONDVA_PLANS.map((p) => p.blurb).join(' ')), 'no team seats are sold');
pass('Pro is the only recommended plan; Pro blurb: "For a busy inspector — 30 AI reports a month."');

// 3. Innifalið í öllum áætlunum.
assert.deepEqual(RONDVA_INCLUDED, [
  '2 AI revisions included with every report',
  'Unlimited manual editing and re-exports',
  'Your company branding on every report',
]);
pass('every plan includes 2 AI revisions, unlimited editing and re-exports, company branding');

// 4. Tilboðið: stofnmannatilboð 20/mán til 31.1.2027 (lifandi), prufa 20/30 daga (fasti tilbúinn),
//    ein tilboðslína, og athugasemdin um verð í mynt kaupandans.
assert.equal(RONDVA_OFFER.freeReportsPerMonth, 20);
assert.equal(RONDVA_OFFER.endsOn, '31 January 2027');
assert.deepEqual(RONDVA_TRIAL, { freeReports: 20, days: 30 });
assert.equal(RONDVA_OFFER_LINE, 'Your first reports are free. No card.');
for (const text of [RONDVA_OFFER.endsOn, RONDVA_OFFER_LINE, RONDVA_PRICE_NOTE, RONDVA_PACK.blurb, ...RONDVA_PLANS.map((p) => p.blurb), ...RONDVA_INCLUDED]) {
  assert.ok(!/iceland|icelandic/i.test(text), `no mention of Iceland in: ${text}`);
}
assert.equal(
  RONDVA_PRICE_NOTE,
  'Charged by Apple in your currency incl. GST/VAT. Solo is NZ$99.99 in New Zealand, A$79.99 in Australia and EUR 59.99 in Ireland.',
);
assert.match(read('src/lib/rondva-pricing.ts'), /First 30 days free, up to 20 reports\. No card\. Nothing renews on its own\.[\s\S]{0,300}export const RONDVA_OFFER_LINE/, 'the swap-in wording is documented above RONDVA_OFFER_LINE');
pass('founding offer 20/month to 31 January 2027; trial {20 reports, 30 days}; one offer line; GST/VAT price note is exact');

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
  for (const price of ['49.99', '99.99', '29.99']) {
    assert.ok(!code.includes(price), `${name} must read ${price} from rondva-pricing.ts, not hardcode it`);
  }
}
for (const [name, src] of [['landing', landing], ['support', support]]) assert.match(stripComments(src), /RONDVA_OFFER/, `${name} shows the founding offer`);
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
for (const [name, src] of [['landing', landing], ['empty state', emptyState], ['nz', nz]]) {
  assert.ok(!/Your first reports are free|First 30 days free/.test(stripComments(src)), `${name} must not hardcode the offer line`);
}
pass('landing, support and /nz read prices and the offer line from one module and show offer, plans, pack and the price note');

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
const stale = [/39\.99/, /complimentary/i, /first 2 AI-drafted/i, /2 AI-drafted reports (are )?free/i, /first 2 .*free/i, /20 AI-drafted reports per month/, /Planned pricing/, /Nothing is for sale yet/];
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
for (const s of ['Hjalti Sigmundsson', 'hjalti@rondva.com', 'Built in Reykjavík with a pre-purchase inspection firm that writes every one of its reports in', 'from about 3 hours 40 minutes to about 30 minutes', 'Your data is stored in the EU (Ireland)', 'Every report says it was AI-drafted and reviewed by you.', 'Billed by Apple in your currency. Cancel any time in Settings, no contract.']) {
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
assert.ok(nzPlain.includes('<strong>Solo {soloPrice}/month:</strong> {soloReports} AI reports, about {soloPerReport} a report. You charge NZ$500+ for one.'));
const nzPricing = load('src/lib/rondva-pricing.ts');
assert.equal(nzPricing.RONDVA_NZ_SOLO.price, '99.99');
assert.equal(nzPricing.nzSoloPerReport(), '12.50');
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
assert.deepEqual(app.offers.map((o) => [o.name, o.price, o.priceCurrency]), [['Free trial', '0', 'USD'], ['Rondva Solo', '49.99', 'USD'], ['Rondva Pro', '99.99', 'USD'], ['Rondva Report pack', '29.99', 'USD']]);
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
  for (const s of ['# Rondva', 'iPhone app', 'NZS 4306:2005', 'Vitvélar ehf.', 'https://apps.apple.com/app/id6817769506', 'Your first reports are free. No card.', 'US$49.99', 'US$99.99', 'US$29.99', 'NZ$99.99', 'https://rondva.com/nz', 'https://rondva.com/support', 'https://rondva.com/privacy', 'https://rondva.com/terms', 'EU (Ireland)']) assert.ok(llms.includes(s), `llms.txt has ${s}`);
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
  assert.match(dash, /locale === "en" && \(await getRequestBrand\(\)\) === "rondva"/);
  assert.match(dash, /\{t\.emptyTitle\}/);
  assert.match(dash, /\{t\.emptyBody\}/);
  for (const s of ['Get Rondva on your iPhone', 'Sign in with the same account you used here.', 'Add your logo and report terms', 'href="/dashboard/settings"', 'Start your first inspection']) assert.ok(emptyState.includes(s), `empty state: ${s}`);
  assert.match(emptyState, /<AppStoreBadge \/>/);
  assert.match(emptyState, /<AppStoreQr tone="light" \/>/);
  pass('dashboard empty state: three steps for Rondva (English); Beton keeps its Icelandic empty text');

  console.log(`${n} Rondva pricing checks passed; no network calls made.`);
})().catch((e) => { console.error(e); process.exit(1); });
