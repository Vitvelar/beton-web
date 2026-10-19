import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";
import { WORKER_TOKEN_HEADER, isWorkerRequest } from "@/lib/report/shared";
import { drainOpsAlerts } from "@/lib/ops/alerts";

// P6 viðvaranir: sendir ósendar raðir úr ops.alert_outbox á rondva@ með Resend.
// Kallað af pg_cron-verkinu ops-alerts-drain (aðeins þegar eitthvað bíður) með sama tóka og
// report-worker tick (x-report-worker-token, REPORT_WORKER_TOKEN). Ekkert notendaviðmót.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!isWorkerRequest(request.headers.get(WORKER_TOKEN_HEADER))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Engu er læst eða tilraun eytt: raðirnar bíða þar til lykillinn er til.
    console.error("[ops-alert] RESEND_API_KEY vantar — ekkert sent");
    return NextResponse.json({ error: "resend-not-configured" }, { status: 503 });
  }
  try {
    const result = await drainOpsAlerts(createServiceClient(), new Resend(apiKey));
    return NextResponse.json(result, { status: result.error ? 500 : 200 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
