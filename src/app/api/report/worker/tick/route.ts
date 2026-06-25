import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import { renderReportPdf } from "@/lib/report/render-pdf";
import {
  REPORT_BUCKET,
  WORKER_TOKEN_HEADER,
  isWorkerRequest,
  reportStoragePath,
} from "@/lib/report/shared";

// Background PDF render worker, in-process. Pinged by Supabase pg_cron (and any
// best-effort kick) — drains the report_jobs queue, rendering the canonical
// report HTML to PDF and storing it. Runs only on beton.is (Docker) where a real
// Chromium exists; on Vercel (no PUPPETEER_EXECUTABLE_PATH) it no-ops. Concurrency
// is safe via claim_next_report_job()'s FOR UPDATE SKIP LOCKED; the module flag
// just avoids piling drains within one instance.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// beton.is Docker ignores this (no serverless cap); keep generous for the drain.
export const maxDuration = 300;

const MAX_ATTEMPTS = 3;
const DRAIN_BUDGET_MS = 55_000;

let draining = false;

export async function POST(request: NextRequest) {
  if (!isWorkerRequest(request.headers.get(WORKER_TOKEN_HEADER))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.PUPPETEER_EXECUTABLE_PATH) {
    // No Chromium here (e.g. accidentally hit on Vercel) — do nothing.
    return NextResponse.json({ skipped: "no-chromium" }, { status: 503 });
  }
  if (draining) {
    return NextResponse.json({ skipped: "already-draining" }, { status: 200 });
  }

  draining = true;
  const results: Array<{ job: string; ok: boolean; error?: string }> = [];
  try {
    // Everything that can throw (incl. createServiceClient when the service key
    // is missing) lives INSIDE the try so `draining` is always reset in finally
    // — otherwise one early throw wedges this instance into "already-draining".
    const svc = createServiceClient();
    const deadline = Date.now() + DRAIN_BUDGET_MS;
    const workerId = `tick-${process.pid}`;
    while (Date.now() < deadline) {
      const { data, error } = await svc.rpc("claim_next_report_job", {
        worker_id: workerId,
      });
      if (error) {
        results.push({ job: "-", ok: false, error: error.message });
        break;
      }
      const job = Array.isArray(data) ? data[0] : data;
      if (!job) break; // queue empty
      const r = await processJob(svc, job);
      results.push({ job: job.id, ok: r.ok, error: r.error });
    }
    return NextResponse.json({ processed: results.length, results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e), processed: results.length },
      { status: 500 }
    );
  } finally {
    draining = false;
  }
}

type ReportJob = {
  id: string;
  inspection_id: string;
  attempts: number;
};

async function processJob(
  svc: SupabaseClient,
  job: ReportJob
): Promise<{ ok: boolean; error?: string }> {
  const inspectionId = job.inspection_id;
  try {
    const { data: insp, error: ie } = await svc
      .from("inspections")
      .select("id, inspector_id, address, inspection_date")
      .eq("id", inspectionId)
      .maybeSingle();
    if (ie) throw new Error(ie.message);
    if (!insp) throw new Error("Skoðun fannst ekki.");

    const base = (process.env.REPORT_RENDER_BASE_URL ?? "https://beton.is").replace(/\/$/, "");
    const reportUrl = `${base}/dashboard/${inspectionId}/report?pdf=1`;
    const pdf = await renderReportPdf(reportUrl, {
      extraHeaders: { [WORKER_TOKEN_HEADER]: process.env.REPORT_WORKER_TOKEN! },
    });

    const path = reportStoragePath({
      ownerId: insp.inspector_id ?? null,
      inspectionId,
      address: insp.address ?? null,
      date: insp.inspection_date ?? null,
    });

    const { error: ue } = await svc.storage
      .from(REPORT_BUCKET)
      .upload(path, pdf, { contentType: "application/pdf", upsert: true });
    if (ue) throw new Error(`Upphleðsla mistókst: ${ue.message}`);

    const { error: upInsp } = await svc
      .from("inspections")
      .update({
        status: "report_ready",
        report_url: path,
        report_error: null,
        report_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", inspectionId);
    if (upInsp) throw new Error(`Uppfærsla skoðunar mistókst: ${upInsp.message}`);

    await svc
      .from("report_jobs")
      .update({
        status: "succeeded",
        report_path: path,
        error: null,
        finished_at: new Date().toISOString(),
        locked_at: null,
      })
      .eq("id", job.id);

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const giveUp = (job.attempts ?? 0) >= MAX_ATTEMPTS;
    if (giveUp) {
      await svc
        .from("report_jobs")
        .update({
          status: "failed",
          error: msg,
          finished_at: new Date().toISOString(),
          locked_at: null,
        })
        .eq("id", job.id);
      await svc
        .from("inspections")
        .update({ status: "error", report_error: msg, updated_at: new Date().toISOString() })
        .eq("id", inspectionId);
    } else {
      // Re-queue for another pass.
      await svc
        .from("report_jobs")
        .update({ status: "queued", error: msg, locked_at: null, locked_by: null })
        .eq("id", job.id);
    }
    return { ok: false, error: msg };
  }
}
