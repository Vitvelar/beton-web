/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS verify script, same as the other scripts/verify-*.cjs */
// rondva.com/terms og /support fyrir Rondva-appið 1.3.0 í App Review: Terms of Use (EULA)-tengill
// appsins (BRAND.termsUrl = rondva.com/terms) lendir á síðu sem vísar á Standard EULA Apple og
// nær yfir áskrift (sjálfvirk endurnýjun, afpöntun hjá Apple, tilboð fyrst, endurgreiðsla),
// ábyrgð skoðunarmanns á gervigreindardrögum; /support hefur tölvupóst (ekkert eyðublað),
// spurt og svarað um kaup (Restore purchases, Manage subscription, eyða reikningi) og öll akkeri
// sem appið og síðurnar vísa á eru til. Lýsir því sem beton-app origin/main gerir
// (docs/release/IN_APP_PURCHASES.md, ACCOUNT_DELETION.md; app/billing.tsx, lib/brand.ts).
// Keyrt með `node scripts/verify-rondva-support-terms.cjs` — engin bygging, engin netköll.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const text = (src) =>
  stripComments(src)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{" "\}/g, ' ')
    .replace(/&apos;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&copy;/g, '©')
    .replace(/&rarr;/g, '→')
    .replace(/&mdash;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');

const FILES = {
  privacy: 'src/app/(rondva)/rondva/privacy/page.tsx',
  terms: 'src/app/(rondva)/rondva/terms/page.tsx',
  support: 'src/app/(rondva)/rondva/support/page.tsx',
};
const sources = Object.fromEntries(Object.entries(FILES).map(([k, rel]) => [k, read(rel)]));
const codes = Object.fromEntries(Object.entries(sources).map(([k, src]) => [k, stripComments(src)]));
const plains = Object.fromEntries(Object.entries(sources).map(([k, src]) => [k, text(src)]));
const idsOf = (code) => [...code.matchAll(/^\s{4}id: "([a-z-]+)",$/gm)].map((m) => m[1]);
const section = (page, id) => {
  const code = codes[page];
  const start = code.indexOf(`id: "${id}",`);
  assert.ok(start > -1, `${page}: section ${id} exists`);
  const next = code.indexOf('\n  {\n    id: "', start + 1);
  return text(code.slice(start, next === -1 ? undefined : next));
};

let n = 0;
const pass = (name) => { n++; console.log(`PASS ${name}`); };

// 1. Allir innri tenglar á /privacy#x, /support#x og /terms#x vísa á akkeri sem eru til, og
//    akkerin sem appið notar (beton-app: DeleteAccountSection → /support#delete-account) haldast.
const ids = { privacy: idsOf(codes.privacy), terms: idsOf(codes.terms), support: idsOf(codes.support) };
for (const [page, list] of Object.entries(ids)) assert.equal(new Set(list).size, list.length, `${page}: anchors are unique`);
for (const [page, code] of Object.entries(codes)) {
  for (const m of code.matchAll(/href="\/(privacy|terms|support)#([a-z-]+)"/g)) {
    assert.ok(ids[m[1]].includes(m[2]), `${page} links to /${m[1]}#${m[2]} which does not exist`);
  }
}
assert.ok(ids.support.includes('delete-account'), 'app opens /support#delete-account');
assert.ok(ids.privacy.includes('processors') && ids.privacy.includes('deletion'));
pass('every /privacy#, /terms# and /support# link resolves to an existing section; /support#delete-account (used by the app) kept');

// 2. „Terms of Use (EULA)“ í appinu opnar /terms: síðan vísar á Standard EULA Apple og segir hvað gildir hvar.
const about = section('terms', 'about');
const licence = section('terms', 'app-licence');
assert.match(codes.terms, /const APPLE_EULA = "https:\/\/www\.apple\.com\/legal\/internet-services\/itunes\/dev\/stdeula\/"/);
assert.match(codes.terms, /<LegalLink href=\{APPLE_EULA\}>Standard Licensed Application End User License Agreement<\/LegalLink>/);
for (const s of ['Terms of Use that the Rondva app links to', "licence for the app itself is Apple's standard terms"]) assert.ok(about.includes(s), `terms/about: ${s}`);
for (const s of ['Terms of Use (EULA)" link in the app opens this page', "Apple's terms win", 'Apple is not a party to these terms']) assert.ok(licence.includes(s), `terms/app-licence: ${s}`);
assert.match(codes.terms, /alternates: \{ canonical: `\$\{BRANDS\.rondva\.marketingUrl\}\/terms` \}/);
pass('/terms is the target of the in-app "Terms of Use (EULA)" link and points to (and defers to) Apple\'s standard EULA for the app licence');

// 3. Áskrift: Apple-gjald, sjálfvirk endurnýjun, afpöntun, röð notkunar, uppfærsla, endurgreiðsla, restore.
const pricing = section('terms', 'pricing');
for (const s of [
  'When paid plans are offered in the app', 'through the App Store', 'charged to your Apple ID account at confirmation of the purchase',
  'Subscriptions renew automatically every month at the price shown, unless you cancel at least 24 hours before the end of the current period',
  'within 24 hours before the period ends', 'Apple account settings', 'Manage subscription', 'Cancelling stops the next renewal',
  'Deleting your Rondva account does not cancel a subscription', 'do not carry over', "don't expire",
  'free reports from your first month first, then the reports of your subscription period, then report packs',
  'Pro starts straight away', 'unused Solo reports end', 'Restore purchases', 'Refunds are handled by Apple',
  'we take back the unused reports', 'First month free.', 'AI-drafted reports free for', 'first AI-drafted report (not from sign-up)',
  'whichever runs out first', 'nothing is charged afterwards', 'once per company and once per person',
  'same Apple or Google sign-in or email address', 'does not get another free month',
]) assert.ok(pricing.includes(s), `terms/pricing says: ${s}`);
assert.ok(section('terms', 'ending').includes('does not cancel an App Store subscription'), 'terms/ending: deletion does not cancel the subscription');
assert.ok(!/iceland|icelandic/i.test(pricing), 'terms pricing section does not mention Iceland');
assert.ok(!/founding offer|every month, with no|31 January 2027/i.test(pricing), 'terms: the founding offer (20 a month until 31 January 2027) is gone');
pass('terms: App Store purchase, Apple ID charge, auto-renewal and 24 h cancellation, manage in Apple settings, credit order, Solo→Pro, restore, refund, free first month (once per company/person)');

// 4. Gervigreindardrög: skoðunarmaður yfirfer og ber ábyrgð; veðurtexti er spá.
const reports = section('terms', 'reports');
for (const s of [
  'You review, correct and approve every report before you issue it', 'The findings, severities and conclusions are yours',
  'not a certified engineering conclusion', 'You are responsible towards your own clients', 'can misread a photo',
  'comes from a forecast for the address, not from a measurement', 'You can always create a report without AI',
]) assert.ok(reports.includes(s), `terms/reports says: ${s}`);
const processing = section('terms', 'data-processing');
assert.ok(processing.includes('public weather service used for the weather auto-fill'), 'terms/data-processing names the weather service');
pass('terms: AI drafts must be reviewed, inspector stays responsible, weather text is a forecast, weather service named among sub-processors');

// 5. /support: tölvupóstur, enginn eyðublað eða netkall.
const R = read('src/lib/brand.ts');
assert.match(R, /contactEmail: "rondva@rondva\.com"/);
assert.match(codes.support, /const mail = `mailto:\$\{R\.contactEmail\}`/);
assert.ok(codes.support.includes('href={mail}'), 'support links to the mailto');
for (const re of [/<form\b/i, /<input\b/i, /<textarea\b/i, /\bfetch\(/, /"use client"/, /'use client'/, /\baction=/, /onSubmit/, /Resend/i, /from "@\/app\/actions/]) {
  assert.ok(!re.test(codes.support), `support page must not contain ${re}`);
}
assert.ok(plains.support.includes('there is no form to fill in, just an email'), 'support says it is just an email');
pass('/support: working mailto contact (rondva@rondva.com), no form, input, fetch, client component or server action');

// 6. /support: spurt og svarað um kaup og eyðingu reiknings með heitum hnappa í appinu.
const subs = section('support', 'subscriptions');
for (const s of [
  'Settings → Plan & billing → Restore purchases', 'Settings → Plan & billing → Manage subscription', 'Subscriptions',
  'at least 24 hours before the period ends', 'reportaproblem.apple.com', 'order number from Apple', 'Never send card details or your Apple ID password',
]) assert.ok(subs.includes(s), `support/subscriptions says: ${s}`);
const del = section('support', 'delete-account');
for (const s of [
  'Settings → Delete account', 'bottom of the screen you see after signing in', 'asks you to confirm twice', 'ask Apple to revoke',
  'Deleting your account does not cancel it', 'managed by a partner company', 'purchase records that we are required to keep',
  'from the email address you sign in with', 'What stays:', 'Apple purchase records', 'usage record for each AI draft',
]) assert.ok(del.includes(s), `support/delete-account says: ${s}`);
assert.ok(codes.support.includes('<LegalLink href="/privacy#deletion">'), 'support links to /privacy#deletion');
const pricingSupport = section('support', 'pricing');
assert.ok(pricingSupport.includes('Settings → Plan & billing'), 'support/pricing: where plans are bought');
assert.ok(!/once it is\s+available|Until paid plans are\s+available/i.test(plains.support), 'support no longer says plans are not yet available');
const weatherSupport = section('support', 'weather');
for (const s of ['forecast, not a measurement', "never asks for your phone's location", 'MET Norway', 'GeoNames (CC BY 4.0)', 'geonames.org', 'street address is not sent anywhere']) assert.ok(weatherSupport.includes(s), `support/weather says: ${s}`);
assert.ok(!/OpenStreetMap|Nominatim/i.test(codes.support + codes.terms), 'support/terms no longer mention OpenStreetMap/Nominatim');
assert.ok(!codes.terms.includes('two\n            public services'), 'terms: single public weather service');
pass('/support: restore purchases, manage/cancel (app and iPhone), refunds, charged-but-no-reports, in-app deletion + email fallback, what stays, weather FAQ');

// 7. Heildarsamræmi: dagsetning, ekkert „coming soon“ um kaup í /support, hvergi „no automated account deletion“.
for (const page of ['terms', 'support', 'privacy']) assert.match(codes[page], /revised="8 October 2026"/, `${page}: revision date`);
for (const page of ['terms', 'support', 'privacy']) {
  assert.ok(!/no automated account deletion|can only be deleted by (emailing|writing)/i.test(plains[page]), `${page}: no stale "email only" deletion claim`);
}
pass('revision dates set; no stale "email-only deletion" wording left');

console.log(`${n} Rondva support/terms checks passed; no network calls made.`);
