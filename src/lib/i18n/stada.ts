import type { DashboardLocale } from "./dashboard";
export { fill, format } from "./format";

// Textar stöðusíðunnar /dashboard/stada (aðeins eigendur, sjá src/lib/ops/growth-access.ts).
// Sama lögun og dashboard-shell.ts: einn hlutur á tungumál, `en` krefst allra lykla `is`.
// Íslenska er aðalmálið; stöðupósturinn (src/lib/ops/status-email.ts) er alltaf á íslensku.

const is = {
  navLabel: "Staða",
  metaTitle: "Staða Rondva",
  backToList: "← Skoðanir",
  title: "Staða Rondva",
  updated: "Uppfært {time} (UTC)",
  subline: "Tekjur, prufur, skýrslur og sala á einum stað. Sömu tölur og í daglega póstinum.",
  migrationPending: {
    title: "Gagnagrunnsfallið vantar",
    body: "Stöðusíðan les public.ops_growth_snapshot() og dálkinn companies.is_test. Keyrðu flutninginn supabase-pending/20261027090000_ops_growth_snapshot.sql og endurhlaðaðu síðuna.",
  },
  loadError: "Ekki tókst að sækja stöðuna.",
  alerts: {
    title: "Viðvaranir",
    allClear: "Engar viðvaranir",
    bounce: "Bounce-hlutfall er {value}% (mörk 3%).",
    bounceCountry: "{country}: bounce-hlutfall er {value}% (mörk 3%).",
    inventory: "{country}: aðeins {value} daga birgðir af nýjum leidum.",
    killSwitchGlobal: "Neyðarrofi (kill switch) er KVEIKTUR á öllum útsendingum.",
    killSwitchCountry: "{country}: neyðarrofi er kveiktur.",
    fxMissing: "{value} Apple-færslur eru í mynt án gengis; tekjur eru vanmetnar.",
  },
  kpi: {
    revenue: "Tekjur (USD)",
    revenueSub: "7 dagar · alls {total}",
    revenueNote: "Brúttó, Production-færslur, fast gengi. Fyrir Apple-þóknun.",
    paying: "Greiðandi fyrirtæki",
    payingSub: "{subs} virkar áskriftir · {packs} pakkar",
    trials: "Virkar prufur",
    trialsSub: "{started} byrjuðu á 7 dögum",
    signups: "Nýskráningar 7 d.",
    signupsSub: "{total} viðskiptavinir alls",
    reports: "AI-skýrslur 7 d.",
    reportsSub: "{total} alls",
    vsPrev: "{delta} frá fyrri viku",
  },
  funnel: {
    title: "Trekt eftir löndum",
    hint: "Hlutfall er af fyrra þrepi. Skráðir, prufur og greitt: aðeins raunverulegir viðskiptavinir (án prufureikninga).",
    total: "Samtals",
    leads: "Leidar",
    emailed: "Póstur sendur",
    replied: "Svöruðu",
    signedUp: "Skráðir",
    trial: "Prufa",
    paid: "Greitt",
    new: "{count} nýir í birgðum",
  },
  sends: {
    title: "Útsendir póstar á dag",
    sub: "Síðustu 30 dagar · {total} alls · {week} síðustu 7 dagar",
    cap: "Dagsþak allra flokka: {cap}",
    replyRate: "Svarhlutfall",
    bounceRate: "Bounce-hlutfall",
    bounceLimit: "mörk 3%",
    sampleSmall: "(úrtak < {min})",
    hookTitle: "Svarhlutfall: með og án sérsniðinnar upphafslínu",
    withHook: "Með hook",
    withoutHook: "Án hook",
    hookSent7: "{count} sendingar með hook síðustu 7 daga",
    hookNone: "Engir leidar með hook hafa fengið póst enn.",
  },
  reports: {
    title: "AI-skýrslur á viku",
    sub: "Síðustu 8 vikur · vika hefst á mánudegi (UTC)",
    customer: "Viðskiptavinir",
    internal: "Innra (prufur, Vitvélar, Beton)",
    costEstimate: "Áætlaður AI-kostnaður 30 d.: {cost} (viðskiptavinir) · {internal} (innra)",
    costNote: "Áætlað = skráður kostnaður ÷ 3 (skráða gildið er ofmetið ~3x).",
  },
  inventory: {
    title: "Birgðir leida",
    sub: "Nýir leidar ÷ dagsþak nýrra viðtakenda",
    days: "{value} d.",
    off: "slökkt",
    capNew: "{cap} nýir á dag",
    sent24: "{count} sendir síðasta sólarhring",
    enriched: "{pct}% nýrra leida auðgaðir",
    mode: { off: "Slökkt", draft: "Drög", auto: "Sjálfvirkt" },
    killSwitch: "Neyðarrofi",
  },
  narrative: {
    title: "Vaxtar-agentinn segir",
    from: "Frá {time}",
  },
  internal: {
    title: "Innri notkun",
    body: "{companies} innri/prufufyrirtæki · {week} skýrslur síðustu 7 daga · {total} alls. Ekki talið með í viðskiptavinatölum.",
  },
  downloads: {
    title: "Niðurhal appsins",
    body: "Niðurhal er ekki í gagnagrunninum. Skoðaðu App Store Connect fyrir niðurhal, birtingar og viðskiptahlutfall.",
    link: "Opna App Store Connect greiningu",
  },
  chart: {
    noData: "Engin gögn ennþá",
  },
};

