// Keyrir raunverulega inneignarhliðið (src/lib/report/credits.ts) með fölsuðum Supabase-
// biðlurum: skuggahamur hafnar aldrei, undanþegnir (Beton/Vitvélar) fara alltaf í gegn.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const load = (rel, extra = {}) => {
  const context = { exports: {}, console, process, AbortSignal, JSON, ...extra };
  context.module = { exports: context.exports };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', rel), 'utf8'),
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, context);
  return context.module.exports;
};
const allowed = load('src/lib/allowed-users.ts');
// Höfnunartextarnir búa í stjórnborðskatalóginu (is = Beton, en = Rondva).
const format = load('src/lib/i18n/format.ts');
const { DASHBOARD_COPY: COPY } = load('src/lib/i18n/dashboard.ts', { Intl, require: (id) => (id === './format' ? format : require(id)) });

let service; // stillt í hverju prófi
const quiet = { ...console, log() {}, warn() {}, error() {} };
const credits = load('src/lib/report/credits.ts', {
  console: quiet,
  require: (id) => id === '@/lib/allowed-users' ? allowed
    : id === '@/lib/supabase/service' ? { createServiceClient: () => { if (service instanceof Error) throw service; return service; } }
    : require(id),
});
const fakeService = (begin) => {
  const calls = [];
  return { calls, rpc(name, args) { calls.push(name); const r = name === 'begin_ai_report_run' ? begin(args) : { data: true, error: null };
    return { abortSignal: () => (r instanceof Error ? Promise.reject(r) : Promise.resolve(r)) }; } };
};
const userClient = (company) => ({ from: () => ({ select: () => ({ limit: () => ({ abortSignal: () => ({
  maybeSingle: async () => { if (company instanceof Error) throw company; return { data: company }; } }) }) }) }) });
const BRAGI = { userId: 'u-b', email: 'beton@beton.is' };
const ACME = { userId: 'u-a', email: 'jane@acme.co.uk' };
const same = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b);
const decision = (d) => () => ({ data: d, error: null });
const rpcError = () => ({ data: null, error: { message: 'boom' } });

(async () => {
  const origConsole = globalThis.console;
  let n = 0;
  async function check(name, mode, fn) {
    process.env.REPORT_CREDITS_MODE = mode;
    await fn(); n++; origConsole.log(`PASS ${name}`);
  }
  const begin = (who, supa = userClient(null)) => credits.beginWebCreditRun({ supabase: supa, inspectionId: 'i1', ...who });

  await check('off: no ledger call at all (not even the service client)', 'off', async () => {
    service = new Error('must not be created');
    same(await begin(ACME), { ok: true, runId: null });
  });
  await check('unset/typo mode behaves as off', 'enforced', async () => {
    service = new Error('must not be created');
    assert.equal((await begin(ACME)).ok, true);
  });
  await check('shadow: ledger error never refuses', 'shadow', async () => {
    service = fakeService(rpcError);
    assert.equal((await begin(ACME)).ok, true);
  });
  await check('shadow: missing service key never refuses', 'shadow', async () => {
    service = new Error('Service-client vantar');
    assert.equal((await begin(ACME)).ok, true);
  });
  await check('shadow: a denial is only logged', 'shadow', async () => {
    service = fakeService(decision({ allowed: false, reason: 'no_credits' }));
    same(await begin(ACME), { ok: true, runId: null });
  });
  await check('shadow: allowed non-exempt run is recorded', 'shadow', async () => {
    service = fakeService(decision({ allowed: true, exempt: false, charge: 'new_credit', run_id: 'r1' }));
    same(await begin(ACME), { ok: true, runId: 'r1' });
  });
  await check('enforce: exempt Bragi passes with his run id', 'enforce', async () => {
    service = fakeService(decision({ allowed: true, exempt: true, charge: 'exempt', run_id: 'rb' }));
    same(await begin(BRAGI), { ok: true, runId: 'rb' });
  });
  await check('enforce: ledger error → Bragi passes on his email', 'enforce', async () => {
    service = fakeService(rpcError);
    assert.equal((await begin({ userId: 'u-b', email: 'BETON@beton.is ' }, userClient(new Error('no net')))).ok, true);
  });
  await check('enforce: missing service key → Bragi still passes', 'enforce', async () => {
    service = new Error('Service-client vantar');
    assert.equal((await begin(BRAGI)).ok, true);
  });
  await check('enforce: ledger error → partner/billing_exempt company passes', 'enforce', async () => {
    service = fakeService(rpcError);
    assert.equal((await begin({ userId: 'u-x', email: 'x@beton.is' }, userClient({ billing_exempt: true, entitlement: 'partner' }))).ok, true);
  });
  await check('enforce: ledger error → customer company is refused (retry text)', 'enforce', async () => {
    service = fakeService(rpcError);
    const r = await begin(ACME, userClient({ billing_exempt: false, entitlement: 'customer' }));
    assert.equal(r.ok, false); assert.equal(r.reason, 'ledger_unavailable');
    assert.match(COPY.is.credits[r.reason], /Reyndu aftur/); assert.match(COPY.en.credits[r.reason], /try again/);
  });
  await check('enforce: non-exempt company is sent to the app and its reservation released', 'enforce', async () => {
    service = fakeService(decision({ allowed: true, exempt: false, charge: 'new_credit', run_id: 'r2' }));
    const r = await begin(ACME);
    assert.equal(r.ok, false); assert.equal(r.reason, 'use_app');
    assert.match(COPY.is.credits[r.reason], /Rondva-appið/); assert.match(COPY.en.credits[r.reason], /Rondva app/);
    assert.deepEqual(service.calls, ['begin_ai_report_run', 'abort_ai_report_run']);
  });
  await check('enforce: denials carry clear Icelandic and English text', 'enforce', async () => {
    for (const [reason, code, text, en] of [
      ['no_credits', 'no_credits', /búnar/, /free AI-drafted reports/],
      ['additional_credit_confirmation_required', 'additional_credit_confirmation_required', /endurgerðir/, /revisions/],
      ['in_progress', 'in_progress', /Verið er að/, /already being generated/],
      ['company_not_active', 'not_active', /ekki virkur/, /isn't active/],
      ['something_new', 'not_active', /ekki virkur/, /isn't active/],
    ]) {
      service = fakeService(decision({ allowed: false, reason }));
      const r = await begin(ACME); assert.equal(r.ok, false); assert.equal(r.reason, code);
      assert.match(COPY.is.credits[r.reason], text); assert.match(COPY.en.credits[r.reason], en);
    }
  });
  await check('finish/abort never throw and skip a null run', 'enforce', async () => {
    service = new Error('down');
    await credits.finishWebCreditRun('r1', 'm', 1); await credits.abortWebCreditRun('r1');
    service = fakeService(rpcError);
    await credits.finishWebCreditRun(null, 'm', 1); await credits.abortWebCreditRun(null);
    assert.deepEqual(service.calls, []);
  });
  origConsole.log(`${n} report-credit gate checks passed.`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
