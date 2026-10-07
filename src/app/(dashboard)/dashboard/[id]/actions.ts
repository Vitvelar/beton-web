"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canUseBetonDrive } from "@/lib/beton-drive";
import { snapshotToken } from "@/lib/report/snapshot-token";
import { getDashboardLocale, getRequestBrand } from "@/lib/request-brand";
import { dashboardCopy, localeForBrand, USER_LOCALE_KEY, type DashboardCopy } from "@/lib/i18n/dashboard";

export async function updateObservation(
  obsId: string,
  data: {
    title?: string;
    description?: string;
    suggestion?: string;
    severity?: string;
    category?: string;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("observations")
    .update(data)
    .eq("id", obsId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// Villutextar á tungumáli stjórnborðsins (sama val og síðurnar, getDashboardLocale).
async function actionCopy() {
  return dashboardCopy(await getDashboardLocale());
}

// Skýrslugerð með AI fer um edge-fallið generate-report — sömu leið og appið. Þar eru
// fyrirtæki, tungumál og matskerfi skoðunarinnar, skýrsluinneign og PDF-biðröð á einum
// stað. Beton-promptið þar er bæti fyrir bæti það sem vefurinn notaði áður (ákvörðun
// eiganda 2026-09-27; gamla vef-promptið skrifaði „Beton ehf." í skýrslur annarra).
export async function generateReport(inspectionId: string) {
  const copy = await actionCopy();
  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke("generate-report", {
    body: { inspection_id: inspectionId },
  });
  if (error) {
    const code = await edgeErrorCode(error);
    console.error("generate-report failed:", code ?? error.message);
    return { error: edgeErrorText(copy, code) };
  }

  revalidatePath(`/dashboard/${inspectionId}`);
  revalidatePath("/dashboard");
  return {
    status: "success" as const,
    ai_summary: (data as { ai_summary?: string } | null)?.ai_summary ?? "",
  };
}

// error_code úr svari edge-fallsins (FunctionsHttpError.context er Response-ið).
async function edgeErrorCode(error: unknown): Promise<string | null> {
  const context = (error as { context?: unknown } | null)?.context;
  if (!(context instanceof Response)) return null;
  try {
    const body = (await context.clone().json()) as { error_code?: unknown };
    return typeof body.error_code === "string" ? body.error_code : null;
  } catch {
    return null;
  }
}

// Villukóðar generate-report → texti á máli stjórnborðsins.
function edgeErrorText(copy: DashboardCopy, code: string | null): string {
  const t = copy.actions;
  switch (code) {
    case "unauthenticated": return t.signInToGenerate;
    case "not_found": return t.inspectionNotFound;
    case "no_observations": return t.noObservations;
    case "no_credits": return copy.credits.no_credits;
    case "additional_credit_confirmation_required": return copy.credits.additional_credit_confirmation_required;
    case "generation_in_progress": return copy.credits.in_progress;
    case "company_not_active": return copy.credits.not_active;
    case "credit_check_unavailable": return copy.credits.ledger_unavailable;
    case "offer_daily_limit": return copy.credits.offer_daily_limit;
    default: return t.generateFailed;
  }
}

// ── Handvirk textabreyting á skýrslu (án AI) ──
//
// PDF-ið renderast úr inspections.ai_report_data snapshot-inu, svo breytingar á
// observations-töflunni einar og sér ná ALDREI inn í PDF nema Claude sé keyrt
// aftur ("Endurgera skýrslu" = ný AI-umferð, kostnaður + textinn umskrifast).
// Þessi aðgerð leyfir að lagfæra textann beint: hún uppfærir snapshot-ið,
// speglar athugasemdatexta í observations-töfluna (svo appið/ritillinn sýni það
// sama) og setur PDF-render í biðröð ÁN þess að snerta AI.

export interface ReportTextEdit {
  introduction: string;
  property_description: string;
  conclusion: string;
  observations: Array<{ id: string; description: string; suggestion: string }>;
}

interface AiReportSnapshot {
  ai_summary: {
    introduction: string;
    property_description: string;
    conclusion: string;
  };
  rooms: Array<{
    observations: Array<{
      id: string;
      description: string;
      suggestion: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export async function updateReportText(
  inspectionId: string,
  edit: ReportTextEdit,
  regeneratePdf: boolean,
  expectedToken: string
) {
  const t = (await actionCopy()).actions;
  const supabase = await createClient();

  const { data: inspection, error: fetchError } = await supabase
    .from("inspections")
    .select("id, status, report_error, ai_report_data")
    .eq("id", inspectionId)
    .maybeSingle();

  if (fetchError || !inspection) {
    return { error: fetchError?.message ?? t.inspectionNotFound };
  }
  if (!inspection.ai_report_data) {
    return { error: t.noAiReport };
  }

  // Árekstravörn: ef snapshot-ið breyttist eftir að ritillinn var opnaður
  // (ný AI-skýrslugerð, vistun úr öðrum flipa) má þessi vistun EKKI yfirskrifa
  // nýrri textann með gömlu ritil-ástandi.
  if (snapshotToken(inspection.ai_report_data) !== expectedToken) {
    return {
      error: t.textChangedElsewhere,
    };
  }

  // Til að geta bakkað status-breytingunni ef biðraðarinnsetning klikkar —
  // annars hangir skoðunin í 'rendering_pdf' án þess að nokkurt starf sé til.
  let statusChanged = false;
  // Satt þegar tryggt er að FERSKT starf (eða óhafið 'queued' starf) rendrar
  // nýja textann — annars fær notandinn heiðarlega viðvörun í stað loforðs.
  let queuedFresh = false;
  // Token af VISTAÐA snapshot-inu (RETURNING á update-inu, atómískt með skrifinu).
  // Skilað líka með villu eftir committað skrif svo ritillinn festist ekki í
  // röngum "breytt annars staðar" villum eftir eigin vistun.
  let committedToken: string | null = null;

  const snapshot = inspection.ai_report_data as AiReportSnapshot;
  const editById = new Map(edit.observations.map((o) => [o.id, o] as const));

  try {
    // 1) Spegla breyttan athugasemdatexta í observations-töfluna — AÐEINS reiti
    //    sem notandinn breytti í raun (diff gegn snapshot-inu reit fyrir reit),
    //    svo vistun hér afturkalli aldrei nýrri breytingar sem gerðar voru beint
    //    á töfluna (ObservationForm / appið). Tómur strengur er leyfður (eyðir
    //    tillögu) — ólíkt ObservationForm sem sleppir tómum.
    //    Röðin skiptir máli: speglun Á UNDAN snapshot-uppfærslu — ef hluti
    //    speglunar klikkar er snapshot-ið ósnert og endurreynd vistun ber saman
    //    við sama grunn og keyrir speglunina aftur (idempotent, nær samræmi).
    for (const room of snapshot.rooms ?? []) {
      for (const obs of room.observations ?? []) {
        const e = editById.get(obs.id);
        if (!e) continue;
        const changed: { description?: string; suggestion?: string } = {};
        // ?? "" báðum megin: ritillinn normaliserar null → "" við opnun, svo
        // ósnertur legacy-null reitur má ekki teljast breyting (myndi annars
        // spegla "" yfir nýrri texta í töflunni).
        if (e.description !== (obs.description ?? "")) changed.description = e.description;
        if (e.suggestion !== (obs.suggestion ?? "")) changed.suggestion = e.suggestion;
        if (Object.keys(changed).length === 0) continue;
        const { error } = await supabase
          .from("observations")
          .update({ ...changed, updated_at: new Date().toISOString() })
          .eq("id", obs.id);
        if (error)
          throw new Error(t.observationUpdateFailed(error.message));
      }
    }

    // 2) Uppfæra snapshot-ið sjálft (það sem PDF-ið renderast úr).
    const patched: AiReportSnapshot = {
      ...snapshot,
      ai_summary: {
        introduction: edit.introduction,
        property_description: edit.property_description,
        conclusion: edit.conclusion,
      },
      rooms: (snapshot.rooms ?? []).map((room) => ({
        ...room,
        observations: (room.observations ?? []).map((obs) => {
          const e = editById.get(obs.id);
          return e
            ? { ...obs, description: e.description, suggestion: e.suggestion }
            : obs;
        }),
      })),
    };

    // RETURNING (.select() á update-inu) er atómískt með skrifinu: token-ið er
    // reiknað af jsonb-gildinu eins og grunnurinn geymdi ÞAÐ SEM VIÐ SKRIFUÐUM —
    // sér-fetch á eftir gæti hasha snapshot annars skrifara (t.d. AI-keyrslu sem
    // klárar í retry-biðinni) og þá myndi token-vörnin hleypa næstu vistun yfir
    // ferskan texta.
    const { data: saved, error: inspErr } = await supabase
      .from("inspections")
      .update({
        ai_report_data: patched,
        ai_summary: firstSentence(edit.conclusion),
        updated_at: new Date().toISOString(),
        ...(regeneratePdf
          ? { status: "rendering_pdf", report_error: null }
          : {}),
      })
      .eq("id", inspectionId)
      .select("ai_report_data")
      .maybeSingle();
    if (inspErr)
      throw new Error(t.reportUpdateFailed(inspErr.message));
    if (saved?.ai_report_data) {
      committedToken = snapshotToken(saved.ai_report_data);
    }
    statusChanged = regeneratePdf;

    // 3) Setja PDF-render í biðröð. 23505 = virkt starf þegar til. Það er AÐEINS
    //    í lagi ef starfið er enn 'queued' (worker les snapshot-ið þegar hann
    //    byrjar) — 'running' starf gæti þegar hafa sótt skýrslusíðuna með GAMLA
    //    textanum og myndi þá vista úrelt PDF sem "nýtt". Því bíðum við stutt og
    //    reynum aftur ef starf er í keyrslu; takist það ekki skilum við
    //    queued:false svo ritillinn segi satt í stað þess að lofa fersku PDF-i.
    if (regeneratePdf) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      for (let attempt = 0; attempt < 4 && !queuedFresh; attempt++) {
        const { error: jobErr } = await supabase
          .from("report_jobs")
          .insert({ inspection_id: inspectionId, requested_by: user?.id ?? null });
        if (!jobErr) {
          queuedFresh = true;
          break;
        }
        if (jobErr.code !== "23505")
          throw new Error(t.queueFailed(jobErr.message));
        const { data: active, error: activeErr } = await supabase
          .from("report_jobs")
          .select("status")
          .eq("inspection_id", inspectionId)
          .in("status", ["queued", "running"])
          .limit(1)
          .maybeSingle();
        if (!activeErr && active?.status === "queued") {
          // Óhafið starf í biðröð rendrar nýja snapshot-ið þegar það er tekið.
          queuedFresh = true;
          break;
        }
        // 'running' (eða óviss staða vegna select-villu): bíða aðeins, starfið
        // gæti klárað; þá kemst nýtt starf að í næstu tilraun. (!active án villu
        // = kláraðist rétt í þessu → reynum insert strax aftur.) Stutt bið og
        // sleppt í síðustu umferð: server-aðgerðin má ekki nálgast tímamörk
        // Vercel-falla.
        if ((activeErr || active?.status === "running") && attempt < 3) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }
  } catch (e: unknown) {
    console.error("updateReportText error:", e);
    if (statusChanged) {
      const { error: rbErr } = await supabase
        .from("inspections")
        .update({
          status: inspection.status,
          report_error: inspection.report_error,
          updated_at: new Date().toISOString(),
        })
        .eq("id", inspectionId);
      if (rbErr)
        console.error("updateReportText status rollback failed:", rbErr.message);
    }
    const msg = e instanceof Error ? e.message : t.unknownError;
    // committedToken fylgir með ef snapshot-skrifið var komið í gegn (villan
    // varð t.d. í biðraðarinnsetningu) — annars situr ritillinn með úrelt token
    // og hver einasta endurvistun stoppar á villandi "breytt annars staðar".
    return { error: msg, token: committedToken ?? undefined };
  }

  revalidatePath(`/dashboard/${inspectionId}`);
  revalidatePath(`/dashboard/${inspectionId}/report`);
  revalidatePath(`/dashboard/${inspectionId}/report/edit`);
  return {
    success: true as const,
    queued: queuedFresh,
    token: committedToken ?? expectedToken,
  };
}

// Cookie-auth and owner RLS apply to this status read, just like the editor.
export async function getReportProgress(inspectionId: string): Promise<import("@/lib/report/progress").ReportProgressResult> {
  const brand = await getRequestBrand();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Kannað á ~4 s fresti: tungumálið lesið af notandanum sem þegar var sóttur (ekkert aukakall).
  const t = dashboardCopy(localeForBrand(brand, user?.user_metadata?.[USER_LOCALE_KEY])).actions;
  if (!user) return { state: "error", detail: t.signInAgain };
  const { data, error } = await supabase.from("inspections")
    .select("status, report_url, report_error").eq("id", inspectionId).maybeSingle();
  if (error) throw new Error(t.statusFetchFailed);
  if (!data) return { state: "error", detail: t.inspectionGone };
  if (data.status === "report_ready" && data.report_url) return { state: "ready" };
  if (data.status === "error") return { state: "error", detail: data.report_error || t.reportFailed };
  if (data.status === "generating" || data.status === "rendering_pdf") return { state: "pending" };
  return { state: "error", detail: t.noPdfForStatus };
}

export async function sendToDrive(inspectionId: string) {
  const t = (await actionCopy()).actions;
  const supabase = await createClient();

  // upload-to-drive skrifar í sameiginlega Drive-möppu Beton ehf. með service
  // account. Aðeins gamli netfangalistinn má nota það — fyrirtækjaaðgangar
  // (app.rondva.com) mega aldrei senda skýrslur viðskiptavina sinna þangað.
  // (COMPANY_ACCOUNTS_DESIGN.md §7.1; edge-fallið sjálft þarf sömu vörn.)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!(await canUseBetonDrive(supabase, user?.email))) {
    return { error: t.driveBetonOnly };
  }

  const { data: inspection } = await supabase
    .from("inspections")
    .select("report_url, address")
    .eq("id", inspectionId)
    .single();

  if (!inspection?.report_url) {
    return { error: t.noReportForDrive };
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("inspection-reports")
    .download(inspection.report_url);

  if (downloadError || !fileData) {
    return { error: t.reportDownloadFailed(downloadError?.message) };
  }

  const buffer = await fileData.arrayBuffer();
  const pdfBase64 = Buffer.from(buffer).toString("base64");

  const filename = `Astandsskodun - ${inspection.address}.pdf`;

  const { data, error } = await supabase.functions.invoke("upload-to-drive", {
    body: {
      inspection_id: inspectionId,
      filename,
      pdf_base64: pdfBase64,
      kind: "inspection",
      address: inspection.address,
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/${inspectionId}`);
  return data as {
    status: string;
    drive_file_id?: string;
    drive_view_url?: string;
    error?: string;
  };
}

// ── Helpers ──

function firstSentence(text: string): string {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return "";
  const m = trimmed.match(/^.+?[.!?](?=\s|$)/);
  return (m ? m[0] : trimmed).slice(0, 500);
}
