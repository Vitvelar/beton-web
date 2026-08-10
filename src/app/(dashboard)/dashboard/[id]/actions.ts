"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { snapshotToken } from "@/lib/report/snapshot-token";
import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_MODEL = "claude-opus-4-8";
// Hækkað úr 4096: löng íslensk skýrsla með mörgum athugasemdum rúmaðist ekki
// og JSON-svarið slitnaði í miðju (olli "Expected ',' or '}' ..." villunni).
const CLAUDE_MAX_TOKENS = 16000;
// Opus-verð (USD/1M tókenar) — staðfesta gegn gildandi Anthropic verðskrá.
const PRICE_INPUT_PER_M = 15;
const PRICE_OUTPUT_PER_M = 75;
const PHOTO_BUCKET = "inspection-photos";
const PHOTO_URL_TTL_SECONDS = 10 * 60;
const MAX_PHOTOS_PER_OBS = 10;
const MAX_TOTAL_IMAGES = 100;
const CLAUDE_IMAGE_TRANSFORM = {
  width: 1600,
  height: 1600,
  resize: "contain" as const,
  quality: 75,
};

// Tól sem þvingar Claude til að skila skipulögðu, gildu JSON (structured output).
// Þetta kemur í veg fyrir að frítextasvar slitni/sé gallað og brjóti JSON.parse.
const REPORT_TOOL: Anthropic.Tool = {
  name: "skila_skyrslu",
  description:
    "Skilar fullunninni AI-samantekt fyrir ástandsskoðunarskýrslu: þrískiptan inngangstexta og snyrta lýsingu, tillögu og staðfestan alvarleika fyrir hverja athugasemd.",
  input_schema: {
    type: "object",
    properties: {
      introduction: { type: "string" },
      property_description: { type: "string" },
      conclusion: { type: "string" },
      observations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            severity: {
              type: "string",
              enum: ["athugasemd", "alvarleg", "mjog_alvarleg"],
            },
            polished_description: { type: "string" },
            polished_suggestion: { type: "string" },
          },
          required: [
            "id",
            "severity",
            "polished_description",
            "polished_suggestion",
          ],
        },
      },
    },
    required: [
      "introduction",
      "property_description",
      "conclusion",
      "observations",
    ],
  },
};

const VALID_SEVERITIES = new Set(["athugasemd", "alvarleg", "mjog_alvarleg"]);

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

