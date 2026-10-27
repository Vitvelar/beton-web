import type { SupabaseClient } from "@supabase/supabase-js";

// Vaxtar- og stöðumælikvarðar Rondva. ALLAR tölur koma úr einu falli í gagnagrunninum,
// public.ops_growth_snapshot() (supabase-pending/20261027090000_ops_growth_snapshot.sql), svo
// stöðusíðan (/dashboard/stada) og stöðupósturinn (/api/ops/status-email) sýni sömu tölur.
// Þessi eining er aðeins fyrir þjón: hún tekur við service-role biðlara og ber enga leyndarmál.
// Viðvörunarmörkin og afleiddu hlutföllin eru líka hér, á einum stað.

/** Bounce-mörk (REKSTUR): ≥3 % af sendum póstum er viðvörun. */
export const BOUNCE_ALERT_PCT = 3;
/** Fyrri viðvörun (gul) við 2 %. */
export const BOUNCE_WARN_PCT = 2;
/** Lágmarksfjöldi sendra pósta áður en bounce-hlutfall segir nokkuð (1 af 1 = 100 % er hávaði). */
export const BOUNCE_MIN_SAMPLE = 20;
/** Birgðir leida (nýir leidar / nýir á dag) undir þessu = viðvörun. */
export const INVENTORY_ALERT_DAYS = 5;
/** …og undir þessu = alvarleg viðvörun. */
export const INVENTORY_CRITICAL_DAYS = 2;
/**
 * ai_cost_usd í report_ai_runs er ofmetið ~3x: kóðinn gerir ráð fyrir $15/$75 á milljón tókn
 * (inn/út), en raunverð líkansins er þriðjungur af því. „Áætlað" er því hrátt gildi / 3.
 * Ef verðið í edge-fallinu er leiðrétt þarf aðeins að breyta þessum fasta.
 */
export const AI_COST_OVERSTATEMENT = 3;

/** App Store Connect: greining fyrir Rondva (app 6817769506). Niðurhal er ekki í gagnagrunninum. */
export const APP_STORE_CONNECT_ANALYTICS_URL = "https://appstoreconnect.apple.com/analytics/app/d30/6817769506/overview";

export interface GrowthCountry {
  cc: string;
  leads_total: number;
  leads_new: number;
  contacted: number;
  replied: number;
  bounced: number;
  on_hold: number;
  excluded: number;
  signed_up: number;
  trial: number;
  paid: number;
  sent_24h: number;
  sent_7d: number;
  policy_mode: "off" | "draft" | "auto" | null;
  kill_switch: boolean | null;
  daily_new_cap: number | null;
  daily_cap: number | null;
  inventory_days: number | null;
  /** Nýir leidar sem búið er að auðga (ops_leads.enriched_at). */
  enriched_new: number;
  /** Leidar með hook sem hafa fengið póst / svarað (sjá athugasemd í SQL). */
  hook_contacted: number;
  hook_replied: number;
}

export interface GrowthSnapshot {
  generated_at: string;
  fx: Record<string, number>;
  kpi: {
    revenue_usd_total: number;
    revenue_usd_7d: number;
    revenue_usd_prev_7d: number;
    fx_missing: number;
    paying_companies: number;
    active_subscriptions: number;
    subscriptions_by_product: Record<string, number>;
    pack_purchases: number;
    pack_purchases_7d: number;
    customers: number;
    signups_7d: number;
    signups_prev_7d: number;
    trials_started_total: number;
    trials_started_7d: number;
    active_trials: number;
    ai_reports_7d: number;
    ai_reports_prev_7d: number;
    ai_reports_total: number;
  };
  internal: {
    companies: number;
    ai_reports_7d: number;
    ai_reports_total: number;
    ai_cost_raw_usd_30d_customer: number;
    ai_cost_raw_usd_30d_internal: number;
  };
  reports_weekly: { week: string; customer: number; internal: number }[];
  sends_daily: { date: string; total: number; by_country: Record<string, number> }[];
  outreach: {
    contacted: number;
    replied: number;
    bounced: number;
    new_leads: number;
    replies_7d: number;
    sent_7d: number;
    sent_24h: number;
    sent_with_hook_7d: number;
    hook_contacted: number;
    hook_replied: number;
    global_kill_switch: boolean | null;
    global_mode: string | null;
    global_daily_cap: number | null;
    suppressed: number;
  };
  countries: GrowthCountry[];
  narrative: { text: string; created_at: string } | null;
}

