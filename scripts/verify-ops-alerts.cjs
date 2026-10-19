/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node script, like the other verify-*.cjs */
// P6 viðvaranir (beton-app …_ops_alerts). Keyrt: node scripts/verify-ops-alerts.cjs
// 1) Tick: uppgjöf (giveUp) skráir viðvörun með starfs-id; endurröðun gerir það ekki; bilun í
//    skráningu breytir hvorki failed/error-merkingu né svarinu.
// 2) /api/ops/alerts/drain: aðeins með worker-tóka; án RESEND_API_KEY er engu læst (503);
//    sendir á rondva@ frá rondva.com með idempotency-lykli og merkir sent/villu.
// Supabase, Chromium og Resend eru gervuð — ekkert er sent.
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
    if (id.startsWith('./') || id.startsWith('../')) return load(path.join(path.dirname(file), `${id}.ts`), mocks);
    return require(id);
  };
  new Function('module', 'exports', 'require', 'process', out)(m, m.exports, req, process);
  return m.exports;
}

const nextServer = {
  NextResponse: { json: (body, init) => new Response(JSON.stringify(body), { status: init?.status ?? 200, headers: { 'content-type': 'application/json' } }) },
};
const TOKEN = 'test-worker-token';
process.env.REPORT_WORKER_TOKEN = TOKEN;
const req = (token) => ({ headers: new Headers(token ? { 'x-report-worker-token': token } : {}) });

// Gervi-Supabase fyrir tick: eitt starf, svo tóm biðröð.
function fakeTickSvc({ attempts, alertBehaviour = 'ok' }) {
  const log = { rpc: [], updates: [] };
  let claimed = false;
  const svc = {
    rpc(name, args) {
      log.rpc.push({ name, args });
      if (name === 'claim_next_report_job') {
        const data = claimed ? [] : [{ id: 'job-1', inspection_id: 'insp-1', attempts }];
        claimed = true;
        return Promise.resolve({ data, error: null });
      }
      if (name === 'ops_alert_report_failure') {
        if (alertBehaviour === 'throw') throw new Error('network down');
        if (alertBehaviour === 'error') return Promise.resolve({ data: null, error: { message: 'function does not exist' } });
        return Promise.resolve({ data: true, error: null });
      }
      throw new Error(`óvænt rpc ${name}`);
    },
    from(table) {
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({
          data: { id: 'insp-1', inspector_id: 'i', address: '12 Secret Rd', inspection_date: '2026-10-20', report_locale: 'en' }, error: null }) }) }),
        update: (values) => ({ eq: async (_c, id) => { log.updates.push({ table, values, id }); return { error: null }; } }),
      };
    },
    storage: { from: () => ({ upload: async () => ({ error: null }) }) },
  };
  return { svc, log };
}

function loadTick(svc) {
  return load('src/app/api/report/worker/tick/route.ts', {
    'next/server': nextServer,
    '@/lib/supabase/service': { createServiceClient: () => svc },
    '@/lib/report/render-pdf': { renderReportPdf: async () => { throw new Error('.report-article fannst ekki [status=404]'); } },
  });
}

async function quietly(fn) {
  const logged = [];
  const orig = console.error;
  console.error = (...a) => logged.push(a.map(String).join(' '));
  try { return { result: await fn(), logged }; } finally { console.error = orig; }
}

let n = 0;
const check = async (name, fn) => { await fn(); n++; console.log(`PASS ${name}`); };

