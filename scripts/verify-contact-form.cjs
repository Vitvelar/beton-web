// Samskiptaform beton.is (/samband og forsíða) og biðlisti rondva.com.
// 1) Óvalið „Samskipti" (react-hook-form skilar null) má ekki stöðva sendingu — það gerði
//    það frá 2026-05-20 án þess að nokkur villa birtist.
// 2) Resend kastar ekki villu heldur skilar { error }: formið má ekki segja „Takk" þá.
// Resend og Supabase eru gervuð — ekkert er sent. Keyrt: node scripts/verify-contact-form.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
function load(file, mocks) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const out = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const m = { exports: {} };
  const req = (id) => {
    if (Object.prototype.hasOwnProperty.call(mocks, id)) return mocks[id];
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}.ts`, mocks);
    return require(id);
  };
  new Function('module', 'exports', 'require', out)(m, m.exports, req);
  return m.exports;
}

// Gervi-Resend: skráir hvert kall og skilar því sem prófið stillir.
const sent = [];
let nextResult = { data: { id: 'test' }, error: null };
class Resend {
  constructor(key) { this.key = key; this.emails = { send: async (msg) => { sent.push(msg); return nextResult; } }; }
}
const mocks = { resend: { Resend } };

const post = (body) => new Request('http://localhost/api', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
async function quietly(fn) {
  const logged = [];
  const orig = console.error;
  console.error = (...a) => logged.push(a.map(String).join(' '));
  try { return { result: await fn(), logged }; } finally { console.error = orig; }
}

(async () => {
  const { contactSchema, contactSubmissionSchema } = load('src/lib/schemas.ts', mocks);
  const base = { nafn: 'Jón Jónsson', netfang: 'jon@example.com', simanumer: '', skilabod: 'Halló', website: '' };
  for (const schema of [contactSchema, contactSubmissionSchema]) {
    for (const samskipti of [null, undefined, 'hringja', 'tolvupostur']) {
      assert.equal(schema.safeParse({ ...base, samskipti }).success, true, `samskipti=${samskipti}`);
    }
    const bad = schema.safeParse({ ...base, samskipti: 'fax' });
    assert.equal(bad.success, false);
    assert.equal(bad.error.issues[0].message, 'Veldu hringja eða tölvupóst');
  }
  console.log('PASS unselected "Samskipti" (null/undefined) is valid; junk gets an Icelandic message');

  process.env.RESEND_API_KEY = 'test-key';
  delete process.env.CONTACT_EMAIL;
  const contact = load('src/app/api/contact/route.ts', mocks);

  sent.length = 0; nextResult = { data: { id: 'ok' }, error: null };
  let res = await contact.POST(post({ ...base, samskipti: null }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { success: true });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'beton@beton.is');
  assert.equal(sent[0].replyTo, 'jon@example.com');
  assert.ok(!sent[0].text.includes('Samskipti:') && sent[0].text.includes('Halló'));
  console.log('PASS form without "Samskipti" is emailed to beton@beton.is');

  sent.length = 0;
  res = await contact.POST(post({ ...base, samskipti: 'hringja' }));
  assert.equal(res.status, 200);
  assert.ok(sent[0].text.includes('Samskipti: Hringja'));
  console.log('PASS chosen "Samskipti" still appears in the email');

  sent.length = 0; nextResult = { data: null, error: { name: 'validation_error', message: 'domain not verified' } };
  const failed = await quietly(() => contact.POST(post({ ...base, samskipti: null })));
  assert.equal(failed.result.status, 502);
  const failedBody = await failed.result.json();
  assert.ok(!failedBody.success && failedBody.error.includes('beton@beton.is'), JSON.stringify(failedBody));
  assert.ok(failed.logged.some((l) => l.includes('Contact form email failed')));
  console.log('PASS Resend { error } → 502 with an Icelandic message and a log line (no false "Takk")');

  sent.length = 0; nextResult = { data: { id: 'ok' }, error: null };
  res = await contact.POST(post({ ...base, website: 'http://spam' }));
  assert.equal(res.status, 200);
  assert.equal(sent.length, 0);
  res = await contact.POST(post({ ...base, nafn: '' }));
  assert.equal(res.status, 400);
  assert.equal(sent.length, 0);
  console.log('PASS honeypot is silently dropped; invalid input → 400; neither sends');

  // Biðlisti: skráning tekst þótt tilkynningarpóstur bregðist, en bilunin er loggð.
  process.env.RESEND_FROM = 'Rondva <noreply@example.com>';
  let inserted = null;
  const waitlistMocks = {
    ...mocks,
    '@/lib/supabase/service': { createServiceClient: () => ({ from: () => ({ insert: async (row) => { inserted = row; return { error: null }; } }) }) },
  };
  const waitlist = load('src/app/api/waitlist/route.ts', waitlistMocks);
  sent.length = 0; nextResult = { data: null, error: { name: 'application_error', message: 'down' } };
  const wl = await quietly(() => waitlist.POST(post({ email: 'Someone@Example.com', country: 'United Kingdom', website: '' })));
  assert.equal(wl.result.status, 200);
  assert.equal(inserted.email, 'someone@example.com');
  assert.equal(sent.length, 1);
  assert.ok(wl.logged.some((l) => l.includes('Waitlist notification email failed')));
  console.log('PASS waitlist signup is saved even if the notification fails, and the failure is logged');
})().catch((e) => { console.error(e); process.exitCode = 1; });