export type GrowthFetchResult =
  | { ok: true; snapshot: GrowthSnapshot }
  // Flutningurinn (supabase-pending/20261027090000_ops_growth_snapshot.sql) er ekki keyrður enn.
  | { ok: false; reason: "migration-pending" }
  | { ok: false; reason: "error"; message: string };

/** Sækir snapshot með service-role biðlara. Kastar aldrei; skilar lýsandi niðurstöðu. */
export async function fetchGrowthSnapshot(svc: Pick<SupabaseClient, "rpc">): Promise<GrowthFetchResult> {
  try {
    const { data, error } = await svc.rpc("ops_growth_snapshot");
    if (error) {
      // 42883/PGRST202 = fallið er ekki til; 42703 = dálkurinn companies.is_test vantar.
      if (error.code === "PGRST202" || error.code === "42883" || error.code === "42703") {
        return { ok: false, reason: "migration-pending" };
      }
      return { ok: false, reason: "error", message: error.message };
    }
    if (!data || typeof data !== "object") return { ok: false, reason: "error", message: "empty snapshot" };
    return { ok: true, snapshot: normalizeSnapshot(data as Partial<GrowthSnapshot>) };
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) };
  }
}

// jsonb_agg skilar null yfir tóma runu; gerum listana alltaf að listum.
function normalizeSnapshot(raw: Partial<GrowthSnapshot>): GrowthSnapshot {
  return {
    ...(raw as GrowthSnapshot),
    reports_weekly: raw.reports_weekly ?? [],
    sends_daily: raw.sends_daily ?? [],
    countries: raw.countries ?? [],
    narrative: raw.narrative ?? null,
  };
}

// ───────────────────────── Afleidd gildi ─────────────────────────

export function pct(part: number, whole: number): number | null {
  return whole > 0 ? (part / whole) * 100 : null;
}

export function estimatedAiCostUsd(rawUsd: number): number {
  return rawUsd / AI_COST_OVERSTATEMENT;
}

export interface FunnelStage {
  key: "leads" | "emailed" | "replied" | "signed_up" | "trial" | "paid";
  count: number;
}

export function funnelFor(c: Pick<GrowthCountry, "leads_total" | "contacted" | "replied" | "signed_up" | "trial" | "paid">): FunnelStage[] {
  return [
    { key: "leads", count: c.leads_total },
    { key: "emailed", count: c.contacted },
    { key: "replied", count: c.replied },
    { key: "signed_up", count: c.signed_up },
    { key: "trial", count: c.trial },
    { key: "paid", count: c.paid },
  ];
}

/** Samtala allra landa sem eitt „land" (fyrir „Samtals"-trektina). */
export function totalCountry(countries: GrowthCountry[]): GrowthCountry {
  const sum = (f: (c: GrowthCountry) => number) => countries.reduce((a, c) => a + f(c), 0);
  return {
    cc: "ALL",
    leads_total: sum((c) => c.leads_total),
    leads_new: sum((c) => c.leads_new),
    contacted: sum((c) => c.contacted),
    replied: sum((c) => c.replied),
    bounced: sum((c) => c.bounced),
    on_hold: sum((c) => c.on_hold),
    excluded: sum((c) => c.excluded),
    signed_up: sum((c) => c.signed_up),
    trial: sum((c) => c.trial),
    paid: sum((c) => c.paid),
    sent_24h: sum((c) => c.sent_24h),
    sent_7d: sum((c) => c.sent_7d),
    policy_mode: null,
    kill_switch: null,
    daily_new_cap: null,
    daily_cap: null,
    inventory_days: null,
    enriched_new: sum((c) => c.enriched_new),
    hook_contacted: sum((c) => c.hook_contacted),
    hook_replied: sum((c) => c.hook_replied),
  };
}

/** Hlutfall nýrra leida sem er búið að auðga (enriched_at). */
export function enrichmentPct(snapshot: GrowthSnapshot): number | null {
  const total = snapshot.countries.reduce((a, c) => a + c.leads_new, 0);
  const done = snapshot.countries.reduce((a, c) => a + c.enriched_new, 0);
  return pct(done, total);
}

