import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { WORKER_TOKEN_HEADER, isWorkerRequest } from "@/lib/report/shared";
import { OPS_ALERT_FROM } from "@/lib/ops/alerts";
import { fetchGrowthSnapshot } from "@/lib/ops/growth";
import { isGrowthAdmin } from "@/lib/ops/growth-access";
import { renderStatusEmail } from "@/lib/ops/status-email";

// Daglegur stöðupóstur Rondva (sömu tölur og /dashboard/stada). Vercel cron (vercel.json, 09:00 UTC)
// kallar með GET og `Authorization: Bearer $CRON_SECRET`; sama leið og aðrar ops-slóðir
// (x-report-worker-token = REPORT_WORKER_TOKEN) er líka leyfð til handvirkrar keyrslu.
//   GET                → sendir póstinn (aðeins cron/token)
//   GET ?preview=1     → skilar HTML án þess að senda; leyft fyrir innskráðan eiganda (growth-access.ts)
//                        eða cron/token
// Móttakandi: STATUS_EMAIL_TO (sjálfgefið hjalti@vitvelar.is). Sendandi: OPS_ALERT_FROM (sami og viðvaranir).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_TO = "hjalti@vitvelar.is";

// Samanburður í föstum tíma (sama aðferð og isWorkerRequest).
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function isCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get("authorization") ?? "";
    if (header.toLowerCase().startsWith("bearer ") && safeEqual(header.slice(7).trim(), secret)) return true;
  }
  return isWorkerRequest(request.headers.get(WORKER_TOKEN_HEADER));
}

async function isAdminSession(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return isGrowthAdmin(data.user?.email);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const preview = request.nextUrl.searchParams.get("preview") === "1";
  const cron = isCronRequest(request);

  if (!cron && !(preview && (await isAdminSession()))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const svc = createServiceClient();
  const result = await fetchGrowthSnapshot(svc);
  if (!result.ok) {
    const message = result.reason === "migration-pending" ? "ops_growth_snapshot vantar (flutningur ekki keyrður)" : result.message;
    console.error(`[status-email] snapshot mistókst: ${message}`);
    return NextResponse.json({ error: result.reason, message }, { status: 500 });
  }

  const email = renderStatusEmail(result.snapshot);

  if (preview) {
    return new NextResponse(email.html, {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[status-email] RESEND_API_KEY vantar — ekkert sent");
    return NextResponse.json({ error: "resend-not-configured" }, { status: 503 });
  }

  const to = process.env.STATUS_EMAIL_TO || DEFAULT_TO;
  const day = result.snapshot.generated_at.slice(0, 10);
  try {
    // Idempotency-lykill á dag: ef cron keyrir tvisvar sendir Resend ekki aftur (24 klst.).
    const { data, error } = await new Resend(apiKey).emails.send(
      { from: OPS_ALERT_FROM, to, subject: email.subject, html: email.html, text: email.text },
      { idempotencyKey: `status-email-${day}` }
    );
    if (error) {
      console.error(`[status-email] sending mistókst: ${error.message}`);
      return NextResponse.json({ error: "send-failed", message: error.message }, { status: 502 });
    }
    // Skráum sendinguna (score/info, template 'status-email'): vaxtar-routínan les þetta til að vita að
    // HTML-pósturinn er í gangi og hættir að senda eigin póst. Má ekki fella svarið ef skráning bregst.
    try {
      const { error: recErr } = await svc.rpc("ops_record_event", {
        p_agent: "score",
        p_event_type: "info",
        p_template: "status-email",
        p_payload: {},
      });
      if (recErr) console.error(`[status-email] skráning í ops_events mistókst: ${recErr.message}`);
    } catch (e) {
      console.error("[status-email] skráning í ops_events kastaði:", e);
    }
    return NextResponse.json({ sent: true, to, id: data?.id ?? null, subject: email.subject });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[status-email] sending kastaði: ${message}`);
    return NextResponse.json({ error: "send-failed", message }, { status: 502 });
  }
}
