/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS verify script, same as the other scripts/verify-*.cjs */
// Greinin /guides/nzs-4306-pre-purchase-report og samanburðarsíðan /compare/inspectpro á rondva.com:
// engin DON'T-SAY-orð (only/first/compliant/certified/accurate/unlimited/"complies with"/NZIBI approved|endorsed/
// "saves X hours"/"edit on your phone"/"used by NZ inspectors"), engar NZ$-tölur nema Solo-verðið sem Apple sýnir
// (úr rondva-pricing.ts), Article + BreadcrumbList JSON-LD, sitemap-færslur, dagsetning, heimildir, orðafjöldi
// greinarinnar, og að Beton-lén birti ekki /rondva/* (proxy 404). Keyrt með `node scripts/verify-rondva-content.cjs`.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
let n = 0;
const pass = (m) => { n++; console.log(`PASS ${m}`); };

const D = 'src/app/(rondva)/rondva';
const pages = {
  guide: `${D}/guides/nzs-4306-pre-purchase-report/page.tsx`,
  compare: `${D}/compare/inspectpro/page.tsx`,
};
const FORBIDDEN = [
  /\bonly\b/i, /\bfirst\b/i, /\bcompliant\b/i, /\bcertified\b/i, /\bcomplies\b/i, /\baccurate\b/i, /\bunlimited\b/i,
  /NZIBI (approved|endorsed)/i, /saves? \d*\s*hours?/i, /edit on your phone/i, /used by NZ inspectors/i,
];
for (const [name, rel] of Object.entries(pages)) {
  const src = strip(read(rel)).replace(/className="[^"]*"/g, '');
  for (const re of FORBIDDEN) {
    // RONDVA_OFFER_LINE ("First month free") kemur úr rondva-pricing.ts og er leyft; hér er aðeins skoðaður texti síðunnar.
    assert.ok(!re.test(src), `${name}: forbidden wording ${re}`);
  }
  // NZ$-tölur: engar bókstaflegar; verð koma úr RONDVA_NZ_SOLO.
  assert.ok(!/NZ\$\s*\d/.test(src), `${name}: no literal NZ$ figures`);
  assert.ok(!/\$\s*\d/.test(src.replace(/NZD \$79/g, '')), `${name}: no other literal prices`);
  assert.ok(!/\b\d+\s*(hours|minutes)\b/i.test(src), `${name}: no time-saving figures`);
}
pass('both pages: no DON\'T-SAY words, no literal NZ$/time-saving figures');

const rondvaPricing = read('src/lib/rondva-pricing.ts');
assert.match(rondvaPricing, /RONDVA_NZ_SOLO = \{ price: "99\.99", currency: "NZ\$" \}/);
assert.match(strip(read(pages.compare)), /\{soloPrice\}/);
assert.match(strip(read(pages.compare)), /RONDVA_NZ_SOLO\.currency\}\$\{RONDVA_NZ_SOLO\.price/);
pass('compare page takes Rondva NZ$ price from RONDVA_NZ_SOLO (NZ$99.99, as Apple shows it)');

// Samanburður: dagsetning, heimildartenglar, InspectPro-verð merkt með heimild, engin gildisdómar.
const cmp = read(pages.compare);
assert.match(cmp, /const CHECKED = "20 October 2026"/);
assert.match(cmp, /Last checked/);
assert.match(cmp, /https:\/\/www\.inspectpro\.co\.nz\/pricing/);
assert.match(cmp, /NZD \$79 \+ GST per month/);
assert.ok(!/\b(better|best|worse|cheaper|superior|leading|worst|inferior)\b/i.test(strip(cmp)), 'no value judgements');
assert.match(cmp, /does not rate either product/);
pass('compare: dated "Last checked 20 October 2026", sourced InspectPro price, no value judgements');

// Grein: orðafjöldi, heimildir, JSON-LD, takmörkun, Rondva-málsgrein.
const guide = read(pages.guide);
const body = strip(guide.split('const sections')[1]).replace(/<\/?(strong|LegalLink)[^>]*>/g, ' ');
const text = [...body.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g)].map((m) => m[1]).join(' ').replace(/&apos;|&quot;/g, "'");
const words = text.split(/\s+/).filter((w) => /[A-Za-z]/.test(w)).length;
console.log(`guide word count ~${words}`);
assert.ok(words >= 900 && words <= 1300, `guide length ${words}`);
for (const url of [
  'https://www.standards.govt.nz/shop/nzs-43062005',
  'https://www.consumerprotection.govt.nz/help-product-service/buying-or-renting-a-house/building-reports-red-flags',
  'https://building.govt.nz/getting-started/your-rights-and-obligations/homeowner-rights-and-obligations/buying-a-house/is-a-pre-purchase-building-inspection-advisable',
  'https://www.settled.govt.nz/blog/can-i-trust-a-sellers-building-report',
]) assert.ok(guide.includes(url), `source ${url}`);
assert.match(guide, /"@type": "Article"/);
assert.match(guide, /breadcrumbLd\(/);
assert.match(guide, /not an engineering assessment/);
assert.match(guide, /NZS 4306:2005 order/);
pass(`guide: ${words} words, 4 official sources linked, Article + BreadcrumbList JSON-LD, limitations, one Rondva paragraph`);
assert.match(strip(read(pages.compare)), /breadcrumbLd\(/);
pass('compare: BreadcrumbList JSON-LD');

const sitemap = read(`${D}/sitemap.xml/route.ts`);
assert.match(sitemap, /path: "\/guides\/nzs-4306-pre-purchase-report"/);
assert.match(sitemap, /path: "\/compare\/inspectpro"/);
pass('sitemap lists both pages');

// Beton-lén: proxy skilar 404 fyrir /rondva/* á hýsil sem er ekki rondva (óbreytt hegðun, athugað hér líka fyrir nýju slóðirnar).
const proxy = read('src/proxy.ts');
assert.match(proxy, /hostConfig && hostConfig\.brand !== "rondva" && pathname\.startsWith\(RONDVA_ROUTE_PREFIX\)/);
assert.match(proxy, /new NextResponse\(null, \{ status: 404 \}\)/);
const brand = read('src/lib/brand.ts');
assert.match(brand, /RONDVA_ROUTE_PREFIX = "\/rondva"/);
assert.ok(pages.guide.includes('/rondva/') && pages.compare.includes('/rondva/'), 'pages live under /rondva/*');
pass('proxy 404s /rondva/* (so /rondva/guides/... and /rondva/compare/...) on Beton hosts; pages live under /rondva/*');

console.log(`\n${n} checks passed`);
