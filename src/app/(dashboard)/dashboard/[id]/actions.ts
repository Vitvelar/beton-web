"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_MODEL = "claude-opus-4-8";
// Hækkað úr 4096: löng íslensk skýrsla með mörgum athugasemdum rúmaðist ekki
// og JSON-svarið slitnaði í miðju (olli "Expected ',' or '}' ..." villunni).
const CLAUDE_MAX_TOKENS = 16000;
// Opus-verð (USD/1M tókenar) — staðfesta gegn gildandi Anthropic verðskrá.
const PRICE_INPUT_PER_M = 15;
const PRICE_OUTPUT_PER_M = 75;

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
          suggestion, severity, sort_order
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
  const userPayload = {
    inspection: {
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
    },
    rooms: sortedRooms.map((r) => ({
      name: r.name,
      ratings: r.ratings ?? {},
      notes: r.notes ?? "",
      observations: (r.observations ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((o) => ({
          id: o.id,
          number: o.observation_number,
          category: o.category ?? "",
          title: o.title,
          description: o.description ?? "",
          suggestion: o.suggestion ?? "",
          current_severity: o.severity,
        })),
    })),
  };

  const userMessage =
    "Hér eru gögn skoðunarinnar sem þú átt að vinna úr. Skilaðu JSON svari samkvæmt skemanu sem skilgreint er í kerfishvatningunni.\n\n" +
    JSON.stringify(userPayload, null, 2);

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
      messages: [{ role: "user", content: userMessage }],
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
    inspection: userPayload.inspection,
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

    const { error: inspErr } = await supabase
      .from("inspections")
      .update({
        status: "report_ready",
        ai_report_data: aiReportData,
        ai_summary: aiSummary,
        ai_cost_usd: aiCostUsd,
        ai_model: ANTHROPIC_MODEL,
        report_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", inspectionId);
    if (inspErr)
      throw new Error(`Uppfærsla skoðunar mistókst: ${inspErr.message}`);
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

Þú skrifar EKKI HTML, þú smíðar EKKI PDF. Annað kerfi sér um framsetningu. Þú skilar EINGÖNGU hreinu JSON sem fellur að skemanu sem lýst er hér að neðan.

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

1. **polished_description** — Skrifaðu eina til þrjár setningar sem lýsa athuguninni faglega. Hvað sást, hvar, hvers vegna er það athugavert. Notaðu byggingafagmál. Ekki bæta við upplýsingum sem eru ekki í hráu gögnunum — þú mátt einungis betrumbæta orðalag.
2. **polished_suggestion** — Skrifaðu eina til tvær setningar með ráðleggingu um úrbót. Hvað á að gera, hvernig, og ef við á: hver á að gera það (fagaðili eða eigandi). Engin verðmæti.

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
