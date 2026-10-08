/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS verify script, same as the other scripts/verify-*.cjs */
// rondva.com/privacy (OPS-14): textinn nefnir veðurþjónusturnar (MET Norway; staðsetning úr eigin GeoNames-töflu, ekki OpenStreetMap Nominatim og
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
    .replace(/&rarr;/g, '→')
    .replace(/&mdash;/g, '—')
    .replace(/&amp;/g, '&')
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
  'GeoNames', 'our own database, in the European Union', 'MET Norway', 'Norwegian Meteorological Institute',
  'only the town or', 'postcode', "company's country", 'The street address is not used for this and', 'is not sent anywhere',
  'coordinates, rounded to about 100 metres',
  'on the day of the inspection', 'weather field is still empty', 'type the weather yourself',
  'Nothing else is sent', 'not the street address, not your name, email address or account details', "not the client's name", 'no notes or photos',
  "MET Norway sees our server's IP address and not your phone's", "does not use your phone's location",
  'The coordinates are not saved with the inspection', 'not written to our logs', 'no personal data',
  'This work includes data from GeoNames', 'Creative Commons Attribution 4.0', 'Weather data from MET Norway', 'CC BY 4.0',
]) assert.ok(weather.includes(s), `weather section says: ${s}`);
for (const s of ['Nominatim', 'OpenStreetMap', 'Open Database License', 'working memory']) assert.ok(!weather.includes(s), `weather section no longer mentions: ${s}`);
assert.ok(!/Nominatim|OpenStreetMap/i.test(text(code.replace(/\/\/[^\n]*/g, ''))), 'no OpenStreetMap/Nominatim anywhere on /privacy (comments excluded)');
assert.match(code, /https:\/\/www\.geonames\.org/);
assert.match(code, /https:\/\/creativecommons\.org\/licenses\/by\/4\.0\//);
assert.match(code, /https:\/\/api\.met\.no\/doc\/License/);
assert.ok(!/fastanumer|fastanúmer/i.test(weather), 'no Icelandic property-ID wording in the weather section');
pass('weather auto-fill: place found in our own EU table (GeoNames), only rounded coordinates to MET Norway, street address sent nowhere, GeoNames + MET CC BY 4.0 attribution with links, no OSM/Nominatim');

// 3. Vinnsluaðilatafla: báðar þjónusturnar, Apple-línan og undanþágan frá vinnslusamningi.
const processors = section('processors');
const table = code.slice(code.indexOf('const processors'), code.indexOf('function ProcessorTable'));
for (const s of ['name: "MET Norway (Norwegian Meteorological Institute)"', 'Receives only coordinates rounded to about 100 metres.']) {
  assert.ok(table.includes(s), `processor table: ${s}`);
}
assert.ok(!/OpenStreetMap|Nominatim|GeoNames/.test(table), 'processor table: OSMF removed, GeoNames is a data source not a recipient');
assert.ok(text(table).includes('Apple also takes App Store payments and sends us signed records of in-app purchases'), 'Apple row covers purchases');
assert.ok(processors.includes('MET Norway for the weather auto-fill, which is a public service that acts under its own terms of use'), 'no DPA claimed for the public services');
pass('processor table lists MET Norway (no OpenStreetMap Foundation) and Apple purchase records; text does not claim a DPA for the public services');

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
assert.match(code, /revised="8 October 2026"/);
// Prufumánuðurinn (trial_claims): hvað, hvers vegna, lagagrunnur, varðveisla og að það lifi eyðingu.
for (const [id, needles] of [
  ['account', ['Free first month.', 'fingerprint (a keyed, salted SHA-256 hash)', 'stable account identifier from your Apple or Google sign-in', 'email address',
               "isn't stored in readable form", 'pseudonymised personal data, not anonymous data',
               'kept for 24 months, also after the account is deleted', 'preventing abuse of the free month', 'art. 6(1)(f)']],
  ['deletion', ['fingerprints used for the free first month', "doesn't give a new free month", 'deleted 24 months after the free month was given']],
  ['retention', ['Free-month fingerprints', 'pseudonymised hashes', '24 months from when the free month was given', 'deleted automatically', 'Weather lookups']],
  ['legal-bases', ['free-month fingerprints']],
]) {
  const sec = section(id);
  for (const s of needles) assert.ok(sec.includes(s), `privacy #${id} says: ${s}`);
}
// Ekki ofsögð óafturkræfni: við höfum saltið og getum staðfest ágiskað netfang (dulnefni, ekki nafnleysi).
for (const id of ['account', 'deletion', 'retention']) {
  assert.ok(!/can't be turned back|one-way fingerprint|one-way hashes/i.test(section(id)), `#${id}: fingerprints not described as irreversible`);
}
assert.ok(!/Looked-up locations for the weather/.test(plain), 'stale weather retention bullet removed');
pass('free first month: pseudonymised salted fingerprint of the sign-in identifier and email, purpose, art. 6(1)(f), kept 24 months also after deletion');
for (const s of ['Anthropic', 'Supabase', 'Vercel', 'Expo (650 Industries)', 'Resend', 'Google Analytics and Meta']) assert.ok(plain.includes(s), `${s} still listed`);
pass('revision date updated; existing providers still listed');

// 7. Lagagrunnar: hver tilgangur með grein GDPR; vinnsluaðili fyrir skoðanir; samþykki fyrir vefkökur.
const bases = section('legal-bases');
for (const s of [
  'art. 6(1)(b)', 'art. 6(1)(c)', 'art. 6(1)(f)', 'art. 6(1)(a)',
  'we act for your inspection company as its processor', 'explicit confirmation in the app each time',
  'Analytics and marketing cookies on rondva.com', 'your consent',
]) assert.ok(bases.includes(s), `legal-bases section says: ${s}`);
pass('legal bases listed per purpose (contract, accounting duty, legitimate interest, consent), processor role for inspections');

// 8. Eyðing reiknings í appinu: leiðin, hvað er eytt, hvað helst, Apple-afturköllun, áskrift segist ekki upp.
const deletion = section('deletion');
for (const s of [
  'Settings → Delete account', 'ask Apple to revoke', 'inspections with their rooms, observations, photos and reports',
  'only member of your company', 'Apple purchase records, as accounting records, no longer linked',
  'usage record for each AI draft', 'no inspection content', 'Encrypted backups', 'Anthropic',
  'managed by a partner company', 'does not cancel an App Store subscription',
]) assert.ok(deletion.includes(s), `deletion section says: ${s}`);
assert.ok(section('retention').includes('even if the account is deleted'), 'retention: purchase records survive deletion');
assert.ok(section('purchases').includes('Deleting your account does not cancel an App Store subscription'), 'purchases: deletion does not cancel the subscription');
pass('account deletion in the app: path, what is deleted, what stays, Apple revoke, subscription not cancelled');

// 9. Flutningur milli landa (EES, SCC, NZ Privacy Act 2020) og börn.
const transfers = section('transfers');
for (const s of ['European Union (Ireland)', 'Standard Contractual Clauses', 'MET Norway is a public service we have no contract with', 'If you are in New Zealand', 'Privacy Act 2020']) {
  assert.ok(transfers.includes(s), `transfers section says: ${s}`);
}
const rights = section('rights');
for (const s of ['If you are in New Zealand', 'principles 6 and 7', 'Office of the Privacy Commissioner', 'Persónuvernd']) {
  assert.ok(rights.includes(s), `rights section says: ${s}`);
}
const children = section('children');
for (const s of ['not intended for anyone under 18', "don't knowingly collect personal data from children"]) assert.ok(children.includes(s), `children section says: ${s}`);
pass('international transfers (EEA/SCC, public weather service, NZ), NZ access/correction + Privacy Commissioner, children');

// 10. Samræmi við appið: engin staðsetningarheimild, ekkert Google Drive fyrir Rondva-viðskiptavini,
//     tölvupóstur til aðstoðar og tengiliðurinn.
assert.ok(section('inspections').includes("does not use your device's location, contacts or microphone"), 'no device location/contacts/microphone');
assert.ok(!/drive archive|connected its own google drive/i.test(plain), 'Rondva sends nothing to Google Drive; the page must not claim a Drive archive');
assert.ok(section('dashboard').includes('Rondva does not send your reports to Google Drive or any other storage service'), 'dashboard: no Drive');
assert.ok(section('contacting-us').includes('rondva@rondva.com') || /mail\}/.test(code), 'contact path for emails');
assert.match(read('src/lib/brand.ts'), /contactEmail: "rondva@rondva\.com"/);
assert.ok(plain.includes('Google also hosts our email'), 'Google Workspace email named as a processor');
assert.ok(!/Operated from the United Kingdom/.test(plain), 'no unverified server-location claim');
pass('matches the app: no device location, no Google Drive for Rondva, email contact, Google email hosting named, no server-location claim');

console.log(`${n} Rondva privacy checks passed; no network calls made.`);
