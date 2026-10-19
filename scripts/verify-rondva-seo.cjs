// Verify: Rondva SEO-staðfesting, IndexNow-lykilskrá og sameAs (engin tóm tög, ekkert á Beton).
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
let failed = 0;
const check = (name, ok) => { console.log(`${ok ? "PASS" : "FAIL"} ${name}`); if (!ok) failed++; };

// Keyrum rondva-seo.ts með stubbuðum innflutningi og prófum hegðunina með mismunandi gildum.
function load(overrides) {
  let src = read("src/lib/rondva-seo.ts");
  src = src.replace(/indexNowKey: "[^"]*"/, `indexNowKey: ${JSON.stringify(overrides.key ?? "")}`)
    .replace(/verification: \{[^}]*\}/, `verification: ${JSON.stringify(overrides.verification ?? { google: "", bing: "" })}`)
    .replace(/linkedin: "[^"]*"/, `linkedin: ${JSON.stringify(overrides.linkedin ?? "")}`);
  const js = ts.transpileModule(src, { compilerOptions: { module: "commonjs", target: "es2020" } }).outputText;
  const stubs = {
    "@/lib/brand": { BRANDS: { rondva: { marketingUrl: "https://rondva.com", company: "x", contactEmail: "a@b.c" } } },
    "@/lib/rondva-links": { APP_STORE_URL: "https://apps.apple.com/app/id6817769506" },
    "@/lib/rondva-pricing": { RONDVA_OFFER_LINE: "", RONDVA_PACK: {}, RONDVA_PLANS: [] },
  };
  const m = { exports: {} };
  new Function("module", "exports", "require", js)(m, m.exports, (id) => stubs[id]);
  return m.exports;
}

const empty = load({});
check("empty placeholders -> no verification object", empty.rondvaVerification() === undefined);
check("empty key -> rondvaIndexNowKey null", empty.rondvaIndexNowKey() === null);
check("empty profiles -> sameAs is App Store only", JSON.stringify(empty.organizationLd().sameAs) === JSON.stringify(["https://apps.apple.com/app/id6817769506"]));
const key = "0123456789abcdef0123456789abcdef";
const set = load({ key, verification: { google: "gtok", bing: "btok" }, linkedin: "https://www.linkedin.com/company/rondva" });
check("google + bing -> verification mapped", JSON.stringify(set.rondvaVerification()) === JSON.stringify({ google: "gtok", other: { "msvalidate.01": "btok" } }));
check("only google -> no empty bing tag", JSON.stringify(load({ verification: { google: "g", bing: "" } }).rondvaVerification()) === JSON.stringify({ google: "g" }));
check("valid 32-hex key accepted", set.rondvaIndexNowKey() === key);
check("short key rejected", load({ key: "abc" }).rondvaIndexNowKey() === null);
check("sameAs includes real profile, drops empty ones", set.organizationLd().sameAs.length === 2);
check("JSON-LD is valid JSON", !!JSON.parse(set.jsonLdString([set.organizationLd()])));

const layout = read("src/app/(rondva)/layout.tsx");
check("layout adds verification only conditionally", /rondvaVerification\(\) \? \{ verification/.test(layout));
const route = read("src/app/(rondva)/rondva/[indexnow]/route.ts");
check("IndexNow route 404s without matching key", /status: 404/.test(route) && /rondvaIndexNowKey\(\)/.test(route));
check("IndexNow route lives under (rondva) only", fs.existsSync(path.join(root, "src/app/(rondva)/rondva/[indexnow]/route.ts")) && !fs.existsSync(path.join(root, "src/app/(main)/[indexnow]")));
const ping = read("scripts/rondva-indexnow-ping.mjs");
check("ping script: dry-run default, --send opt-in", /includes\("--send"\)/.test(ping) && /DRY RUN/.test(ping));
check("ping script not wired into build", !/indexnow/i.test(read("package.json")));
console.log(failed ? `\n${failed} FAILED` : "\nALL PASS");
process.exit(failed ? 1 : 0);
