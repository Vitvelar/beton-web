#!/usr/bin/env node
// „Sign in with Apple" á vefnum (app.rondva.com) — býr til client secret og
// setur hann (valfrjálst) beint í Supabase Auth.
//
// Apple krefst þess að client secret fyrir vef-OAuth sé JWT undirritað með
// .p8-lykli og gildi í MEST 6 mánuði. Keyra aftur fyrir lok gildistímans
// (skriftan prentar dagsetninguna) — annars hættir Apple-innskráning að virka.
//
// Forsendur (Apple Developer, teymi Vitvéla — EKKI J9XAGVP324/Beton):
//   1. App ID með „Sign In with Apple" (t.d. com.rondva.app) — primary App ID.
//   2. Services ID (t.d. com.rondva.web) með Sign In with Apple kveikt:
//        Domains:     xvtkopphbmvszuvizrsb.supabase.co
//        Return URLs: https://xvtkopphbmvszuvizrsb.supabase.co/auth/v1/callback
//   3. Key með „Sign In with Apple" → sækja AuthKey_<KEYID>.p8 (aðeins hægt einu sinni).
//
// Notkun:
//   node scripts/apple-signin-secret.mjs \
//     --team <TEAM_ID> --key-id <KEY_ID> --services-id com.rondva.web \
//     --p8 ~/Downloads/AuthKey_<KEY_ID>.p8 [--push]
//
//   Án --push: prentar JWT-ið (til að líma handvirkt í Supabase → Auth →
//   Providers → Apple → Secret Key).
//   Með --push: uppfærir Supabase Auth gegnum management API:
//     external_apple_client_id = <services-id>,<núverandi auðkenni>  (vefur fyrst)
//     external_apple_secret    = <JWT>
//   Tóki: SUPABASE_ACCESS_TOKEN, annars macOS-lyklakippan („Supabase CLI").
//
// Eftir --push: setja RONDVA_APPLE_SIGNIN=1 á Vercel (Production) og redeploya
// → Apple-hnappurinn birtist á app.rondva.com/dashboard/login.
//
// Engin leyndarmál eru skrifuð á disk; .p8-skráin á aldrei heima í git.

import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";

const PROJECT_REF = "xvtkopphbmvszuvizrsb";
const MAX_LIFETIME_S = 15_777_000; // Apple: hámark 6 mánuðir
const LIFETIME_S = 180 * 24 * 60 * 60; // 180 dagar, undir hámarkinu

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const teamId = arg("team");
const keyId = arg("key-id");
const servicesId = arg("services-id");
const p8Path = arg("p8")?.replace(/^~(?=\/)/, homedir());
const push = process.argv.includes("--push");

if (!teamId || !keyId || !servicesId || !p8Path) {
  fail("Vantar --team, --key-id, --services-id og --p8. Sjá haus skriftunnar.");
}
if (!/^[A-Z0-9]{10}$/.test(teamId)) fail(`Team ID lítur ekki rétt út: ${teamId}`);
if (!/^[A-Z0-9]{10}$/.test(keyId)) fail(`Key ID lítur ekki rétt út: ${keyId}`);
if (teamId === "J9XAGVP324") {
  fail("J9XAGVP324 er persónulega Beton-teymið. Rondva á að vera á teymi Vitvéla.");
}

const b64url = (input) =>
  Buffer.from(typeof input === "string" ? input : JSON.stringify(input)).toString("base64url");

const iat = Math.floor(Date.now() / 1000);
const exp = iat + Math.min(LIFETIME_S, MAX_LIFETIME_S);

const header = { alg: "ES256", kid: keyId, typ: "JWT" };
const payload = {
  iss: teamId,
  iat,
  exp,
  aud: "https://appleid.apple.com",
  sub: servicesId,
};

let key;
try {
  key = createPrivateKey(readFileSync(p8Path, "utf8"));
} catch (error) {
  fail(`Gat ekki lesið .p8-lykilinn (${p8Path}): ${error.message}`);
}

const signingInput = `${b64url(header)}.${b64url(payload)}`;
const signature = sign("sha256", Buffer.from(signingInput), { key, dsaEncoding: "ieee-p1363" });
const jwt = `${signingInput}.${signature.toString("base64url")}`;

const expiresOn = new Date(exp * 1000).toISOString().slice(0, 10);

if (!push) {
  console.log(jwt);
  console.error(`\n✓ Client secret búið til. Rennur út ${expiresOn} — endurnýja fyrir þann tíma.`);
  process.exit(0);
}

function supabaseToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN;
  try {
    let token = execFileSync("security", ["find-generic-password", "-s", "Supabase CLI", "-w"], {
      encoding: "utf8",
    }).trim();
    if (token.startsWith("go-keyring-base64:")) {
      token = Buffer.from(token.slice("go-keyring-base64:".length), "base64").toString("utf8");
    }
    return token;
  } catch {
    fail("Enginn Supabase-tóki: settu SUPABASE_ACCESS_TOKEN eða keyrðu `npx supabase login`.");
  }
}

const api = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
const headers = { Authorization: `Bearer ${supabaseToken()}`, "Content-Type": "application/json" };

const current = await fetch(api, { headers });
if (!current.ok) fail(`Supabase svaraði ${current.status} við lestur auth-stillinga.`);
const config = await current.json();

// Vef-auðkennið (Services ID) verður að vera FYRST: Supabase notar fyrsta
// auðkennið fyrir OAuth-flæðið, hin (bundle ID appa) gilda fyrir native id_token.
const existing = String(config.external_apple_client_id ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter((s) => s && s !== servicesId);
const clientIds = [servicesId, ...existing].join(",");

const res = await fetch(api, {
  method: "PATCH",
  headers,
  body: JSON.stringify({
    external_apple_enabled: true,
    external_apple_client_id: clientIds,
    external_apple_secret: jwt,
  }),
});
if (!res.ok) fail(`Supabase svaraði ${res.status}: ${await res.text()}`);

console.log(`✓ Supabase Apple-provider uppfærður.`);
console.log(`  client_id: ${clientIds}`);
console.log(`  secret rennur út: ${expiresOn} — endurnýja fyrir þann tíma.`);
console.log(`\nNæst: RONDVA_APPLE_SIGNIN=1 á Vercel (Production) + redeploy.`);
