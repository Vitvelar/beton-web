/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS verify script, same as the other scripts/verify-*.cjs */
// rondva.com/privacy (OPS-14): textinn nefnir veðurþjónusturnar (OpenStreetMap Nominatim og
// MET Norway), Apple-kaup og skráningu fyrirtækis, heldur akkerum sem /terms og appið vísa á og
// segir ekkert sem kóðinn gerir ekki (t.d. engin gögn um notanda til veðurþjónustu).
// Keyrt með `node scripts/verify-rondva-privacy.cjs` — engin bygging, engin netköll.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
// Lesanlegur texti: JSX-málsgreinar og -tákn í einn streng með stökum bilum.
const text = (src) =>
  stripComments(src)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{" "\}/g, ' ')
    .replace(/&apos;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&copy;/g, '©')
    .replace(/\s+/g, ' ');

const PAGE = 'src/app/(rondva)/rondva/privacy/page.tsx';
const source = read(PAGE);
const code = stripComments(source);
const plain = text(source);
let n = 0;
const pass = (name) => { n++; console.log(`PASS ${name}`); };
const section = (id) => {
  const start = code.indexOf(`id: "${id}",`);
  assert.ok(start > -1, `section ${id} exists`);
  const next = code.indexOf('\n  {\n    id: "', start + 1);
  return text(code.slice(start, next === -1 ? undefined : next));
};

// 1. Akkerin sem /terms, /support og appið vísa á eru óbreytt; nýi kaflinn bætist við.
const ids = [...code.matchAll(/^\s{4}id: "([a-z-]+)",$/gm)].map((m) => m[1]);
for (const id of ['who', 'account', 'inspections', 'ai', 'dashboard', 'purchases', 'technical', 'waitlist', 'cookies', 'processors', 'retention', 'rights', 'changes']) {
  assert.ok(ids.includes(id), `anchor #${id} kept`);
}
assert.ok(ids.includes('weather'), 'new #weather section');
assert.equal(new Set(ids).size, ids.length, 'anchors are unique');
assert.match(read('src/app/(rondva)/rondva/terms/page.tsx'), /\/privacy#processors/);
pass('existing anchors kept (terms still links to /privacy#processors), #weather added, anchors unique');

// 2. Veðurútfylling: hvað er sent, hvert, hvað ekki, og tilvísanir leyfanna.
const weather = section('weather');
for (const s of [
  'Nominatim', 'OpenStreetMap Foundation', 'MET Norway', 'Norwegian Meteorological Institute',
  'address (street, town or suburb and city, postcode)', "company's country", 'coordinates, rounded to about 100 metres',
  'on the day of the inspection', 'weather field is still empty', 'type the weather yourself',
  'Nothing else is sent', 'not your name, email address or account details', "not the client's name", 'no notes or photos',
  "both services see our server's IP address and not your phone's", "does not use your phone's location",
  'The coordinates are not saved with the inspection', 'not stored in our database',
  '© OpenStreetMap contributors', 'CC BY 4.0',
]) assert.ok(weather.includes(s), `weather section says: ${s}`);
assert.match(code, /https:\/\/www\.openstreetmap\.org\/copyright/);
assert.match(code, /https:\/\/api\.met\.no\/doc\/License/);
assert.ok(!/fastanumer|fastanúmer/i.test(weather), 'no Icelandic property-ID wording in the weather section');
pass('weather auto-fill: address + country to Nominatim, rounded coordinates to MET Norway, nothing else, OSM and CC BY 4.0 attribution with links');

// 3. Vinnsluaðilatafla: báðar þjónusturnar, Apple-línan og undanþágan frá vinnslusamningi.
const processors = section('processors');
const table = code.slice(code.indexOf('const processors'), code.indexOf('function ProcessorTable'));
for (const s of ['name: "OpenStreetMap Foundation (Nominatim)"', 'name: "MET Norway (Norwegian Meteorological Institute)"', 'Receives only the address.', 'Receives only the coordinates.']) {
  assert.ok(table.includes(s), `processor table: ${s}`);
}
assert.ok(text(table).includes('Apple also takes App Store payments and sends us signed records of in-app purchases'), 'Apple row covers purchases');
assert.ok(processors.includes('OpenStreetMap Foundation and MET Norway for the weather auto-fill, which are public services that act under their own terms of use'), 'no DPA claimed for the public services');
pass('processor table lists OpenStreetMap Foundation + MET Norway and Apple purchase records; text does not claim a DPA for the public services');

// 4. Apple-kaup.
const purchases = section('purchases');
for (const s of [
  'Apple processes the payment under its own terms', 'we never see your card details or Apple ID',
  'digitally signed record', "checks Apple's signature", 'the product, the purchase and expiry dates, transaction identifiers',
  'whether the purchase renewed, expired or was refunded', 'random purchase identifier, not your account ID',
  'to the account that made the purchase and to its company', 'give the company its report credits',
  'accounting records for as long as accounting law requires (seven years in Iceland)', 'art. 6(1)(c)',
]) assert.ok(purchases.includes(s), `purchases section says: ${s}`);
assert.ok(section('retention').includes('Purchase records:'), 'retention still lists purchase records');
pass('in-app purchases: Apple processes payment, signed transaction records linked to account and company, credits, kept as accounting records');

// 5. Skráning fyrirtækis (nafn, land, valfrjáls vefsíða — aðgangur byggir aldrei á henni).
const account = section('account');
for (const s of [
  'we ask for the company name, the country and, if you want to give it, a website',
  'The website is optional', 'It never changes what you can access',
]) assert.ok(account.includes(s), `account section says: ${s}`);
pass('company registration: name, country and optional website described; website never affects access');

// 6. Dagsetning uppfærð og ekkert úr gamla orðalaginu horfið óvart.
assert.match(code, /revised="7 October 2026"/);
for (const s of ['Anthropic', 'Supabase', 'Vercel', 'Expo (650 Industries)', 'Resend', 'Google Analytics and Meta']) assert.ok(plain.includes(s), `${s} still listed`);
pass('revision date updated; existing providers still listed');

console.log(`${n} Rondva privacy checks passed; no network calls made.`);
