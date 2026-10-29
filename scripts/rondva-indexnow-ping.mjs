#!/usr/bin/env node
// Sendir slóðir rondva.com til IndexNow (Bing, Yandex o.fl.) eftir deploy.
//   node scripts/rondva-indexnow-ping.mjs            -> --dry-run (sjálfgefið): prentar aðeins hvað yrði sent
//   node scripts/rondva-indexnow-ping.mjs --send     -> POST á https://api.indexnow.org/indexnow
// Keyrir EKKI í build. Lykillinn er lesinn úr RONDVA_SEO.indexNowKey í src/lib/rondva-seo.ts.
//
// Google: sitemap-ping (google.com/ping?sitemap=) var aflagt 2023 og er EKKI notað. Sendu sitemap-ið
// inn í Search Console (slóðin er prentuð hér að neðan). Bing tekur við slóðum í gegnum IndexNow.
import { readFileSync } from "node:fs";

const HOST = "rondva.com";
const SITEMAP = `https://${HOST}/sitemap.xml`;
const send = process.argv.includes("--send") && !process.argv.includes("--dry-run");

const seo = readFileSync(new URL("../src/lib/rondva-seo.ts", import.meta.url), "utf8");
const key = /indexNowKey:\s*"([^"]*)"/.exec(seo)?.[1]?.trim() ?? "";
if (!/^[a-f0-9]{32}$/i.test(key)) {
  console.error("RONDVA_SEO.indexNowKey er tómur eða ekki 32 hex-stafir. Settu lykilinn í src/lib/rondva-seo.ts og deployaðu fyrst.");
  process.exit(1);
}
const keyLocation = `https://${HOST}/${key}.txt`;

const res = await fetch(SITEMAP);
if (!res.ok) {
  console.error(`Gat ekki sótt ${SITEMAP}: ${res.status}`);
  process.exit(1);
}
const xml = await res.text();
const urlList = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]).filter((u) => new URL(u).host === HOST);
if (urlList.length === 0) {
  console.error("Engar slóðir fundust í sitemap.");
  process.exit(1);
}

// Staðfestum að lykilskráin sé í loftinu áður en nokkuð er sent.
const keyRes = await fetch(keyLocation);
const keyBody = keyRes.ok ? (await keyRes.text()).trim() : "";
if (keyBody !== key) {
  console.error(`Lykilskráin ${keyLocation} er ekki í loftinu (staða ${keyRes.status}). Deployaðu fyrst.`);
  process.exit(1);
}

const payload = { host: HOST, key, keyLocation, urlList };
console.log(`${urlList.length} slóðir úr ${SITEMAP}`);
console.log(`Search Console (senda sitemap handvirkt): https://search.google.com/search-console/sitemaps?resource_id=sc-domain%3A${HOST}`);

if (!send) {
  console.log("DRY RUN (notaðu --send til að senda). Myndi senda á https://api.indexnow.org/indexnow:");
  console.log(JSON.stringify({ ...payload, key: "<falinn>" }, null, 2));
  process.exit(0);
}
const out = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});
console.log(`IndexNow svar: ${out.status} ${out.statusText} (200/202 = móttekið)`);
process.exit(out.status === 200 || out.status === 202 ? 0 : 1);
