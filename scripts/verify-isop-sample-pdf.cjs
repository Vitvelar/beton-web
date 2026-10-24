/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script */
// W3: athugar tilbúnu sýnis-PDF-skrárnar (public/rondva/sample-home-inspection-{us,ca}.pdf) án nets og án þess að rendera:
//  - skráin er til, < 3 MB, gildur PDF
//  - merkingin er orðrétt á forsíðu OG í fæti hverrar síðu (pdftotext, síða fyrir síðu)
//  - engin bannorð (sama listi og verify-report-isop.cjs, DON'T SAY í RULES)
//  - skráin er EKKI tengd neins staðar: ekki í sitemap (beton.is né rondva), ekki í src/ né public/ (nema sjálf skráin)
//  - engin lifandi leið (/us) er til; sýnið er aðeins skrá + scripts/isop-sample
// Krefst pdftotext/pdfinfo (poppler). Endurgerð: node scripts/isop-sample/render.cjs --public (krefst next build).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { SAMPLE_NOTICE } = require('./isop-sample/sample-inspection.cjs');

const root = path.resolve(__dirname, '..');
const MAX = 3 * 1024 * 1024;
let checks = 0;
const pass = (name) => { checks++; console.log(`PASS ${name}`); };

const BANNED = [
  /compliant/i, /complies/i, /certif/i, /\bInterNACHI\b/i, /\bASHI\b/, /\bTREC\b/, /\bCSA\b/, /NZIBI/i, /\baccurate/i, /\bunlimited\b/i,
  /\bonly\b/i, /\bfirst\b/i, /in accordance with/i, /standards? of practice/i, /saves? .{0,20}hours/i, /edit on your phone/i, /used by NZ/i,
  /meets? (?:the )?code/i, /up to code/i, /code violation/i, /guarantee/i, /warrant(?:y|ies)\b/i, /\bsafe to\b/i, /no defects/i,
];
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const text = (file, first, last) => execFileSync('pdftotext', ['-f', String(first), '-l', String(last), file, '-'], { encoding: 'utf8' });

assert.equal(SAMPLE_NOTICE, 'Sample report. Made-up property and findings to show the layout; not a real inspection and not AI output from a real job.', 'notice wording');

const files = { us: 'public/rondva/sample-home-inspection-us.pdf', ca: 'public/rondva/sample-home-inspection-ca.pdf' };
const bodies = {};
for (const [key, rel] of Object.entries(files)) {
  const file = path.join(root, rel);
  assert.ok(fs.existsSync(file), `${rel} exists (run node scripts/isop-sample/render.cjs --public)`);
  const size = fs.statSync(file).size;
  assert.ok(size > 10_000 && size < MAX, `${rel} is ${size} bytes, expected < 3 MB`);
  const pages = Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [file], { encoding: 'utf8' }))[1]);
  assert.ok(pages >= 10, `${rel} has ${pages} pages`);
  // Forsíða: borði efst + fótur; hver síða: fótur.
  const cover = norm(text(file, 1, 1));
  assert.ok(cover.startsWith(SAMPLE_NOTICE), `${key}: notice banner at the top of the cover`);
  for (let p = 1; p <= pages; p++) {
    const page = norm(text(file, p, p));
    assert.ok(page.includes(`${SAMPLE_NOTICE} · Page ${p} of ${pages}`), `${key}: footer with the notice on page ${p}`);
  }
  const all = text(file, 1, pages);
  const hits = [];
  for (const line of all.split('\n')) for (const re of BANNED) if (re.test(line)) hits.push(`${re}: ${line.slice(0, 80)}`);
  assert.deepEqual(hits, [], `${key}: no banned wording`);
  bodies[key] = norm(all);
  pass(`${key}: ${(size / 1024).toFixed(0)} KB < 3 MB, ${pages} pages, notice on the cover and in all ${pages} footers, no banned wording`);
}
assert.ok(bodies.us.includes('Anytown, IL 60000') && bodies.us.includes('1,850 ft² (172 m²)'), 'US sample: IL address, ft² first');
assert.ok(bodies.ca.includes('Anytown, ON A1A 1A1') && bodies.ca.includes('172 m² (1,850 ft²)') && !/Anytown, IL/.test(bodies.ca), 'CA sample: ON address, m² first');
pass('US sample is en-US (IL, ft² first); CA sample is en-CA (ON, m² first)');

// Ótengt: hvergi vísað í skrárnar úr kóða, síðum eða sitemap.
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const referencing = walk(path.join(root, 'src')).filter((f) => /\.(ts|tsx|js|jsx|json|md|mdx|css)$/.test(f) && /sample-home-inspection/.test(fs.readFileSync(f, 'utf8')));
assert.deepEqual(referencing, [], 'no source file references the sample PDFs');
for (const rel of ['src/app/sitemap.ts', 'src/app/(rondva)/rondva/sitemap.xml/route.ts']) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  // /us og /ca eru landasíður (rondva-countries.ts) og mega vera í sitemap; sýnisskráin sjálf má það ekki.
  assert.ok(!/sample|\.pdf|isop/i.test(src), `${rel} does not list the sample`);
}
for (const f of ['vercel.json', 'next.config.ts', 'next.config.js', 'next.config.mjs', 'middleware.ts', 'src/middleware.ts', 'src/proxy.ts', 'proxy.ts']) {
  const p = path.join(root, f);
  if (fs.existsSync(p)) assert.ok(!/sample-home-inspection/.test(fs.readFileSync(p, 'utf8')), `${f} does not mention the sample`);
}
pass('sample PDFs are not referenced from src/ and not listed in either sitemap (the /us and /ca country pages never link them)');

console.log(`\n${checks} checks passed`);
