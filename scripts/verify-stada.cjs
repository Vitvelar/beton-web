// Staðfestir stöðusíðu + daglegan stöðupóst (static, eins og verify-ops-alerts.cjs):
// aðgangur, Beton-haus óbreyttur, cron-slóð, póstur án mynda/JS, SQL-fall læst á service_role.
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
let failed = 0;
function check(name, ok) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
  if (!ok) failed++;
}

const access = read("src/lib/ops/growth-access.ts");
check("growth admins = Vitvélar eigendur, ekki Bragi", /hjalti@vitvelar\.is/.test(access) && !/GROWTH_ADMIN_EMAILS = \[[^\]]*beton@beton\.is/.test(access));

const layout = read("src/app/(dashboard)/layout.tsx");
check('Staðutengill aðeins á Rondva-léni + eigendum', /showStatus=\{brand === "rondva" && isGrowthAdmin\(user\.email\)\}/.test(layout));
const header = read("src/components/dashboard/DashboardHeader.tsx");
check("showStatus sjálfgefið false (Beton-haus óbreyttur)", /showStatus = false/.test(header));

const page = read("src/app/(dashboard)/dashboard/stada/page.tsx");
check("síða: notFound() fyrir aðra en eigendur", /isGrowthAdmin\(user\?\.email\)\) notFound\(\)/.test(page));
check("síða les með service client úr ops_growth_snapshot", /createServiceClient\(\)/.test(page) && /fetchGrowthSnapshot/.test(page));

check("engin loading.tsx ofar en /report", !fs.existsSync(path.join(root, "src/app/(dashboard)/dashboard/loading.tsx")) && !fs.existsSync(path.join(root, "src/app/(dashboard)/dashboard/[id]/report/loading.tsx")));

const route = read("src/app/api/ops/status-email/route.ts");
check("route: CRON_SECRET eða worker token", /CRON_SECRET/.test(route) && /isWorkerRequest/.test(route));
check("route: preview krefst eiganda eða cron og sendir ekki", /preview/.test(route) && /isAdminSession/.test(route));
check("route: idempotency-lykill á dag", /status-email-\$\{day\}/.test(route));
check("route: skráir sendingu með ops_record_event (score/info/status-email)", /ops_record_event/.test(route) && /"status-email"/.test(route));

const vercel = JSON.parse(read("vercel.json"));
check("vercel.json cron á /api/ops/status-email 09:00 UTC", vercel.crons.some((c) => c.path === "/api/ops/status-email" && c.schedule === "0 9 * * *"));

const email = read("src/lib/ops/status-email.ts");
check("póstur: engar myndir, engin skripta", !/<img\b/i.test(email) && !/<script\b/i.test(email));
check("póstur: dökk-stilling + color-scheme", /prefers-color-scheme: dark/.test(email) && /name="color-scheme"/.test(email));

const sql = read("supabase-pending/20261027090000_ops_growth_snapshot.sql");
check("SQL: is_test idempotent", /add column if not exists is_test/.test(sql));
check("SQL: aðeins service_role", /revoke all on function public\.ops_growth_snapshot\(\) from public, anon, authenticated;/.test(sql) && /grant execute on function public\.ops_growth_snapshot\(\) to service_role;/.test(sql));
check("SQL: Production-færslur, ekki afturkallaðar", /environment = 'Production'/.test(sql) && /revocation_date is null/.test(sql));
check("SQL: narrative aðeins síðustu 24 klst.", /growth-daily' and e\.created_at >= now\(\) - interval '24 hours'/.test(sql));

const growth = read("src/lib/ops/growth.ts");
check("viðvörunarmörk: bounce 3 %, birgðir 5 d., kostnaður ÷ 3", /BOUNCE_ALERT_PCT = 3/.test(growth) && /INVENTORY_ALERT_DAYS = 5/.test(growth) && /AI_COST_OVERSTATEMENT = 3/.test(growth));

process.exit(failed ? 1 : 0);