(async () => {
  await check('tick giveUp (3. tilraun): failed + error-merking og EIN viðvörun með starfs-id, uppruni worker', async () => {
    const { svc, log } = fakeTickSvc({ attempts: 3 });
    const { result: res } = await quietly(() => loadTick(svc).POST(req(TOKEN)));
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.processed, 1);
    assert.equal(body.results[0].ok, false);
    assert.deepEqual(log.updates.map((u) => [u.table, u.values.status]), [['report_jobs', 'failed'], ['inspections', 'error']]);
    const alerts = log.rpc.filter((r) => r.name === 'ops_alert_report_failure');
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0].args.p_inspection_id, 'insp-1');
    assert.equal(alerts[0].args.p_job_id, 'job-1');
    assert.equal(alerts[0].args.p_source, 'worker');
    assert.match(alerts[0].args.p_stage, /giveUp after 3 attempts/);
    assert.ok(alerts[0].args.p_error.length <= 300);
    assert.ok(!JSON.stringify(alerts[0].args).includes('Secret Rd'), 'ekkert heimilisfang í viðvörun');
  });

  await check('tick endurröðun (1. tilraun): engin viðvörun', async () => {
    const { svc, log } = fakeTickSvc({ attempts: 1 });
    await quietly(() => loadTick(svc).POST(req(TOKEN)));
    assert.equal(log.rpc.filter((r) => r.name === 'ops_alert_report_failure').length, 0);
    assert.deepEqual(log.updates.map((u) => [u.table, u.values.status]), [['report_jobs', 'queued']]);
  });

  for (const behaviour of ['throw', 'error']) {
    await check(`tick: viðvörunarkall ${behaviour === 'throw' ? 'kastar' : 'skilar villu (flutningur ókeyrður)'} → sama svar og merkingar`, async () => {
      const { svc, log } = fakeTickSvc({ attempts: 3, alertBehaviour: behaviour });
      const { result: res, logged } = await quietly(() => loadTick(svc).POST(req(TOKEN)));
      assert.equal(res.status, 200);
      assert.equal((await res.json()).processed, 1);
      assert.deepEqual(log.updates.map((u) => [u.table, u.values.status]), [['report_jobs', 'failed'], ['inspections', 'error']]);
      assert.ok(logged.some((l) => l.includes('[ops-alert]')), 'bilun skráð í log');
    });
  }

  // ── drain ──
  function fakeDrainSvc(rows, { claimError } = {}) {
    const log = { claims: 0, marks: [] };
    return { log, svc: { rpc(name, args) {
      if (name === 'ops_alert_claim') { log.claims++; return Promise.resolve(claimError ? { data: null, error: { message: claimError } } : { data: rows, error: null }); }
      if (name === 'ops_alert_mark') { log.marks.push(args); return Promise.resolve({ data: true, error: null }); }
      throw new Error(`óvænt rpc ${name}`);
    } } };
  }
  const rows = [
    { id: 7, kind: 'report_failed', brand: 'rondva', subject: '[Rondva] Report failed: Test NZ Ltd (NZ)', body: 'b1', attempts: 1 },
    { id: 8, kind: 'report_failed', brand: 'beton', subject: '[Beton] Report failed: Beton ehf. (IS)', body: 'b2', attempts: 1 },
    { id: 9, kind: 'new_company', brand: 'rondva', subject: '[Rondva] New company: X, NZ, via apple', body: 'b3', attempts: 2 },
  ];
  delete process.env.OPS_ALERT_TO;
  delete process.env.OPS_ALERT_FROM;
  const alertsLib = load('src/lib/ops/alerts.ts', {});

  await check('drain: sendir hverja röð á rondva@rondva.com frá alerts@rondva.com með idempotency-lykli; merkir sent/villu', async () => {
    const { svc, log } = fakeDrainSvc(rows);
    const sent = [];
    const mailer = { emails: { send: async (msg, opts) => {
      sent.push({ msg, opts });
      if (msg.subject.startsWith('[Beton]')) return { data: null, error: { message: 'rate limited' } };
      if (msg.subject.includes('New company')) throw new Error('socket hang up');
      return { data: { id: 'x' }, error: null };
    } } };
    const { result } = await quietly(() => alertsLib.drainOpsAlerts(svc, mailer));
    assert.deepEqual(result, { claimed: 3, sent: 1, failed: 2 });
    assert.equal(sent.length, 3);
    for (const s of sent) {
      assert.equal(s.msg.to, 'rondva@rondva.com');
      assert.equal(s.msg.from, 'Rondva Alerts <alerts@rondva.com>');
      assert.ok(s.msg.from.endsWith('@rondva.com>'), 'sendandi á staðfestu léni rondva.com');
    }
    assert.deepEqual(sent.map((s) => s.opts.idempotencyKey), ['ops-alert-7', 'ops-alert-8', 'ops-alert-9']);
    assert.equal(sent[1].msg.subject, '[Beton] Report failed: Beton ehf. (IS)', 'Beton merkt í efnislínu');
    assert.deepEqual(log.marks, [
      { p_id: 7, p_sent: true, p_error: null },
      { p_id: 8, p_sent: false, p_error: 'rate limited' },
      { p_id: 9, p_sent: false, p_error: 'socket hang up' },
    ]);
  });

  await check('drain: villa í claim → ekkert sent', async () => {
    const { svc } = fakeDrainSvc(rows, { claimError: 'permission denied' });
    let sends = 0;
    const r = await alertsLib.drainOpsAlerts(svc, { emails: { send: async () => { sends++; return { data: null, error: null }; } } });
    assert.equal(sends, 0);
    assert.equal(r.error, 'permission denied');
  });

  function loadDrainRoute(svc) {
    return load('src/app/api/ops/alerts/drain/route.ts', {
      'next/server': nextServer,
      '@/lib/supabase/service': { createServiceClient: () => svc },
      resend: { Resend: class { constructor() { this.emails = { send: async () => ({ data: { id: 'x' }, error: null }) }; } } },
    });
  }

  await check('drain-leið: án tóka / rangur tóki → 401, ekkert sótt', async () => {
    const { svc, log } = fakeDrainSvc(rows);
    process.env.RESEND_API_KEY = 'test-not-a-real-key';
    const route = loadDrainRoute(svc);
    assert.equal((await route.POST(req(null))).status, 401);
    assert.equal((await route.POST(req('wrong'))).status, 401);
    assert.equal(log.claims, 0);
  });

  await check('drain-leið: RESEND_API_KEY vantar → 503 og engu læst (engin tilraun eydd)', async () => {
    const { svc, log } = fakeDrainSvc(rows);
    delete process.env.RESEND_API_KEY;
    const { result: res } = await quietly(() => loadDrainRoute(svc).POST(req(TOKEN)));
    assert.equal(res.status, 503);
    assert.equal(log.claims, 0);
  });

  await check('drain-leið: með tóka og lykli → sendir og skilar talningu', async () => {
    const { svc, log } = fakeDrainSvc(rows);
    process.env.RESEND_API_KEY = 'test-not-a-real-key';
    const res = await loadDrainRoute(svc).POST(req(TOKEN));
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { claimed: 3, sent: 3, failed: 0 });
    assert.equal(log.marks.filter((m) => m.p_sent).length, 3);
    delete process.env.RESEND_API_KEY;
  });

  await check('isWorkerRequest: tímaöruggur samanburður (rétt/rangt/sama lengd/önnur lengd/tómt/env vantar)', () => {
    const { isWorkerRequest } = load('src/lib/report/shared.ts', {});
    const src = fs.readFileSync(path.join(ROOT, 'src/lib/report/shared.ts'), 'utf8');
    assert.ok(!/headerValue\s*===\s*expected/.test(src), 'enginn === samanburður á tóka');
    assert.equal(isWorkerRequest(TOKEN), true);
    assert.equal(isWorkerRequest('test-worker-tokeX'), false);
    assert.equal(isWorkerRequest('Test-worker-token'), false);
    assert.equal(isWorkerRequest(TOKEN + 'x'), false);
    assert.equal(isWorkerRequest(''), false);
    assert.equal(isWorkerRequest(null), false);
    const saved = process.env.REPORT_WORKER_TOKEN;
    delete process.env.REPORT_WORKER_TOKEN;
    try { assert.equal(isWorkerRequest(TOKEN), false); assert.equal(isWorkerRequest(''), false); }
    finally { process.env.REPORT_WORKER_TOKEN = saved; }
  });

  await check('enginn lykill eða netfang annað en rondva@/alerts@ harðkóðað', () => {
    for (const f of ['src/lib/ops/alerts.ts', 'src/app/api/ops/alerts/drain/route.ts']) {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      assert.ok(!/re_[A-Za-z0-9]{16,}/.test(src), `${f}: enginn Resend-lykill`);
      const emails = src.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/g) || [];
      assert.deepEqual([...new Set(emails)].sort(), f.endsWith('alerts.ts') ? ['alerts@rondva.com'] : []);
    }
  });

  console.log(`verify-ops-alerts: ${n} PASS`);
})().catch((e) => { console.error(e); process.exit(1); });