export type StadaCopy = typeof is;

const en: StadaCopy = {
  navLabel: "Status",
  metaTitle: "Rondva status",
  backToList: "← Inspections",
  title: "Rondva status",
  updated: "Updated {time} (UTC)",
  subline: "Revenue, trials, reports and sales in one place. The same numbers as the daily email.",
  migrationPending: {
    title: "Database function missing",
    body: "This page reads public.ops_growth_snapshot() and the companies.is_test column. Apply supabase-pending/20261027090000_ops_growth_snapshot.sql and reload.",
  },
  loadError: "Could not load the status.",
  alerts: {
    title: "Alerts",
    allClear: "No alerts",
    bounce: "Bounce rate is {value}% (threshold 3%).",
    bounceCountry: "{country}: bounce rate is {value}% (threshold 3%).",
    inventory: "{country}: only {value} days of new leads left.",
    killSwitchGlobal: "The kill switch is ON for all outbound sending.",
    killSwitchCountry: "{country}: kill switch is on.",
    fxMissing: "{value} Apple transactions are in a currency without a rate; revenue is understated.",
  },
  kpi: {
    revenue: "Revenue (USD)",
    revenueSub: "7 days · {total} total",
    revenueNote: "Gross, Production transactions, fixed rates. Before Apple's commission.",
    paying: "Paying companies",
    payingSub: "{subs} active subscriptions · {packs} packs",
    trials: "Active trials",
    trialsSub: "{started} started in 7 days",
    signups: "Signups, 7 d.",
    signupsSub: "{total} customers in total",
    reports: "AI reports, 7 d.",
    reportsSub: "{total} in total",
    vsPrev: "{delta} vs previous week",
  },
  funnel: {
    title: "Funnel by country",
    hint: "Percentages are of the previous step. Signed up, trial and paid count real customers only (no test accounts).",
    total: "Total",
    leads: "Leads",
    emailed: "Emailed",
    replied: "Replied",
    signedUp: "Signed up",
    trial: "Trial",
    paid: "Paid",
    new: "{count} new in inventory",
  },
  sends: {
    title: "Emails sent per day",
    sub: "Last 30 days · {total} total · {week} in the last 7 days",
    cap: "Daily cap across all agents: {cap}",
    replyRate: "Reply rate",
    bounceRate: "Bounce rate",
    bounceLimit: "threshold 3%",
    sampleSmall: "(sample < {min})",
    hookTitle: "Reply rate: with vs without a personalised opener",
    withHook: "With hook",
    withoutHook: "Without hook",
    hookSent7: "{count} sends with a hook in the last 7 days",
    hookNone: "No leads with a hook have been emailed yet.",
  },
  reports: {
    title: "AI reports per week",
    sub: "Last 8 weeks · weeks start on Monday (UTC)",
    customer: "Customers",
    internal: "Internal (test, Vitvélar, Beton)",
    costEstimate: "Estimated AI cost, 30 d.: {cost} (customers) · {internal} (internal)",
    costNote: "Estimated = recorded cost ÷ 3 (the recorded value is overstated ~3x).",
  },
  inventory: {
    title: "Lead inventory",
    sub: "New leads ÷ daily new-recipient cap",
    days: "{value} d.",
    off: "off",
    capNew: "{cap} new per day",
    sent24: "{count} sent in the last 24 h",
    enriched: "{pct}% of new leads enriched",
    mode: { off: "Off", draft: "Draft", auto: "Auto" },
    killSwitch: "Kill switch",
  },
  narrative: {
    title: "Growth agent says",
    from: "From {time}",
  },
  internal: {
    title: "Internal usage",
    body: "{companies} internal/test companies · {week} reports in the last 7 days · {total} in total. Not counted in customer numbers.",
  },
  downloads: {
    title: "App downloads",
    body: "Downloads are not in the database. See App Store Connect for downloads, impressions and conversion.",
    link: "Open App Store Connect analytics",
  },
  chart: {
    noData: "No data yet",
  },
};

export const STADA_COPY: Readonly<Record<DashboardLocale, StadaCopy>> = { is, en };

export function stadaCopy(locale: DashboardLocale): StadaCopy {
  return STADA_COPY[locale] ?? is;
}