/** Svarhlutfall leida með hook á móti leidum án hook. null = ekkert úrtak í hópnum. */
export function hookComparison(o: GrowthSnapshot["outreach"]): {
  withHook: { contacted: number; replied: number; rate: number | null };
  withoutHook: { contacted: number; replied: number; rate: number | null };
} {
  const wc = o.hook_contacted;
  const wr = o.hook_replied;
  const nc = Math.max(0, o.contacted - wc);
  const nr = Math.max(0, o.replied - wr);
  return { withHook: { contacted: wc, replied: wr, rate: pct(wr, wc) }, withoutHook: { contacted: nc, replied: nr, rate: pct(nr, nc) } };
}

// ───────────────────────── Viðvaranir ─────────────────────────

export type GrowthAlertKind =
  | "bounce"
  | "bounce_country"
  | "inventory"
  | "kill_switch"
  | "fx_missing";

export interface GrowthAlert {
  kind: GrowthAlertKind;
  severity: "warn" | "danger";
  /** Land (ISO) þegar viðvörunin á við eitt land. */
  cc?: string;
  /** Gildi til að setja í texta (hlutfall, dagar eða fjöldi). */
  value?: number;
}

/** Sömu viðvaranir fyrir síðuna og póstinn. Texti er í i18n-skránni (síða) og póstinum (íslenska). */
export function computeAlerts(s: GrowthSnapshot): GrowthAlert[] {
  const alerts: GrowthAlert[] = [];

  const overall = pct(s.outreach.bounced, s.outreach.contacted);
  if (overall !== null && s.outreach.contacted >= BOUNCE_MIN_SAMPLE && overall >= BOUNCE_WARN_PCT) {
    alerts.push({ kind: "bounce", severity: overall >= BOUNCE_ALERT_PCT ? "danger" : "warn", value: overall });
  }
  for (const c of s.countries) {
    const r = pct(c.bounced, c.contacted);
    if (r !== null && c.contacted >= BOUNCE_MIN_SAMPLE && r >= BOUNCE_WARN_PCT) {
      alerts.push({ kind: "bounce_country", severity: r >= BOUNCE_ALERT_PCT ? "danger" : "warn", cc: c.cc, value: r });
    }
  }

  // Birgðir: aðeins lönd sem eru í gangi (mode ≠ off); land sem er slökkt á þarf ekki leida.
  for (const c of s.countries) {
    if (c.policy_mode && c.policy_mode !== "off" && c.inventory_days !== null && c.inventory_days < INVENTORY_ALERT_DAYS) {
      alerts.push({
        kind: "inventory",
        severity: c.inventory_days < INVENTORY_CRITICAL_DAYS ? "danger" : "warn",
        cc: c.cc,
        value: c.inventory_days,
      });
    }
  }

  if (s.outreach.global_kill_switch) alerts.push({ kind: "kill_switch", severity: "danger" });
  for (const c of s.countries) {
    if (c.kill_switch) alerts.push({ kind: "kill_switch", severity: "warn", cc: c.cc });
  }
  if (s.kpi.fx_missing > 0) alerts.push({ kind: "fx_missing", severity: "warn", value: s.kpi.fx_missing });

  // Alvarlegt fyrst.
  return alerts.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "danger" ? -1 : 1));
}

// ───────────────────────── Skjáheiti ─────────────────────────

const COUNTRY_NAMES: Record<string, { is: string; en: string }> = {
  NZ: { is: "Nýja-Sjáland", en: "New Zealand" },
  AU: { is: "Ástralía", en: "Australia" },
  GB: { is: "Bretland", en: "United Kingdom" },
  IE: { is: "Írland", en: "Ireland" },
  US: { is: "Bandaríkin", en: "United States" },
  CA: { is: "Kanada", en: "Canada" },
  IS: { is: "Ísland", en: "Iceland" },
};

export function countryName(cc: string, locale: "is" | "en"): string {
  return COUNTRY_NAMES[cc]?.[locale] ?? cc;
}

/** Heiti vöru (Apple product id) fyrir áskriftir. */
export function productLabel(productId: string): string {
  if (productId.endsWith("solo.monthly")) return "Solo";
  if (productId.endsWith("pro.monthly")) return "Pro";
  return productId.replace(/^com\.rondva\.app\./, "");
}