export async function generateReport(inspectionId: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { error: "ANTHROPIC_API_KEY vantar í umhverfisbreytur." };
  }

  const supabase = await createClient();

  const { data: inspection, error: fetchError } = await supabase
    .from("inspections")
    .select(`
      id, inspector_id, address, postal_code, municipality, fastanumer,
      property_data, customer_name, inspection_date, weather, attendees, status,
      rooms (
        id, name, slug, sort_order, ratings, equipment, notes,
        observations (
          id, observation_number, category, title, description,
          suggestion, severity, sort_order,
          photos ( id, storage_path, photo_type, sort_order )
        )
      )
    `)
    .eq("id", inspectionId)
    .maybeSingle();

  if (fetchError || !inspection) {
    return { error: fetchError?.message ?? "Skoðun fannst ekki." };
  }

  const rooms = (inspection.rooms ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    sort_order: number;
    ratings: Record<string, string> | null;
    equipment: unknown[] | null;
    notes: string | null;
    observations: Array<{
      id: string;
      observation_number: string | null;
      category: string | null;
      title: string;
      description: string | null;
      suggestion: string | null;
      severity: string;
      sort_order: number;
      photos: Array<{
        id: string;
        storage_path: string | null;
        photo_type: string | null;
        sort_order: number;
      }> | null;
    }> | null;
  }>;

  const obsCount = rooms.reduce(
    (n, r) => n + (r.observations?.length ?? 0),
    0
  );
  if (obsCount === 0) {
    return {
      error: "Engar athugasemdir skráðar — ekki er hægt að búa til skýrslu.",
    };
  }

  await supabase
    .from("inspections")
    .update({ status: "generating", updated_at: new Date().toISOString() })
    .eq("id", inspectionId);

  const propertyData = (inspection.property_data ?? {}) as Record<
    string,
    unknown
  >;
  const lookupFailed = Object.keys(propertyData).length === 0;

  const sortedRooms = rooms.slice().sort((a, b) => a.sort_order - b.sort_order);

  // Eignar-/skoðunarsamhengi (notað bæði í hvatningu og í ai_report_data).
  const inspectionContext = {
    address: inspection.address,
    postal_code: inspection.postal_code,
    municipality: inspection.municipality ?? "",
    fastanumer: inspection.fastanumer ?? "",
    customer_name: inspection.customer_name,
    inspection_date: inspection.inspection_date,
    weather: inspection.weather ?? "",
    attendees: inspection.attendees ?? [],
    property_data: propertyData,
    lookup_failed: lookupFailed,
  };

  // Undirskrifa minnkaðar myndir hverrar athugasemdar svo Claude SJÁI þær.
  // Anthropic hafnar "many-image" beiðnum ef einhver mynd er yfir 2000px á hlið;
  // Supabase transform heldur upprunalegu myndinni óbreyttri en gefur Claude
  // öruggt 1600px afrit.
  const obsPhotoPaths: string[] = [];
  let queuedImages = 0;
  for (const r of sortedRooms) {
    for (const o of r.observations ?? []) {
      for (const p of (o.photos ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .slice(0, MAX_PHOTOS_PER_OBS)) {
        if (queuedImages >= MAX_TOTAL_IMAGES) break;
        if (p.storage_path) {
          obsPhotoPaths.push(p.storage_path);
          queuedImages++;
        }
      }
    }
  }
  const signedMap = new Map<string, string>();
  if (obsPhotoPaths.length > 0) {
    const signed = await Promise.all(
      obsPhotoPaths.map(async (path) => {
        const { data, error } = await supabase.storage
          .from(PHOTO_BUCKET)
          .createSignedUrl(path, PHOTO_URL_TTL_SECONDS, {
            transform: CLAUDE_IMAGE_TRANSFORM,
          });
        if (error || !data?.signedUrl) {
          console.error("Claude photo sign error:", { path, error });
          return null;
        }
        return { path, signedUrl: data.signedUrl };
      })
    );
    for (const s of signed) {
      if (s?.path && s.signedUrl) signedMap.set(s.path, s.signedUrl);
    }
  }

  // Byggja multimodal skilaboð: samhengi, svo hver athugasemd með sínum myndum.
  const roomContext = sortedRooms.map((r) => ({
    name: r.name,
    ratings: r.ratings ?? {},
    notes: r.notes ?? "",
  }));
  const content: Anthropic.ContentBlockParam[] = [
    {
      type: "text" as const,
      text:
        "Hér eru gögn skoðunarinnar. Eignar- og rýmissamhengi:\n\n" +
        JSON.stringify({ inspection: inspectionContext, rooms: roomContext }, null, 2) +
        "\n\nHér á eftir kemur hver athugasemd með sínum ljósmyndum. Notaðu það sem SÉST á myndunum ásamt samhenginu (rými, byggingarár, tegund eignar o.fl.) til að skrifa nákvæma faglega lýsingu og raunhæfa tillögu fyrir HVERJA athugasemd.",
    },
  ];
  // Anthropic leyfir takmarkaðan fjölda mynda per beiðni — verjum okkur fyrir
  // mjög stórum skoðunum með heildarþaki.
  let totalImages = 0;
  for (const r of sortedRooms) {
    for (const o of (r.observations ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)) {
      content.push({
        type: "text" as const,
        text:
          `\n── Athugasemd ${o.id}\nRými: ${r.name}\nFlokkur: ${o.category ?? ""}\n` +
          `Núverandi alvarleiki: ${o.severity}\nTitill: ${o.title}\n` +
          `Lýsing skoðunarmanns: ${o.description ?? "(engin)"}\n` +
          `Tillaga skoðunarmanns: ${o.suggestion ?? "(engin)"}`,
      });
      for (const p of (o.photos ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .slice(0, MAX_PHOTOS_PER_OBS)) {
        if (totalImages >= MAX_TOTAL_IMAGES) break;
        const url = p.storage_path ? signedMap.get(p.storage_path) : undefined;
        if (url) {
          content.push({ type: "image" as const, source: { type: "url" as const, url } });
          totalImages++;
        }
      }
    }
  }
  content.push({
    type: "text" as const,
    text: "Skilaðu nú niðurstöðunni fyrir ALLAR athugasemdir með því að kalla á tólið skila_skyrslu.",
  });

  let claudeResult;
  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      system: [
        {
          type: "text" as const,
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" as const },
        },
      ],
      tools: [REPORT_TOOL],
      // Þvingum Claude til að kalla á tólið → alltaf gilt, skipulagt JSON.
      tool_choice: { type: "tool", name: REPORT_TOOL.name },
      messages: [{ role: "user", content }],
    });

    if (response.stop_reason === "max_tokens") {
      throw new Error(
        "Svar varð of langt og slitnaði (max_tokens). Hækkaðu CLAUDE_MAX_TOKENS."
      );
    }

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    if (!toolUse) {
      throw new Error("Claude skilaði ekki skipulögðu svari (tool_use vantar).");
    }

    const inputTokens = response.usage?.input_tokens ?? 0;
    const outputTokens = response.usage?.output_tokens ?? 0;

    // toolUse.input er þegar parse-að af SDK-inu — engin frítexta-JSON greining.
    const parsed = validateReportOutput(toolUse.input);
    claudeResult = { output: parsed, inputTokens, outputTokens };
  } catch (e: unknown) {
    console.error("Claude error:", e);
    await supabase
      .from("inspections")
      .update({ status: "error", updated_at: new Date().toISOString() })
      .eq("id", inspectionId);
    const msg = e instanceof Error ? e.message : "Óþekkt villa";
    return { error: `Villa við gerð AI samantektar: ${msg}` };
  }

  const aiCostUsd = computeCostUsd(
    claudeResult.inputTokens,
    claudeResult.outputTokens
  );

  // Verja gegn ógildum alvarleika frá líkaninu (DB-dálkurinn er þvingaður).
  const origSeverityById = new Map<string, string>();
  for (const r of sortedRooms) {
    for (const o of r.observations ?? []) origSeverityById.set(o.id, o.severity);
  }
  const safeSeverity = (id: string, sev: unknown): string =>
    typeof sev === "string" && VALID_SEVERITIES.has(sev)
      ? sev
      : origSeverityById.get(id) ?? "athugasemd";

  const polishById = new Map(
    claudeResult.output.observations.map((p) => [p.id, p] as const)
  );

  const aiReportData = {
    inspection: inspectionContext,
    ai_summary: {
      introduction: claudeResult.output.introduction,
      property_description: claudeResult.output.property_description,
      conclusion: claudeResult.output.conclusion,
    },
    rooms: sortedRooms.map((room) => ({
      name: room.name,
      slug: room.slug,
      sort_order: room.sort_order,
      ratings: room.ratings ?? {},
      notes: room.notes ?? "",
      observations: (room.observations ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((o) => {
          const polish = polishById.get(o.id);
          return {
            id: o.id,
            number: o.observation_number,
            category: o.category ?? "",
            title: o.title,
            description:
              polish?.polished_description ?? o.description ?? "",
            suggestion:
              polish?.polished_suggestion ?? o.suggestion ?? "",
            severity: safeSeverity(o.id, polish?.severity),
          };
        }),
    })),
  };

  const aiSummary = firstSentence(claudeResult.output.conclusion);

  // Skrif í gagnagrunn umlukin try/catch: ef eitthvað klikkar setjum við
  // status='error' svo skýrslan festist EKKI í 'generating' (spinner sem hangir).
  try {
    for (const obs of claudeResult.output.observations) {
      const { error } = await supabase
        .from("observations")
        .update({
          description: obs.polished_description,
          suggestion: obs.polished_suggestion,
          severity: safeSeverity(obs.id, obs.severity),
          updated_at: new Date().toISOString(),
        })
        .eq("id", obs.id);
      if (error)
        throw new Error(`Uppfærsla athugasemdar mistókst: ${error.message}`);
    }

    // AI er búið; PDF-render fer í biðröð (bakgrunns-worker). status='report_ready',
    // report_url og report_generated_at eru sett af worker þegar PDF er tilbúið.
    const { error: inspErr } = await supabase
      .from("inspections")
      .update({
        status: "rendering_pdf",
        ai_report_data: aiReportData,
        ai_summary: aiSummary,
        ai_cost_usd: aiCostUsd,
        ai_model: ANTHROPIC_MODEL,
        report_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inspectionId);
    if (inspErr)
      throw new Error(`Uppfærsla skoðunar mistókst: ${inspErr.message}`);

    // Setja PDF-render í biðröð. 23505 = virkt starf þegar til fyrir þessa skoðun
    // (partial unique index) → í lagi, það er nú þegar í biðröð.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error: jobErr } = await supabase
      .from("report_jobs")
      .insert({ inspection_id: inspectionId, requested_by: user?.id ?? null });
    if (jobErr && jobErr.code !== "23505")
      throw new Error(`Tókst ekki að setja PDF í biðröð: ${jobErr.message}`);
  } catch (e: unknown) {
    console.error("DB write error:", e);
    await supabase
      .from("inspections")
      .update({ status: "error", updated_at: new Date().toISOString() })
      .eq("id", inspectionId);
    const msg = e instanceof Error ? e.message : "Óþekkt villa";
    return { error: `Villa við vistun skýrslu: ${msg}` };
  }

  revalidatePath(`/dashboard/${inspectionId}`);
  revalidatePath("/dashboard");
  return {
    status: "success",
    ai_summary: aiSummary,
    ai_cost_usd: aiCostUsd,
  };
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
  const supabase = await createClient();

  const { data: inspection, error: fetchError } = await supabase
    .from("inspections")
    .select("id, status, report_error, ai_report_data")
    .eq("id", inspectionId)
    .maybeSingle();

  if (fetchError || !inspection) {
    return { error: fetchError?.message ?? "Skoðun fannst ekki." };
  }
  if (!inspection.ai_report_data) {
    return { error: "Engin skýrsla til — búðu fyrst til skýrslu með AI." };
  }

  // Árekstravörn: ef snapshot-ið breyttist eftir að ritillinn var opnaður
  // (ný AI-skýrslugerð, vistun úr öðrum flipa) má þessi vistun EKKI yfirskrifa
  // nýrri textann með gömlu ritil-ástandi.
  if (snapshotToken(inspection.ai_report_data) !== expectedToken) {
    return {
      error:
        "Skýrslutextinn hefur breyst síðan ritillinn var opnaður (t.d. ný skýrslugerð eða vistun annars staðar). Endurhladdu síðuna og gerðu breytingarnar aftur.",
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
          throw new Error(`Uppfærsla athugasemdar mistókst: ${error.message}`);
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
      throw new Error(`Uppfærsla skýrslu mistókst: ${inspErr.message}`);
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
          throw new Error(`Tókst ekki að setja PDF í biðröð: ${jobErr.message}`);
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
    const msg = e instanceof Error ? e.message : "Óþekkt villa";
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

export async function sendToDrive(inspectionId: string) {
  const supabase = await createClient();

  const { data: inspection } = await supabase
    .from("inspections")
    .select("report_url, address")
    .eq("id", inspectionId)
    .single();

  if (!inspection?.report_url) {
    return { error: "Engin skýrsla til. Búðu til skýrslu fyrst." };
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("inspection-reports")
    .download(inspection.report_url);

  if (downloadError || !fileData) {
    return { error: `Gat ekki sótt skýrslu: ${downloadError?.message}` };
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

interface ClaudeReportOutput {
  introduction: string;
  property_description: string;
  conclusion: string;
  observations: Array<{
    id: string;
    severity: string;
    polished_description: string;
    polished_suggestion: string;
  }>;
}

/**
 * Staðfestir lögun á skipulagða svarinu úr tólkallinu (toolUse.input er þegar
 * gilt JSON-objekt frá SDK-inu — við tékkum bara að nauðsynlegir reitir séu til).
 */
function validateReportOutput(input: unknown): ClaudeReportOutput {
  const obj = input as Record<string, unknown> | null;
  if (
    !obj ||
    typeof obj.introduction !== "string" ||
    typeof obj.property_description !== "string" ||
    typeof obj.conclusion !== "string" ||
    !Array.isArray(obj.observations)
  ) {
    throw new Error("Skipulagt svar vantar nauðsynlega reiti.");
  }
  return obj as unknown as ClaudeReportOutput;
}

function computeCostUsd(inputTokens: number, outputTokens: number): number {
  const cost =
    (inputTokens * PRICE_INPUT_PER_M + outputTokens * PRICE_OUTPUT_PER_M) /
    1_000_000;
  return Math.round(cost * 10_000) / 10_000;
}

function firstSentence(text: string): string {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return "";
  const m = trimmed.match(/^.+?[.!?](?=\s|$)/);
  return (m ? m[0] : trimmed).slice(0, 500);
}

const SYSTEM_PROMPT = `Þú ert faglegur ritstjóri fyrir Beton ehf., íslenskt fyrirtæki sem framkvæmir ástandsskoðanir á fasteignum. Þú færð skipulögð gögn um eina skoðun (eign, rými, athugasemdir og myndir) og átt að skila einum JSON hlut sem inniheldur:

1) Þrískiptan inngangstexta sem birtist á samantektarsíðu skýrslunnar (síða 4).
2) Snyrtu, faglega lýsingu og tillögu fyrir hverja athugasemd.
3) Staðfestan alvarleikaflokk fyrir hverja athugasemd.

INNTAK: Fyrst kemur eignar- og rýmissamhengi sem JSON. Síðan kemur HVER athugasemd á eftir öðrum, merkt "── Athugasemd <id>", með rými, flokki, alvarleika, titli og hrátexta skoðunarmanns — og þar á eftir koma LJÓSMYNDIRNAR af þeirri athugasemd. Skoðaðu myndirnar vandlega; þær sýna oft það sem skoðunarmaður er að benda á. Mappaðu hverja niðurstöðu við rétt "id".

Þú skrifar EKKI HTML, þú smíðar EKKI PDF. Annað kerfi sér um framsetningu. Þú skilar niðurstöðunni með tólinu skila_skyrslu.

═══════════════════════════════════════════════════════════
TÓNN OG STÍLL
═══════════════════════════════════════════════════════════

- Tungumál: íslenska. Engin ensk orð nema sérheiti (Bosch, Protimeter, Topdon, o.s.frv.).
- Tónn: faglegur, hlutlaus, lýsandi. Ekki dramatískur, ekki of mjúkur.
- Notaðu byggingafagmál þar sem það á við (gúmmíþétting, rakaskemmd, einangrun, burðarvirki, frágangur, þrýstijöfnun).
- Engar fyrstu persónu setningar ("ég sé að..." "við mælum með..."). Skrifaðu hlutlaust í þriðju persónu eða ópersónulega ("mælt er með að...", "þétting vantar", "yfirborð er slitið").
- Forðastu fyllingarorð ("mjög", "auðvitað", "að sjálfsögðu"). Vertu hnitmiðuð/-aður.
- Ekki nota emoji.

═══════════════════════════════════════════════════════════
HLUTI 1 — INNGANGUR (introduction)
═══════════════════════════════════════════════════════════

Næstum fastur texti. Aðlagaðu nöfn, dagsetningu og staðsetningu. Notaðu ÞESSA uppbyggingu — ekki finna upp aðra:

"[Nafn viðskiptavinar] hafði samband við Beton ehf. og óskaði eftir ástandsskoðun, heimilisfangið er: [heimilisfang]. Bragi Michaelsson Húsasmíðameistari framkvæmdi ástandsskoðunina þann [dagsetning skrifuð á íslensku, t.d. '15. apríl 2026']. Sér til stuðnings notaði hann hlutfallsrakamæli af gerðinni Protimeter Survey Master og hitamyndavél frá Topdon. Ytra byrðið var sjónskoðað frá jörðu og þakið skoðað frá [veldu eitt sem passar: 'svölum' / 'jörðu' / 'þakstiga'  — ef ekki er hægt að ráða af gögnum, notaðu 'jörðu']."

Þrjár til fjórar setningar. Ekki bæta við aukaupplýsingum.

═══════════════════════════════════════════════════════════
HLUTI 2 — EIGNALÝSING (property_description)
═══════════════════════════════════════════════════════════

Tvær til þrjár setningar úr property_data hlutnum (sem kemur úr fasteignaskrá hms.is). Lýstu: tegund (parhús/einbýli/raðhús/fjölbýli), hæðir, stærð (m²), byggingarár, byggingaráfangi. Þú mátt nefna fjölda herbergja ef það á við. Engar tilgátur um efni eða ástand sem ekki er í gögnunum.

Ef inspection.lookup_failed er true (eða property_data er tómt): skilaðu TÓMUM streng "". PDF þjónustan birtir þá staðlaðan placeholder.

Dæmi: "Erluás 70 er parhús á tveimur hæðum, byggt árið 1985, 145 fermetrar að stærð og fullbyggt. Eignin telur fimm herbergi."

═══════════════════════════════════════════════════════════
HLUTI 3 — NIÐURSTAÐA (conclusion)
═══════════════════════════════════════════════════════════

Fjórar til sex setningar sem draga saman helstu niðurstöður skoðunarinnar.

Uppbygging:
1. Ein opnunarsetning sem nefnir fjölda athugasemda eða heildarástand.
2. Nefndu fyrst MJÖG ALVARLEGAR athugasemdir (ef einhverjar). Lýstu þeim hvað varðar hættu eða skemmdir.
3. Síðan ALVARLEGAR athugasemdir í stuttu máli.
4. Stutt tilvísun í minniháttar athugasemdir sem hópur.
5. Hlutlaust lokaorð — ekki ráðleggingar um kaup eða verð. Eitthvað í líkingu við: "Mælt er með að ráðist verði í úrbætur á alvarlegustu atriðunum sem fyrst." eða "Eignin er í eðlilegu ástandi miðað við aldur."

KRÍTÍSK SKORÐUR: Samantektin (allir þrír hlutar samanlagðir) verður að rúmast á EINNI A4 síðu í lokaskýrslunni. Heildarlengd ætti að vera u.þ.b. 180–260 orð. Ef þú getur ekki nefnt allt, nefndu hættulegustu atriðin og slepptu hinum.

═══════════════════════════════════════════════════════════
ALVARLEIKAFLOKKUN ATHUGASEMDA
═══════════════════════════════════════════════════════════

Fyrir HVERJA athugasemd skaltu staðfesta einn af þremur flokkum. Fylgdu þessum reglum nákvæmlega:

| Flokkur          | Merking                                                                                              |
|------------------|------------------------------------------------------------------------------------------------------|
| athugasemd       | Minniháttar galli, slit eða frágangur sem hefur EKKI áhrif á virkni eða öryggi.                       |
| alvarleg         | Galli sem getur haft áhrif á virkni, öryggi eða valdið kostnaði til lengri tíma ef ekki er sinnt.    |
| mjog_alvarleg    | Veldur eða mun valda alvarlegri hættu, skemmdum á burðarvirki, vatnsskemmdum eða öryggisbresti.       |

Dæmi:
- Stíft fag á glugga, slitin lökkun, lítilsháttar slit á gólfefni → athugasemd
- Rakaskemmd á vegg, skortur á þéttingu sem getur leitt til leka, eldri raflagnir án jarðtengingar → alvarleg
- Vatnsleki inn í burðarvirki, alvarleg mygla, gallað rafmagnstöfla, fall- eða brunahætta → mjog_alvarleg

Þú færð núverandi alvarleikaflokk í gögnunum. Ef þú telur að flokkunin sé röng samkvæmt reglunum hér að ofan skaltu breyta henni. Annars heldur þú honum óbreyttum. Ekki færa niður (gera vægari) nema augljóst sé að upphafleg flokkun var of harkaleg.

═══════════════════════════════════════════════════════════
SNYRTING ATHUGASEMDA (polished_description, polished_suggestion)
═══════════════════════════════════════════════════════════

Fyrir hverja athugasemd færðu hráa lýsingu (description) og tillögu (suggestion) frá skoðunarmanni — oft er textinn stuttur, slangur eða með innsláttarvillum. Þú átt að:

1. **polished_description** — Skrifaðu eina til þrjár setningar sem lýsa athuguninni faglega. Hvað sást, hvar, hvers vegna er það athugavert. Notaðu byggingafagmál. Þú mátt NÝTA það sem sést á meðfylgjandi ljósmyndum athugasemdarinnar og eignarsamhengið (rými, byggingarár, tegund) til að gera lýsinguna nákvæmari — en EKKI finna upp galla sem hvorki sjást á myndum né koma fram hjá skoðunarmanni.
2. **polished_suggestion** — Skrifaðu eina til tvær setningar með ráðleggingu um úrbót, byggða á lýsingunni, því sem sést á myndunum og alvarleika. Hvað á að gera, hvernig, og ef við á: hver á að gera það (fagaðili eða eigandi). Engin verðmæti.

Reglur:
- Ef hrá lýsing er tóm, skrifaðu eitthvað í líkingu við "Sjá meðfylgjandi mynd."
- Ef hrá tillaga er tóm eða ófullnægjandi, skrifaðu faglega tillögu byggða á lýsingu og alvarleika. Nefndu hvaða tegund fagaðila á að kalla til (pípara, rafvirkja, múrara, húsasmíðameistara, o.s.frv.) og lýstu viðeigandi úrbót. Aldrei sleppa tillögu — ALLAR athugasemdir skulu hafa polished_suggestion.
- Ekki endurtaka titilinn í lýsingunni.
- Ekki skrifa númer athugasemdar inn í textann — það kemur sjálfkrafa fram.
- Ekki breyta merkingu — einungis orðalagi.

═══════════════════════════════════════════════════════════
ÚTGANGSSKEMA — JSON
═══════════════════════════════════════════════════════════

Skilaðu niðurstöðunni með því að kalla á tólið \`skila_skyrslu\`. Reitirnir eru samkvæmt þessu skema:

{
  "introduction": string,
  "property_description": string,
  "conclusion": string,
  "observations": [
    {
      "id": string,
      "severity": "athugasemd" | "alvarleg" | "mjog_alvarleg",
      "polished_description": string,
      "polished_suggestion": string
    }
  ]
}

Athugasemdir í observations fylkinu verða að vera nákvæmlega jafn margar og koma inn, og hver "id" verður að passa við einn af id-unum sem þú fékkst. Ekki bæta við athugasemdum og ekki sleppa neinum.

Notaðu tólið \`skila_skyrslu\` til að skila svarinu — ekki skrifa svarið sem venjulegan texta.`;
