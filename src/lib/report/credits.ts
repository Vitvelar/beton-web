import type { SupabaseClient } from "@supabase/supabase-js";
import { isAllowedEmail } from "@/lib/allowed-users";
import { createServiceClient } from "@/lib/supabase/service";

// Skýrsluinneign fyrir AI-leið vefsins (generateReport). Sama bókhald og edge-fallið
// generate-report (beton-app: supabase/migrations/20260925160000_report_credits.sql,
// docs/release/FREE_REPORTS.md): begin áður en Claude keyrir, finish þegar textinn er
// vistaður, abort ef keyrslan mistekst áður.
//
// REPORT_CREDITS_MODE (Vercel), sjálfgefið off:
//   off     — ekkert kallað.
//   shadow  — kallað og skráð, aldrei hafnað.
//   enforce — hafnað samkvæmt bókhaldinu.
// Undanþegnir (Beton ehf., Vitvélar) fara alltaf í gegn, líka ef bókhaldskallið bilar.
//
// AI-leið vefsins er AÐEINS fyrir undanþegna: promptið hér er harðkóðað á Beton/Braga
// (COMPANY_ACCOUNTS_DESIGN §7.6). Í enforce fá önnur fyrirtæki boð um að nota appið,
// þar til vefurinn kallar á edge-fallið í stað eigin Claude-kalls.

type CreditsMode = "off" | "shadow" | "enforce";

// Bókhaldskall má aldrei hanga: eftir 5 s telst það bilað (skuggahamur/undanþegnir halda áfram).
const RPC_TIMEOUT_MS = 5_000;

function creditsMode(): CreditsMode {
  const raw = (process.env.REPORT_CREDITS_MODE ?? "").trim().toLowerCase();
  if (raw === "shadow" || raw === "enforce") return raw;
  if (raw && raw !== "off") console.warn(`[credits] unrecognized REPORT_CREDITS_MODE "${raw}" → off`);
  return "off";
}

type BeginDecision = {
  allowed: boolean;
  exempt?: boolean;
  charge?: string;
  reason?: string;
  run_id?: string | null;
};

export type WebCreditGate = { ok: true; runId: string | null } | { ok: false; error: string };

const PASS: WebCreditGate = { ok: true, runId: null };

const DENIAL_TEXT: Record<string, string> = {
  no_credits: "Ókeypis AI-skýrslurnar eru búnar. Handvirkar breytingar og endurútflutningur eru áfram ókeypis.",
  additional_credit_confirmation_required:
    "Innifaldar AI-endurgerðir fyrir þessa skýrslu eru búnar. Þú getur áfram breytt textanum og flutt skýrsluna út.",
  in_progress: "Verið er að búa til skýrslu fyrir þessa skoðun.",
};

async function isExemptFallback(supabase: SupabaseClient, email: string | null): Promise<boolean> {
  if (isAllowedEmail(email)) return true;
  try {
    const { data } = await supabase
      .from("companies")
      .select("billing_exempt, entitlement")
      .limit(1)
      .abortSignal(AbortSignal.timeout(RPC_TIMEOUT_MS))
      .maybeSingle();
    return !!data && (data.billing_exempt === true || data.entitlement === "partner" || data.entitlement === "internal");
  } catch {
    return false;
  }
}

async function releaseRun(runId: string | null | undefined): Promise<void> {
  if (!runId) return;
  try {
    const { error } = await createServiceClient()
      .rpc("abort_ai_report_run", { p_run_id: runId })
      .abortSignal(AbortSignal.timeout(RPC_TIMEOUT_MS));
    if (error) console.error("[credits] abort_ai_report_run failed:", error);
  } catch (e) {
    console.error("[credits] abort_ai_report_run threw:", e);
  }
}

export async function beginWebCreditRun(opts: {
  supabase: SupabaseClient;
  userId: string | null;
  email: string | null;
  inspectionId: string;
}): Promise<WebCreditGate> {
  const mode = creditsMode();
  if (mode === "off") return PASS;

  let decision: BeginDecision;
  try {
    if (!opts.userId) throw new Error("no authenticated user");
    const { data, error } = await createServiceClient().rpc("begin_ai_report_run", {
      p_user_id: opts.userId,
      p_inspection_id: opts.inspectionId,
      p_path: "web",
      p_confirm_additional: false,
    }).abortSignal(AbortSignal.timeout(RPC_TIMEOUT_MS));
    if (error) throw error;
    if (!data || typeof data !== "object") throw new Error("begin_ai_report_run returned no decision");
    decision = data as BeginDecision;
  } catch (e) {
    console.error("[credits] begin_ai_report_run failed:", e);
    if (mode === "shadow") return PASS;
    if (await isExemptFallback(opts.supabase, opts.email)) return PASS;
    return { ok: false, error: "Ekki tókst að staðfesta skýrsluinneign. Reyndu aftur eftir smástund." };
  }

  console.log(JSON.stringify({
    tag: "report_credits", path: "web", mode, inspection_id: opts.inspectionId,
    allowed: decision.allowed, exempt: decision.exempt === true, charge: decision.charge ?? null,
    reason: decision.reason ?? null, run_id: decision.run_id ?? null,
  }));

  if (decision.exempt) return { ok: true, runId: decision.run_id ?? null };
  if (mode === "shadow") return { ok: true, runId: decision.allowed ? decision.run_id ?? null : null };
  if (decision.allowed) {
    // Fyrirtæki án undanþágu: vefpromptið er Beton-sértækt → appið.
    await releaseRun(decision.run_id);
    return { ok: false, error: "Notaðu Rondva-appið til að búa til AI-skýrslu fyrir þetta fyrirtæki." };
  }
  return {
    ok: false,
    error: DENIAL_TEXT[decision.reason ?? ""] ?? "Fyrirtækjaaðgangurinn er ekki virkur.",
  };
}

export async function finishWebCreditRun(runId: string | null, aiModel: string, aiCostUsd: number): Promise<void> {
  if (!runId) return;
  try {
    const { error } = await createServiceClient().rpc("finish_ai_report_run", {
      p_run_id: runId,
      p_ai_model: aiModel,
      p_ai_cost_usd: aiCostUsd,
    }).abortSignal(AbortSignal.timeout(RPC_TIMEOUT_MS));
    if (error) console.error("[credits] finish_ai_report_run failed:", error);
  } catch (e) {
    console.error("[credits] finish_ai_report_run threw:", e);
  }
}

export const abortWebCreditRun = releaseRun;
