import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/allowed-users";
import {
  createBearerClient,
  getBearerAuthorization,
} from "@/lib/supabase/bearer";
import {
  REPORT_BUCKET,
  isStorageObjectPath,
  reportDownloadName,
} from "@/lib/report/shared";

// FAST PATH. PDF rendering now happens in a background worker (see
// /api/report/worker/tick); this route no longer launches Chromium. It just
// resolves the stored PDF:
//   - report_url is a Storage object path  → 307 redirect to a signed URL that
//     downloads as "Beton Ástandsskoðun - <heimilisfang>, <dags>.pdf".
//   - render failed (status=error/report_error) → 500 with the message.
//   - still rendering (queued/rendering_pdf)    → 202 { status:"rendering_pdf" }.
//   - no server PDF yet (legacy/local-only)     → 404 (regenerate to enqueue).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGNED_TTL_SECONDS = 3600;
const PENDING_STATUSES = new Set(["queued", "generating", "rendering_pdf"]);

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  // Admin notar Supabase cookies + allowlist; appið sendir Bearer access token
  // og RLS sér um eignarhald.
  const bearerAuthorization = getBearerAuthorization(
    request.headers.get("authorization")
  );
  const supabase = bearerAuthorization
    ? createBearerClient(bearerAuthorization)
    : await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Óheimill aðgangur" }, { status: 401 });
  }
  if (!bearerAuthorization && !isAllowedEmail(user.email)) {
    return NextResponse.json({ error: "Óheimill aðgangur" }, { status: 401 });
  }

  let inspectionQuery = supabase
    .from("inspections")
    .select("id, address, inspection_date, status, report_url, report_error")
    .limit(1);
  inspectionQuery = bearerAuthorization
    ? inspectionQuery.or(`id.eq.${id},local_id.eq.${id}`)
    : inspectionQuery.eq("id", id);

  const { data: inspection } = await inspectionQuery.maybeSingle();
  if (!inspection) {
    return NextResponse.json({ error: "Skýrsla fannst ekki" }, { status: 404 });
  }

  // Tilbúið PDF í Storage → signa + redirecta með mannlegu skráarnafni.
  if (isStorageObjectPath(inspection.report_url)) {
    const download = reportDownloadName(
      inspection.address ?? null,
      inspection.inspection_date ?? null
    );
    const { data: signed, error: signErr } = await supabase.storage
      .from(REPORT_BUCKET)
      .createSignedUrl(inspection.report_url, SIGNED_TTL_SECONDS, { download });
    if (signErr || !signed?.signedUrl) {
      return NextResponse.json(
        { error: "Tókst ekki að búa til niðurhalsslóð." },
        { status: 500 }
      );
    }
    return NextResponse.redirect(signed.signedUrl, 307);
  }

  // Render mistókst.
  if (inspection.status === "error" || inspection.report_error) {
    return NextResponse.json(
      { status: "error", error: inspection.report_error ?? "PDF-gerð mistókst." },
      { status: 500 }
    );
  }

  // Enn í vinnslu.
  if (PENDING_STATUSES.has(inspection.status ?? "")) {
    return NextResponse.json({ status: "rendering_pdf" }, { status: 202 });
  }

  // Engin server-skýrsla til (t.d. eldri/staðbundin) — þarf að endurgera.
  return NextResponse.json(
    { status: "no_report", error: "Ekkert PDF í Storage — endurgerðu skýrsluna." },
    { status: 404 }
  );
}
