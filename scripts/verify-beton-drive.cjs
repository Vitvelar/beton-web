// „Senda í Google Drive" aðeins fyrir Beton (src/lib/beton-drive.ts) — sama regla og
// beton-app supabase/functions/upload-to-drive/access.ts (ákvörðun eiganda 2026-09-27).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const context = { exports: {} };
context.module = { exports: context.exports };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/beton-drive.ts'), 'utf8'),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, context);
const { canUseBetonDrive, BETON_COMPANY_ID } = context.module.exports;
const client = (company, fail) => ({ calls: 0, async rpc(name) { this.calls++; assert.equal(name, 'my_access');
  if (fail) throw new Error('down'); return { data: { company }, error: null }; } });
const BETON = { id: BETON_COMPANY_ID, status: 'active', entitlement: 'partner' };

(async () => {
  const c1 = client(null, true);
  assert.equal(await canUseBetonDrive(c1, ' Beton@Beton.is '), true); assert.equal(c1.calls, 0);
  console.log('PASS Bragi (beton@beton.is) without any lookup, even when my_access is down');
  assert.equal(await canUseBetonDrive(client(BETON), 'employee@beton.is'), true);
  console.log('PASS active member of Beton ehf. (by id)');
  for (const [who, company] of [
    ['hjalti@vitvelar.is', { id: 'vitvelar', status: 'active', entitlement: 'internal' }],
    ['someone@acme.co.uk', { id: 'acme', status: 'active', entitlement: 'customer' }],
    ['fake@beton.is', { id: 'other', status: 'active', entitlement: 'partner' }],
    ['suspended@beton.is', { ...BETON, status: 'suspended' }],
    ['nocompany@example.com', null],
  ]) assert.equal(await canUseBetonDrive(client(company), who), false, who);
  assert.equal(await canUseBetonDrive(client(BETON, true), 'employee@beton.is'), false);
  console.log('PASS Vitvélar, customers, look-alike partners, suspended Beton, no company and lookup failure → no Drive');
})().catch((e) => { console.error(e); process.exitCode = 1; });
