// beton.is markaðssíða (UX-yfirferð 2026-10): proxy-tilvísanir, 404-leið, metadata og
// samskiptaform. Ekkert er sent og enginn Supabase er snertur.
// Keyrt: node scripts/verify-beton-marketing.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

function load(file, mocks = {}) {
  const src = read(file);
  const out = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const m = { exports: {} };
  const req = (id) => {
    if (Object.prototype.hasOwnProperty.call(mocks, id)) return mocks[id];
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}.ts`, mocks);
    return require(path.join(ROOT, 'node_modules', id));
  };
  new Function('module', 'exports', 'require', out)(m, m.exports, req);
  return m.exports;
}

(async () => {
  // ---- proxy ----
  const { NextRequest } = require(path.join(ROOT, 'node_modules/next/server'));
  const proxyMocks = {
    '@supabase/ssr': { createServerClient: () => { throw new Error('Supabase má ekki snerta í þessu prófi'); } },
    '@/lib/access': { checkDashboardAccess: async () => ({ allowed: false }), loginErrorFor: () => 'x' },
    '@/lib/onboarding': { ONBOARDING_PATH: '/dashboard/onboarding', onboardingFor: () => null },
    '@/lib/report/shared': { isWorkerRequest: () => false, WORKER_TOKEN_HEADER: 'x-report-worker-token' },
  };
  const { proxy } = load('src/proxy.ts', proxyMocks);
  async function hit(host, pathname) {
    const res = await proxy(new NextRequest(`http://localhost:3000${pathname}`, { headers: { host } }));
    return {
      status: res.status,
      location: res.headers.get('location'),
      rewrite: res.headers.get('x-middleware-rewrite'),
    };
  }
  async function redirects(host, pathname, to, status) {
    const r = await hit(host, pathname);
    assert.equal(r.location, to, `${host}${pathname} → ${r.location}`);
    if (status) assert.equal(r.status, status, `${host}${pathname} status`);
  }
  async function passes(host, pathname) {
    const r = await hit(host, pathname);
    assert.equal(r.location, null, `${host}${pathname} á ekki að vísa (${r.location})`);
  }

  for (const alias of ['/login', '/signin', '/sign-in']) {
    await redirects('beton.is', alias, 'https://admin.beton.is/dashboard/login', 308);
  }
  await redirects('www.beton.is', '/login', 'https://admin.beton.is/dashboard/login', 308);
  console.log('PASS beton.is /login (+samheiti) → admin.beton.is/dashboard/login (308)');

  await redirects('beton.is', '/rondva', 'https://rondva.com/', 308);
  await redirects('beton.is', '/rondva/privacy', 'https://rondva.com/privacy', 308);
  await passes('beton.is', '/rondvafoo'); // ekki Rondva-slóð → 404-síða Beton
  console.log('PASS beton.is/rondva* → rondva.com');

  await redirects('admin.beton.is', '/samband', 'https://beton.is/samband', 308);
  await redirects('admin.beton.is', '/verdskra', 'https://beton.is/verdskra', 308);
  for (const ok of ['/dashboard', '/dashboard/login', '/api/contact', '/favicon.ico', '/apple-icon.png', '/fonts/report/a.ttf', '/robots.txt']) {
    if (ok.startsWith('/dashboard') && ok !== '/dashboard/login') continue; // krefst Supabase
    await passes('admin.beton.is', ok);
  }
  assert.equal((await hit('admin.beton.is', '/')).location, 'http://localhost:3000/dashboard');
  console.log('PASS admin.beton.is: markaðsslóðir → beton.is; /dashboard, /api, kyrrstæðar skrár og rót óbreytt');

  const fav = await hit('app.rondva.com', '/favicon.ico');
  assert.equal(fav.location, null);
  assert.ok(fav.rewrite && fav.rewrite.endsWith('/rondva/favicon.ico'), `favicon rewrite: ${fav.rewrite}`);
  await redirects('app.rondva.com', '/samband', 'https://rondva.com/samband');
  await redirects('app.rondva.com', '/login', 'http://localhost:3000/dashboard/login');
  await redirects('rondva.com', '/login', 'https://app.rondva.com/dashboard/login');
  console.log('PASS app.rondva.com/favicon.ico → rewrite á /rondva/favicon.ico; Rondva-tilvísanir óbreyttar');

  // Preview/localhost (óþekktur hýsill) fær engar tilvísanir.
  await passes('localhost:3000', '/login');
  await passes('localhost:3000', '/rondva');
  await passes('abc.vercel.app', '/samband');
  console.log('PASS óþekktur hýsill (preview/localhost): engar tilvísanir');

  // Bakgrunns-worker-hjáleiðin er óbreytt í upprunakóðanum.
  const proxySrc = read('src/proxy.ts');
  assert.ok(proxySrc.includes('isWorkerRequest(request.headers.get(WORKER_TOKEN_HEADER))'));
  console.log('PASS skýrsluworker-hjáleið í proxy.ts óbreytt');

  // ---- metadata ----
  const { betonPageMetadata, betonMetadata } = load('src/lib/beton-metadata.ts', { '@/lib/constants': load('src/lib/constants.ts') });
  assert.equal(betonMetadata.title.template, '%s | Beton ehf.');
  const m = betonPageMetadata({ title: 'Verðskrá', description: 'Lýsing', path: '/verdskra' });
  assert.equal(m.alternates.canonical, 'https://beton.is/verdskra');
  assert.equal(m.openGraph.url, 'https://beton.is/verdskra');
  assert.equal(m.openGraph.title, 'Verðskrá | Beton ehf.');
  assert.equal(m.openGraph.description, 'Lýsing');
  assert.equal(m.twitter.title, 'Verðskrá | Beton ehf.');
  assert.equal(m.openGraph.images[0].url, '/images/og-beton.jpg');
  assert.ok(fs.existsSync(path.join(ROOT, 'public/images/og-beton.jpg')));
  for (const page of ['app', 'personuvernd', 'samband', 'skilmalar', 'umokkur', 'verdskra']) {
    assert.ok(read(`src/app/(main)/${page}/page.tsx`).includes('betonPageMetadata('), `${page} notar betonPageMetadata`);
  }
  console.log('PASS betonPageMetadata + titilsniðmát + OG-mynd; allar undirsíður nota það');

  // ---- leiðir og leifar ----
  assert.ok(fs.existsSync(path.join(ROOT, 'src/app/(main)/not-found.tsx')));
  assert.ok(read('src/app/(main)/[...rest]/page.tsx').includes('notFound()'));
  assert.ok(!fs.existsSync(path.join(ROOT, 'src/app/(auth)')), 'gamla lykilorðssíðan á að vera farin');
  assert.ok(!fs.existsSync(path.join(ROOT, 'src/app/api/auth')));
  assert.ok(!read('src/app/robots.ts').includes('/login/'));
  const constants = load('src/lib/constants.ts');
  assert.ok(!constants.NAV_LINKS.some((l) => l.href === '/samband'), 'Hafa samband á ekki heima í NAV_LINKS (hnappurinn er CTA)');
  console.log('PASS 404-leið, legacy-leifar farnar, NAV_LINKS án CTA');

  // ---- samskiptaform (upprunagreining) ----
  const form = read('src/components/ContactForm.tsx');
  for (const needle of ['aria-invalid', 'aria-describedby', '<fieldset', '<legend', 'role="alert"', 'role="status"',
    '.catch(() => null)', 'autoComplete="name"', 'autoComplete="email"', 'autoComplete="tel"', 'contact_form_submit', 'tabIndex={-1}']) {
    assert.ok(form.includes(needle), `ContactForm vantar ${needle}`);
  }
  assert.ok(form.includes('COMPANY.email') && form.includes('COMPANY.phoneHref'), 'villan vísar alltaf á netfang og síma');
  assert.ok(!/dataLayer\??\.push\([^)]*(nafn|netfang|simanumer|skilabod)/.test(form), 'engar persónuupplýsingar í GTM-atburðinum');
  console.log('PASS ContactForm: aria, fieldset, role=alert/status, varið res.json(), fallback-tenglar, GTM-atburður');

  const header = read('src/components/Header.tsx');
  for (const needle of ['aria-expanded', 'aria-controls', 'Escape', 'pointerdown', 'usePathname', 'aria-current', 'phoneHref', 'motion-reduce']) {
    assert.ok(header.includes(needle), `Header vantar ${needle}`);
  }
  assert.ok(read('src/app/(main)/layout.tsx').includes('id="content"') && read('src/app/(main)/layout.tsx').includes('Fara í efni'));
  console.log('PASS Header/valmynd og skip-link');
})().catch((e) => { console.error(e); process.exit(1); });
