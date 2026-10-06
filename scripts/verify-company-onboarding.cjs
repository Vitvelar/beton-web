// Nýskráning fyrirtækis á app.rondva.com (APP-13): aðgangshliðið (src/lib/access.ts),
// reglurnar (src/lib/onboarding.ts) og að Beton-leiðirnar fái aldrei nýskráningu.
// Keyrir raunverulega kóðann með fölsuðum Supabase-biðlara — engin netköll.
// Keyrt með `node scripts/verify-company-onboarding.cjs`.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
function load(rel, modules = {}) {
  const context = { exports: {}, URL, Intl };
  context.module = { exports: context.exports };
  context.require = (id) => {
    if (id in modules) return modules[id];
    throw new Error(`${rel}: unexpected require('${id}')`);
  };
  vm.runInNewContext(
    ts.transpileModule(read(rel), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText,
    context
  );
  return context.module.exports;
}
const same = (a, b, msg) => assert.deepEqual(JSON.parse(JSON.stringify(a)), b, msg);

const allowedUsers = load('src/lib/allowed-users.ts');
const { checkDashboardAccess, loginErrorFor } = load('src/lib/access.ts', { '@/lib/allowed-users': allowedUsers });
const ob = load('src/lib/onboarding.ts');

const client = (respond) => ({ calls: [], rpc(name) { this.calls.push(name); return respond(name); } });
const ok = (data) => async () => ({ data, error: null });

let n = 0;
const pass = (name) => { n++; console.log(`PASS ${name}`); };

(async () => {
  // 1. Beton: listinn eða ekkert — ekkert RPC, aldrei nýskráning.
  {
    const c = client(() => { throw new Error('RPC must not be called on Beton'); });
    same(await checkDashboardAccess(c, 'beton@beton.is', 'beton'), { allowed: true });
    const stranger = await checkDashboardAccess(c, 'jane@acme.co.uk', 'beton');
    same(stranger, { allowed: false, reason: 'no_account' });
    assert.equal(ob.onboardingFor('beton', stranger), null);
    assert.equal(ob.onboardingFor('beton', { allowed: false, reason: 'no_account', canRegister: true }), null);
    assert.equal(ob.onboardingFor('beton', { allowed: false, reason: 'pending' }), null);
    assert.deepEqual(c.calls, []);
    pass('Beton: allowlist only, no my_access call, onboardingFor() always null');
  }

  // 2. Rondva: skráning aðeins þegar my_access svaraði og company er null.
  {
    const c = client(ok({ allowed: false, company: null }));
    const access = await checkDashboardAccess(c, 'jane@acme.co.uk', 'rondva');
    same(access, { allowed: false, reason: 'no_account', canRegister: true });
    assert.equal(ob.onboardingFor('rondva', access), 'register');
    assert.deepEqual(c.calls, ['my_access']);

    const pending = await checkDashboardAccess(client(ok({ allowed: false, company: { status: 'pending', name: ' Acme Ltd ', country: 'GB' } })), 'jane@acme.co.uk', 'rondva');
    same(pending, { allowed: false, reason: 'pending', company: { name: 'Acme Ltd', country: 'GB' } });
    assert.equal(ob.onboardingFor('rondva', pending), 'pending');

    const suspended = await checkDashboardAccess(client(ok({ allowed: false, company: { status: 'suspended', name: 'X Co', country: 'DE' } })), 'jane@acme.co.uk', 'rondva');
    assert.equal(suspended.reason, 'suspended');
    assert.equal(ob.onboardingFor('rondva', suspended), null);
    assert.equal(loginErrorFor(suspended), 'suspended');

    same(await checkDashboardAccess(client(ok({ allowed: true, company: { status: 'active' } })), 'jane@acme.co.uk', 'rondva'), { allowed: true });
    assert.equal(ob.onboardingFor('rondva', { allowed: true }), null);
    pass('Rondva: no company → register; pending → review page; suspended/active → unchanged');
  }

  // 3. Villa eða óljóst svar opnar ALDREI skráningarformið (gamla hegðunin helst).
  {
    const failures = [
      async () => ({ data: null, error: { message: 'boom' } }),
      async () => ({ data: null, error: null }),
      async () => { throw new Error('network'); },
      ok({ allowed: false }), // company vantar alveg
      ok({ allowed: 'true', company: { status: 'active' } }),
      ok('nonsense'),
    ];
    for (const respond of failures) {
      const access = await checkDashboardAccess(client(respond), 'jane@acme.co.uk', 'rondva');
      same(access, { allowed: false, reason: 'no_account' });
      assert.equal(ob.onboardingFor('rondva', access), null);
      assert.equal(loginErrorFor(access), 'unauthorized');
    }
    pass('Rondva: RPC error/timeout/malformed payload → login error as before, never the form');
  }

  // 4. Inntaksreglur = register_company (2–120 stafir eftir btrim, ^[A-Z]{2}$) + ISO-listi.
  {
    assert.equal(ob.COUNTRY_CODES.length, 249);
    assert.equal(new Set(ob.COUNTRY_CODES).size, 249);
    assert.ok(ob.COUNTRY_CODES.every((c) => /^[A-Z]{2}$/.test(c)));
    for (const c of ['IS', 'GB', 'US', 'DE', 'NO']) assert.ok(ob.isCountryCode(c), c);
    for (const c of ['XX', 'gb', 'UK', 'EU', '', null]) assert.ok(!ob.isCountryCode(c), String(c));

    const good = ob.validateCompanyForm({ name: '  Acme \n Surveys   Ltd ', country: ' gb ', website: 'Acme.co.uk' });
    same(good, { ok: true, value: { name: 'Acme Surveys Ltd', country: 'GB', website: 'https://acme.co.uk' } });
    same(ob.validateCompanyForm({ name: 'AB', country: 'IS', website: '' }), { ok: true, value: { name: 'AB', country: 'IS', website: null } });
    same(ob.validateCompanyForm({ name: '', country: '', website: 'nope' }), { ok: false, errors: { name: 'required', country: 'required', website: 'invalid' } });
    same(ob.validateCompanyForm({ name: 'A', country: 'XX', website: null }), { ok: false, errors: { name: 'length', country: 'invalid' } });
    assert.equal(ob.validateCompanyForm({ name: 'x'.repeat(120), country: 'GB', website: '' }).ok, true);
    same(ob.validateCompanyForm({ name: 'x'.repeat(121), country: 'GB', website: '' }), { ok: false, errors: { name: 'length' } });
    // FormData skilar File eða null fyrir reiti sem vantar — aldrei hrun.
    same(ob.validateCompanyForm({ name: {}, country: 7, website: undefined }), { ok: false, errors: { name: 'required', country: 'required' } });
    pass('validation mirrors register_company (2–120 chars after trim, ISO country) and never throws');
  }

  // 5. Vefsíða: valfrjáls, aðeins http(s) með léni.
  {
    const cases = [
      ['', null], ['   ', null], [null, null],
      ['example.com', 'https://example.com'],
      ['HTTP://Example.COM/', 'http://example.com'],
      ['https://www.acme.co.uk/about?x=1', 'https://www.acme.co.uk/about?x=1'],
      ['bücher.de', 'https://xn--bcher-kva.de'],
      ['localhost', undefined], ['acme', undefined], ['1.2.3.4', undefined],
      ['javascript:alert(1)', undefined], ['ftp://acme.com', undefined],
      ['https://user:pw@acme.com', undefined], ['acme .com', undefined],
      ['https://' + 'a'.repeat(200) + '.com', undefined],
    ];
    for (const [input, expected] of cases) assert.equal(ob.normalizeWebsite(input), expected, String(input));
    assert.equal(ob.COMPANY_WEBSITE_KEY, 'company_website');
    pass('website: optional; only http(s) with a real domain; normalized; ≤ 200 chars');
  }

  // 6. Villur úr register_company → skýr niðurstaða; allt óþekkt = failed.
  {
    assert.equal(ob.registerOutcome(null), 'ok');
    for (const code of ['already_registered', 'invalid_company_name', 'invalid_country', 'not_authenticated']) {
      assert.equal(ob.registerOutcome({ code: 'P0001', message: code }), code);
    }
    assert.equal(ob.registerOutcome({ code: '23505', message: 'already_registered' }), 'already_registered');
    assert.equal(ob.registerOutcome({ code: 'PGRST202', message: 'Could not find the function' }), 'failed');
    assert.equal(ob.registerOutcome({ message: '' }), 'failed');
    pass('register_company errors map to field errors / already registered / generic failure');
  }

  // 7. Sjálfgefið land úr Accept-Language.
  {
    const cases = [
      ['en-GB,en;q=0.9', 'GB'], ['is-IS,is;q=0.9,en;q=0.8', 'IS'], ['en', null], ['', null], [null, null],
      ['en;q=0.9,de-DE;q=0.8', 'DE'], ['fr-CA;q=0.5,en-US;q=0.9', 'US'], ['zh-Hant-TW', 'TW'],
      ['es-419,es;q=0.9', null], ['en-XX,en-IE;q=0.5', 'IE'], ['de-CH;q=0', null], ['*', null],
    ];
    for (const [header, expected] of cases) assert.equal(ob.countryFromAcceptLanguage(header), expected, String(header));
    pass('default country from Accept-Language (highest q with an ISO region), else none');
  }

  // 8. Landaheiti á tungumáli stjórnborðsins, raðað.
  {
    const en = ob.countryOptions('en');
    assert.equal(en.length, 249);
    assert.equal(en.find((c) => c.code === 'GB').name, 'United Kingdom');
    const names = Array.from(en, (c) => c.name);
    assert.deepEqual(names, [...names].sort(new Intl.Collator('en').compare));
    assert.equal(ob.countryOptions('is').find((c) => c.code === 'IS').name, 'Ísland');
    pass('country options: localized names (en/is), sorted, all 249 codes');
  }

  // 9. Leiðirnar: Beton fær aldrei nýskráningu; Rondva notar sömu reglu alls staðar.
  {
    const proxy = read('src/proxy.ts');
    const gate = proxy.slice(proxy.indexOf('const access = await checkDashboardAccess'));
    assert.match(gate, /if \(onboardingFor\(brand, access\)\) \{\s*if \(pathname === ONBOARDING_PATH\) return response;/);
    // Beton-greinin óbreytt: villa „unauthorized" utan Rondva.
    assert.match(gate, /brand === "rondva" \? loginErrorFor\(access\) : "unauthorized"/);
    const callback = read('src/app/(dashboard)/dashboard/auth/callback/route.ts');
    assert.ok(callback.indexOf('onboardingFor(brand, access)') < callback.indexOf('auth.signOut'), 'onboarding before sign-out');
    assert.match(callback, /brand === "rondva" \? loginErrorFor\(access\) : "unauthorized"/);
    const page = read('src/app/(dashboard)/dashboard/onboarding/page.tsx');
    assert.match(page, /if \(brand !== "rondva"\) notFound\(\);/);
    const action = read('src/app/(dashboard)/dashboard/onboarding/actions.ts');
    assert.match(action, /if \(\(await getRequestBrand\(\)\) !== "rondva"\) return/);
    assert.match(action, /supabase\.rpc\("register_company", \{\s*p_name: parsed\.value\.name,\s*p_country: parsed\.value\.country,\s*\}\)/);
    assert.doesNotMatch(action, /supabase\/service|SERVICE_ROLE|createServiceClient/, 'registration runs with the user session, never the service role');
    assert.match(action, /import \{ createClient \} from "@\/lib\/supabase\/server";/);
    // Engin redirect() í aðgerðinni: í serverful-ham sækir Next áfangastaðinn innanhúss á
    // localhost-hýsil, sem proxy.ts les sem Beton. Vafrinn fer sjálfur á `next`.
    assert.doesNotMatch(action, /from "next\/navigation"/);
    assert.match(read('src/components/rondva/CompanyOnboardingForm.tsx'), /window\.location\.assign\(state\.next\)/);
    const login = read('src/app/(dashboard)/dashboard/login/page.tsx');
    assert.match(login, /if \(brand === "rondva"\) \{/);
    assert.match(login, /<BetonLogin \/>/);
    pass('routes: Beton never reaches onboarding; Rondva proxy/callback/login/page/action use the same rule');
  }

  console.log(`${n} company-onboarding checks passed; no network calls made.`);
})().catch((e) => { console.error(e); process.exitCode = 1; });
