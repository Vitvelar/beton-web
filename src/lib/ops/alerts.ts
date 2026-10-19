import type { SupabaseClient } from "@supabase/supabase-js";
import { BRANDS } from "@/lib/brand";

// P6 viðvaranir (beton-app …_ops_alerts). Gagnagrunnurinn skrifar viðvaranir í biðröðina
// ops.alert_outbox (þrykkir, vaktari, edge generate-report, tick giveUp). Hér er:
//  - enqueueReportFailure: tick skráir uppgjöf (giveUp) í biðröðina. KASTAR ALDREI.
//  - drainOpsAlerts: /api/ops/alerts/drain sækir ósendar raðir, sendir með Resend og merkir.
// Enginn lykill í kóða: RESEND_API_KEY er þegar á Vercel (sama og tengiliðaform/biðlisti).
// Sendandi: rondva.com er staðfest lén í Resend (send.rondva.com er return-path þess).

export const OPS_ALERT_TO = process.env.OPS_ALERT_TO || BRANDS.rondva.contactEmail;
export const OPS_ALERT_FROM = process.env.OPS_ALERT_FROM || "Rondva Alerts <alerts@rondva.com>";
const DRAIN_BATCH = 10;

type Rpc = Pick<SupabaseClient, "rpc">;

export async function enqueueReportFailure(
  svc: Rpc,
  args: { inspectionId: string; jobId: string; stage: string; error: string }
): Promise<void> {
  try {
    const { error } = await svc.rpc("ops_alert_report_failure", {
      p_inspection_id: args.inspectionId,
      p_source: "worker",
      p_stage: args.stage,
      p_error: args.error.slice(0, 300),
      p_job_id: args.jobId,
    });
    if (error) console.error(`[ops-alert] enqueue mistókst job=${args.jobId}: ${error.message}`);
  } catch (e) {
    console.error(`[ops-alert] enqueue kastaði job=${args.jobId}:`, e);
  }
}

export type AlertMailer = {
  emails: {
    send: (
      msg: { from: string; to: string; replyTo?: string; subject: string; text: string },
      opts?: { idempotencyKey?: string }
    ) => Promise<{ data: unknown; error: { message?: string } | null }>;
  };
};

type ClaimedAlert = { id: number; kind: string; brand: string; subject: string; body: string; attempts: number };

export async function drainOpsAlerts(
  svc: Rpc,
  mailer: AlertMailer
): Promise<{ claimed: number; sent: number; failed: number; error?: string }> {
  const { data, error } = await svc.rpc("ops_alert_claim", { p_limit: DRAIN_BATCH });
  if (error) return { claimed: 0, sent: 0, failed: 0, error: error.message };
  const rows = (Array.isArray(data) ? data : []) as ClaimedAlert[];
  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    let ok = false;
    let reason: string | null = null;
    try {
      // Idempotency-lykill á röð: ef merking bregst eftir sendingu sendir Resend ekki aftur (24 klst.).
      const { error: sendErr } = await mailer.emails.send(
        {
          from: OPS_ALERT_FROM,
          to: OPS_ALERT_TO,
          replyTo: BRANDS.rondva.contactEmail,
          subject: row.subject,
          text: `${row.body}\n\n— Rondva ops alert #${row.id} (${row.kind}, ${row.brand})`,
        },
        { idempotencyKey: `ops-alert-${row.id}` }
      );
      if (sendErr) reason = sendErr.message ?? "resend error";
      else ok = true;
    } catch (e) {
      reason = e instanceof Error ? e.message : String(e);
    }
    const { error: markErr } = await svc.rpc("ops_alert_mark", {
      p_id: row.id,
      p_sent: ok,
      p_error: reason,
    });
    if (markErr) console.error(`[ops-alert] merking mistókst #${row.id}: ${markErr.message}`);
    if (ok) sent++;
    else {
      failed++;
      console.error(`[ops-alert] sending mistókst #${row.id}: ${reason}`);
    }
  }
  return { claimed: rows.length, sent, failed };
}
