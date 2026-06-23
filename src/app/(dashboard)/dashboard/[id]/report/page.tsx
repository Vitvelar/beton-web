import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "./print-button";
import type { Severity } from "@/lib/supabase/types";

interface ReportData {
  inspection: {
    address: string;
    postal_code: string;
    municipality: string;
    fastanumer: string;
    customer_name: string;
    inspection_date: string;
    weather: string;
    attendees: string[];
    property_data: Record<string, unknown>;
    lookup_failed: boolean;
  };
  ai_summary: {
    introduction: string;
    property_description: string;
    conclusion: string;
  };
  rooms: Array<{
    name: string;
    slug: string;
    sort_order: number;
    ratings: Record<string, string>;
    notes: string;
    observations: Array<{
      id: string;
      number: string | null;
      category: string;
      title: string;
      description: string;
      suggestion: string;
      severity: Severity;
    }>;
  }>;
}

interface PhotoWithUrl {
  id: string;
  storage_path: string;
  photo_type: string;
  caption: string | null;
  is_cover: boolean;
  sort_order: number;
  room_id: string | null;
  observation_id: string | null;
  url: string;
}

const SEV_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  athugasemd: { color: "#3b4ec9", bg: "#eef0fb", label: "Athugasemd" },
  alvarleg: { color: "#c98a2e", bg: "#fbf2e3", label: "Alvarleg athugasemd" },
  mjog_alvarleg: { color: "#b53d3d", bg: "#fbeaea", label: "Mjög alvarleg athugasemd" },
};

const SEV_ICON: Record<string, string> = {
  athugasemd: "!",
  alvarleg: "−",
  mjog_alvarleg: "×",
};

const SEV_RANK: Record<string, number> = {
  mjog_alvarleg: 0,
  alvarleg: 1,
  athugasemd: 2,
};

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: inspection } = await supabase
    .from("inspections")
    .select(`
      id, address, postal_code, municipality, fastanumer,
      customer_name, inspection_date, weather, attendees,
      property_data, ai_report_data, ai_summary,
      ai_cost_usd, ai_model, report_generated_at,
      rooms (
        id, name, slug, sort_order, ratings, notes,
        observations (
          id, observation_number, category, title, description, suggestion, severity, sort_order,
          photos (id, storage_path, photo_type, caption, is_cover, sort_order, room_id, observation_id)
        ),
        photos (id, storage_path, photo_type, caption, is_cover, sort_order, room_id, observation_id)
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (!inspection?.ai_report_data) {
    notFound();
  }

  const report = inspection.ai_report_data as ReportData;

  type RawRoom = {
    id: string; name: string; slug: string; sort_order: number;
    ratings: Record<string, string> | null; notes: string | null;
    observations: Array<{
      id: string; observation_number: string | null; category: string | null;
      title: string; description: string | null; suggestion: string | null;
      severity: string; sort_order: number;
      photos: RawPhoto[];
    }>;
    photos: RawPhoto[];
  };
  type RawPhoto = {
    id: string; storage_path: string | null; photo_type: string;
    caption: string | null; is_cover: boolean; sort_order: number;
    room_id: string | null; observation_id: string | null;
  };
  const dbRooms = ((inspection.rooms ?? []) as RawRoom[]).sort(
    (a, b) => a.sort_order - b.sort_order
  );

  // Bæði rýmismyndir (r.photos) og athugasemdamyndir (r.observations[].photos).
  // Athugasemdamyndir bera observation_id og room_id = null, svo þær koma aðeins
  // fram í observation-embed-inu — roomPhotos()/obsPhotos() flokka þær rétt.
  const allDbPhotos = (() => {
    const byId = new Map<string, RawPhoto>();
    for (const r of dbRooms) {
      for (const p of r.photos ?? []) {
        if (p.storage_path) byId.set(p.id, p);
      }
      for (const o of r.observations ?? []) {
        for (const p of o.photos ?? []) {
          if (p.storage_path) byId.set(p.id, p);
        }
      }
    }
    return [...byId.values()];
  })();

  const signedUrls = new Map<string, string>();
  const batchSize = 20;
  for (let i = 0; i < allDbPhotos.length; i += batchSize) {
    const batch = allDbPhotos.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (p) => {
        const { data } = await supabase.storage
          .from("inspection-photos")
          .createSignedUrl(p.storage_path!, 3600);
        return { id: p.id, url: data?.signedUrl ?? null };
      })
    );
    for (const r of results) {
      if (r.url) signedUrls.set(r.id, r.url);
    }
  }

  const photosWithUrls: PhotoWithUrl[] = allDbPhotos
    .filter((p) => signedUrls.has(p.id))
    .map((p) => ({ ...p, storage_path: p.storage_path!, url: signedUrls.get(p.id)! }));

  const coverPhoto = photosWithUrls.find((p) => p.is_cover) ?? photosWithUrls[0] ?? null;

  function roomPhotos(roomId: string): PhotoWithUrl[] {
    return photosWithUrls
      .filter((p) => p.room_id === roomId && !p.observation_id)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  function obsPhotos(obsId: string): PhotoWithUrl[] {
    return photosWithUrls
      .filter((p) => p.observation_id === obsId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  const sevCounts = { mjog_alvarleg: 0, alvarleg: 0, athugasemd: 0 };
  for (const room of report.rooms) {
    for (const obs of room.observations) {
      if (obs.severity in sevCounts) {
        sevCounts[obs.severity as keyof typeof sevCounts]++;
      }
    }
  }
  const totalObs = sevCounts.athugasemd + sevCounts.alvarleg + sevCounts.mjog_alvarleg;

  const rankedObs = report.rooms
    .flatMap((r) => r.observations.map((obs) => ({ obs, roomName: r.name })))
    .sort((a, b) => (SEV_RANK[a.obs.severity] ?? 9) - (SEV_RANK[b.obs.severity] ?? 9))
    .slice(0, 10);

  const propData = report.inspection.property_data ?? {};
  const inspectorName = (propData.inspectorName as string) ?? "Bragi Michaelsson";

  const logoSrc = "/images/beton-logo.webp";
  return (
    <div className="max-w-4xl mx-auto print:max-w-none">
      <style dangerouslySetInnerHTML={{ __html: `
        /* Word "Normal" spássíur = 2,54 cm allan hringinn. */
        @page { size: A4; margin: 25.4mm; }
        /* Forsíða (fyrsta síða) og skilmálasíða eru heilsíður án hlaupandi haus. */
        @page :first { margin: 0; }
        @page terms { margin: 0; }
        .run-header, .run-footer { display: none; }
        @media print {
          html, body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          /* Fjarlægja stjórnborðs-umgjörð (haus, miðjun, bakgrunnur) úr prentun. */
          main { max-width: none !important; margin: 0 !important; padding: 0 !important; }
          .report-article {
            border: 0 !important; border-radius: 0 !important; box-shadow: none !important;
            background: #fff !important; max-width: none !important; overflow: visible !important;
          }
          /* Venjulegar efnissíður — @page sér um spássíurnar, svo núllum innri lárétt bil. */
          .report-article > section {
            padding-left: 0 !important; padding-right: 0 !important;
            padding-top: 4mm !important; padding-bottom: 0 !important; border: 0 !important;
          }
          /* Forsíða og skilmálasíða eru heilsíður (margin: 0) — gefa þeim eigin innri spássíu. */
          .report-article > section.rpt-cover { padding: 20mm 25.4mm !important; }
          .report-article > section.rpt-terms { page: terms; padding: 25.4mm !important; }
          /* Lítið Beton-logo efst til vinstri + fótur, endurtekið á öllum síðum.
             Á heilsíðunum (margin: 0) ýtir neikvæða staðsetningin þeim út af síðunni. */
          .run-header { display: flex; align-items: center; position: fixed; top: -18mm; left: 0; }
          .run-header img { height: 9mm; width: auto; }
          .run-footer {
            display: block; position: fixed; bottom: -18mm; left: 0; right: 0;
            text-align: center; font-size: 8pt; color: #6b7280;
          }
          /* Myndir, töflur og spjöld mega ekki klofna milli síðna (eins og í Word). */
          img, table, thead, tbody, tr, .rpt-keep { break-inside: avoid; page-break-inside: avoid; }
          h2, h3 { break-after: avoid; }
        }
      `}} />

      {/* Hlaupandi haus (lítið logo) + fótur — birtist aðeins í prentun, á öllum síðum. */}
      <div className="run-header" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="" />
      </div>
      <div className="run-footer" aria-hidden="true">
        Beton ehf. · Ástandsskoðun · {report.inspection.address}
      </div>

      {/* Navigation — hidden in print */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href={`/dashboard/${id}`} className="text-sm text-navy hover:underline">
          &larr; Til baka
        </Link>
        <PrintButton />
      </div>

      <article className="bg-white rounded-xl border border-concrete overflow-hidden print:border-0 print:rounded-none print:shadow-none report-article">

        {/* ═══ PAGE 1: COVER ═══ */}
        <section className="rpt-cover print:break-after-page">
          <div className="flex flex-col items-center text-center px-8 py-12 print:py-0">
            <div className="mb-5 print:mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc} alt="Beton ehf." className="h-20 w-auto print:h-24" />
            </div>
            <p className="text-xs font-semibold tracking-[0.2em] text-navy mb-2">BETON EHF.</p>
            <h1 className="text-3xl font-bold text-navy mb-3">Ástandsskoðun</h1>
            <p className="text-xl text-ink mb-6">{report.inspection.address}</p>

            {coverPhoto ? (
              <div className="w-full max-w-2xl h-64 sm:h-80 rounded-lg overflow-hidden mb-8 bg-concrete/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverPhoto.url} alt="Forsíðumynd" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full max-w-2xl h-64 rounded-lg border-2 border-dashed border-concrete flex items-center justify-center mb-8 text-fog text-sm">
                Engin forsíðumynd
              </div>
            )}

            <div className="flex justify-around w-full max-w-lg text-center border-t border-concrete pt-5">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-fog">Viðskiptavinur</p>
                <p className="font-semibold text-ink mt-1">{report.inspection.customer_name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-fog">Skoðunardagur</p>
                <p className="font-semibold text-ink mt-1">{report.inspection.inspection_date}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-fog">Skoðunarmaður</p>
                <p className="font-semibold text-ink mt-1">{inspectorName}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ PAGE 2: EFNISYFIRLIT (TOC) ═══ */}
        <section className="px-8 py-8 border-t border-concrete print:border-0 print:break-before-page print:break-after-page">
          <h2 className="text-2xl font-bold text-navy mb-2">Efnisyfirlit</h2>
          <div className="h-0.5 bg-navy mb-6" />
          <div className="space-y-0">
            <TocRow num="M" name="Inngangur og matskerfi" />
            <TocRow num="1" name="Samantekt" />
            {report.rooms.map((room, idx) => (
              <TocRow key={room.slug} num={String(idx + 2)} name={`Rými — ${room.name}`} />
            ))}
            {rankedObs.length > 0 && (
              <TocRow num={String(report.rooms.length + 2)} name="Verkefnalisti — forgangsröð" />
            )}
            <TocRow
              num={String(report.rooms.length + 2 + (rankedObs.length > 0 ? 1 : 0))}
              name="Skilmálar og fyrirvarar"
            />
          </div>
        </section>

        {/* ═══ PAGE 3: INTRO + MATSKERFI ═══ */}
        <section className="px-8 py-8 border-t border-concrete print:border-0 print:break-before-page print:break-after-page">
          <div className="border-l-4 border-navy bg-stone-50 rounded-sm px-6 py-5 mb-8">
            <h2 className="text-lg font-bold text-navy mb-3">Ástandsskoðun Beton ehf.</h2>
            <p className="text-sm text-ink/80 leading-relaxed mb-3">
              Markmið ástandsskoðunar er að veita verkkaupa upplýsingar um almennt og sýnilegt ástand
              fasteignar á þeim tímapunkti sem skoðun fer fram. Ástandsskoðun byggir á hlutlausri skoðun og
              stöðluðum verkferlum Beton ehf. og er ætluð til upplýsingaöflunar vegna fasteignaviðskipta eða
              mats á ástandi eigin eignar. Ástandsskoðun og skýrsla eiga eingöngu við um þá fasteign sem
              skoðuð er og taka einungis til þeirra atriða sem sérstaklega eru nefnd í skýrslu.
            </p>
            <p className="text-sm text-ink/80">
              Allar ástandsskoðanir falla undir{" "}
              <a href="https://www.betonehf.is/s/skilmalarbetonehf.pdf" className="text-navy underline">
                skilmála Beton ehf.
              </a>
            </p>
          </div>

          <h2 className="text-lg font-bold text-navy mb-3">
            <span className="text-sev-calm font-bold mr-2">M.</span>Matskerfi
          </h2>
          <p className="text-sm text-ink/80 leading-relaxed mb-2">
            Svona virkar matskerfið: hver athugasemd í skýrslunni fær mat sem sýnir hversu alvarlegt tjónið er.
            Alvarleiki tjónsins er metinn út frá hversu miklar afleiðingar það getur haft fyrir
            byggingarhlutann/bygginguna ásamt því hversu mikilvægt er að laga það.
          </p>
          <p className="text-sm text-ink/80 leading-relaxed mb-6">
            Í skýrslunni er að finna þrjár mismunandi tegundir athugasemda.
          </p>

          <div className="space-y-6">
            {(["athugasemd", "alvarleg", "mjog_alvarleg"] as const).map((sev) => (
              <div key={sev} className="flex items-start gap-4 print:break-inside-avoid">
                <div
                  className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: SEV_COLORS[sev].color }}
                >
                  {SEV_ICON[sev]}
                </div>
                <div className="pt-1">
                  <p className="font-bold text-sm" style={{ color: SEV_COLORS[sev].color }}>
                    {SEV_COLORS[sev].label}
                  </p>
                  <p className="text-sm text-ink/80 leading-relaxed mt-0.5">
                    {sev === "athugasemd" && "Tjón sem hefur engin áhrif á virkni byggingarhlutans/byggingarinnar."}
                    {sev === "alvarleg" && "Tjón sem veldur því að virkni byggingarhlutans er í ólagi til lengri tíma litið. Slíkt tjón getur valdið skemmdum á öðrum byggingarhlutum."}
                    {sev === "mjog_alvarleg" && "Tjón sem þegar hefur valdið eða mun valda því að virkni byggingarhlutans verður í ólagi fljótlega. Slíkt tjón getur valdið skemmdum á öðrum byggingarhlutum eða hefur nú þegar gert það."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ PAGE 4: SAMANTEKT ═══ */}
        <section className="px-8 py-8 border-t border-concrete print:border-0 print:break-before-page print:break-after-page">
          <h2 className="text-lg font-bold text-navy mb-6">
            <span className="text-sev-calm font-bold mr-2">1.</span>Samantekt
          </h2>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-navy mb-2">Inngangur</h3>
            <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">
              {report.ai_summary.introduction}
            </p>
          </div>

          {report.ai_summary.property_description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-navy mb-2">Eignalýsing</h3>
              <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">
                {report.ai_summary.property_description}
              </p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-navy mb-2">Niðurstaða</h3>
            <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">
              {report.ai_summary.conclusion}
            </p>
          </div>

          {/* Severity stat boxes */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {(["athugasemd", "alvarleg", "mjog_alvarleg"] as const).map((sev) => (
              <div
                key={sev}
                className="rounded-lg p-3 border-l-4"
                style={{ borderLeftColor: SEV_COLORS[sev].color }}
              >
                <div className="text-2xl font-bold" style={{ color: SEV_COLORS[sev].color }}>
                  {sevCounts[sev]}
                </div>
                <div className="text-xs text-fog">{SEV_COLORS[sev].label.replace(" athugasemd", "")}</div>
              </div>
            ))}
          </div>

          {/* Property info table */}
          <h3 className="text-sm font-semibold text-navy mb-2 mt-6">Eign</h3>
          <table className="w-full text-sm mb-6">
            <tbody className="divide-y divide-concrete/50">
              <InfoTableRow label="Heimilisfang" value={report.inspection.address} />
              <InfoTableRow
                label="Póstnúmer"
                value={`${report.inspection.postal_code}${report.inspection.municipality ? " " + report.inspection.municipality : ""}`}
              />
              {report.inspection.fastanumer && (
                <InfoTableRow label="Fastanúmer" value={report.inspection.fastanumer} />
              )}
              {propData.tegund ? <InfoTableRow label="Tegund" value={String(propData.tegund)} /> : null}
              {propData.staerd_m2 ? <InfoTableRow label="Stærð" value={`${propData.staerd_m2} m²`} /> : null}
              {propData.byggingarar ? <InfoTableRow label="Byggingarár" value={String(propData.byggingarar)} /> : null}
              {propData.byggingarafangi ? <InfoTableRow label="Byggingarstig" value={String(propData.byggingarafangi)} /> : null}
            </tbody>
          </table>

          <h3 className="text-sm font-semibold text-navy mb-2">Skoðun</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-concrete/50">
              <InfoTableRow label="Viðskiptavinur" value={report.inspection.customer_name} />
              <InfoTableRow label="Skoðunardagur" value={report.inspection.inspection_date} />
              <InfoTableRow label="Skoðunarmaður" value={inspectorName} />
              {report.inspection.attendees?.length > 0 && (
                <InfoTableRow label="Viðstaddir" value={report.inspection.attendees.join(", ")} />
              )}
              {report.inspection.weather && (
                <InfoTableRow label="Veður" value={report.inspection.weather} />
              )}
              <InfoTableRow label="Fjöldi rýma" value={String(report.rooms.length)} />
              <InfoTableRow label="Fjöldi athugasemda" value={String(totalObs)} />
              <InfoTableRow label="Fjöldi mynda" value={String(photosWithUrls.length)} />
            </tbody>
          </table>
        </section>

        {/* ═══ ROOM PAGES ═══ */}
        {report.rooms.map((room, roomIdx) => {
          const dbRoom = dbRooms.find((r) => r.slug === room.slug);
          const rPhotos = dbRoom ? roomPhotos(dbRoom.id) : [];
          return (
            <section
              key={room.slug}
              className="px-8 py-8 border-t border-concrete print:border-0 print:break-before-page"
            >
              <h2 className="text-lg font-bold text-navy mb-4">
                <span className="text-sev-calm font-bold mr-2">{roomIdx + 2}.</span>
                {room.name}
              </h2>

              {/* Room photos */}
              {rPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4 print:break-inside-avoid">
                  {rPhotos.map((p) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={p.id} src={p.url} alt={p.caption ?? ""} className="w-full h-28 object-cover rounded" />
                  ))}
                </div>
              )}

              {/* Room ratings */}
              {room.ratings && Object.keys(room.ratings).length > 0 && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 bg-stone-50 rounded p-3 mb-4 text-xs print:break-inside-avoid">
                  {Object.entries(room.ratings)
                    .filter(([, v]) => v && v !== "na")
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between py-0.5">
                        <span className="text-fog capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="font-semibold" style={{ color: ratingColor(value) }}>
                          {ratingLabel(value)}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {/* Room notes */}
              {room.notes && (
                <div className="bg-amber-50 rounded p-3 mb-4 text-sm">
                  <strong>Athugasemdir um rýmið:</strong> {room.notes}
                </div>
              )}

              {/* Observations */}
              {room.observations.length > 0 ? (
                <div className="space-y-4">
                  {room.observations.map((obs, obsIdx) => {
                    const sev = SEV_COLORS[obs.severity] ?? SEV_COLORS.athugasemd;
                    const oPhotos = obsPhotos(obs.id);
                    return (
                      <div
                        key={obs.id}
                        className="rounded-lg p-4 border-l-4 bg-white shadow-[0_0_2px_rgba(0,0,0,0.04)] print:break-inside-avoid"
                        style={{ borderLeftColor: sev.color }}
                      >
                        <div className="flex items-baseline gap-2 flex-wrap mb-1">
                          <span className="font-bold text-navy text-sm">
                            {roomIdx + 2}.{obsIdx + 1}
                          </span>
                          <span className="font-semibold text-sm text-ink flex-1">{obs.title}</span>
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded"
                            style={{ backgroundColor: sev.bg, color: sev.color }}
                          >
                            {sev.label}
                          </span>
                        </div>
                        {obs.category && (
                          <p className="text-[10px] uppercase tracking-wider text-fog mb-2">{obs.category}</p>
                        )}
                        {obs.description && (
                          <p className="text-sm text-ink/80 leading-relaxed mb-2">{obs.description}</p>
                        )}
                        {obs.suggestion && (
                          <div className="bg-stone-50 rounded px-3 py-2 mt-2">
                            <p className="text-sm text-ink/80">
                              <strong className="text-navy">Tillaga:</strong> {obs.suggestion}
                            </p>
                          </div>
                        )}
                        {oPhotos.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            {oPhotos.map((p) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={p.id} src={p.url} alt={p.caption ?? ""} className="w-full h-36 object-cover rounded" />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-fog italic">Engar athugasemdir í þessu rými.</p>
              )}
            </section>
          );
        })}

        {/* ═══ VERKEFNALISTI ═══ */}
        {rankedObs.length > 0 && (
          <section className="px-8 py-8 border-t border-concrete print:border-0 print:break-before-page">
            <h2 className="text-lg font-bold text-navy mb-2">
              <span className="text-sev-calm font-bold mr-2">{report.rooms.length + 2}.</span>
              Verkefnalisti — forgangsröð
            </h2>
            <p className="text-sm text-ink/80 mb-4">
              Hér eru helstu atriði sem þarf að taka á, raðað eftir alvarleika frá mestu til minnstu.
              Listinn er ætlaður til leiðsagnar fyrir kaupanda eða eiganda við áætlanagerð.
            </p>
            <div className="space-y-3">
              {rankedObs.map(({ obs, roomName }, i) => {
                const sev = SEV_COLORS[obs.severity] ?? SEV_COLORS.athugasemd;
                return (
                  <div
                    key={obs.id}
                    className="rounded-lg p-3 border-l-4 bg-white shadow-[0_0_2px_rgba(0,0,0,0.04)] print:break-inside-avoid"
                    style={{ borderLeftColor: sev.color }}
                  >
                    <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
                      <span className="font-bold text-navy">{i + 1}.</span>
                      <span className="font-semibold text-sm text-ink flex-1">{obs.title}</span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded"
                        style={{ backgroundColor: sev.bg, color: sev.color }}
                      >
                        {sev.label}
                      </span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-fog mb-1">
                      {roomName}{obs.category ? ` · ${obs.category}` : ""}
                    </p>
                    {obs.suggestion && (
                      <p className="text-sm text-ink/80">{obs.suggestion}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══ SKILMÁLAR OG FYRIRVARAR ═══ */}
        <section className="rpt-terms px-8 py-8 border-t border-concrete print:border-0 print:break-before-page">
          <h2 className="text-base font-bold text-navy mb-1">
            Skilmálar og fyrirvarar ástandsskoðunar Beton ehf.
          </h2>
          <div className="h-0.5 bg-navy mb-4" />

          <div className="space-y-2 text-[11px] leading-snug text-ink/90 print:text-[7.5pt] print:leading-[1.32]">
            <TermsSection n={1} title="Markmið og gildissvið">
              Markmið ástandsskoðunar er að veita verkkaupa upplýsingar um almennt og sýnilegt ástand fasteignar á
              þeim tímapunkti sem skoðun fer fram. Ástandsskoðun byggir á hlutlausri skoðun og stöðluðum verkferlum
              Beton ehf. og er ætluð til upplýsingaöflunar vegna fasteignaviðskipta eða mats á ástandi eigin eignar.
              Ástandsskoðun og skýrsla eiga eingöngu við um þá fasteign sem skoðuð er og taka einungis til þeirra
              atriða sem sérstaklega eru nefnd í skýrslu.
            </TermsSection>
            <TermsSection n={2} title="Umfang skoðunar">
              Ástandsskoðun nær eingöngu til þeirra atriða sem skoðunarmaður getur séð eða athugað með sjónskoðun
              og einföldum tækjum, án inngrips. Eign er skoðuð að innan sem utan. Að utan eru einungis aðgengileg
              svæði skoðuð, að öðrum kosti frá jörðu eða götu. Byggingarhlutir ofar en 3 metrar frá jörðu eru ekki
              skoðaðir vegna fallhættu nema sérstaklega hafi verið samið um það. Allur kostnaður vegna sérstakra
              ráðstafana eða tækjaleigju fellur á verkkaupa.
            </TermsSection>
            <TermsSection n={3} title="Það sem er ekki hluti af ástandsskoðun">
              Eftirfarandi er ekki hluti af ástandsskoðun nema sérstaklega sé samið um það skriflega: skoðun inn í
              veggi, undir gólfefni, inn í stokka eða bak við innréttingar, hreinlætistæki (s.s. baðkör og sturtubotna),
              fasta spegla, klæðningar, listaverk eða stóra fataskápa/kommóður. Tæknileg skoðun á burðarvirki, kerfum
              eða íhlutum fasteignar. Skoðun á þaki, bakköntum og þakrennum nema hægt sé að skoða þau frá jörðu,
              svölum eða sérstaklega hafi verið samið um þakskoðun. Skoðun á drenlögnum, fráveitu- og skólplögnum.
              Skoðun á raflögnum, neysluvatns-, hita- eða ofnalögnum sem og dren- og fráveitulögnum, nema um sé að
              ræða sjónskoðun á utanáliggjandi lögnum eða lagnagrind.
            </TermsSection>
            <TermsSection n={4} title="Rakamælingar og hitamyndun">
              Rakamælingar eru framkvæmdar án inngrips (non-invasive) með viðeigandi rakamælum. Ekki er um eiginlega
              hlutfallsrakamælingar að ræða heldur viðmiðunarrakamælingar út frá þeim forsendum sem eru til staðar
              við skoðun á sambærilegu byggingarefni innan rýmis eða fasteignar. Bent er á að þrátt fyrir
              rakamælingar er aldrei hægt að tryggja að fasteign sé laus við raka, myglu eða örveruvöxt, þar sem
              slíkir gallar geta leynst innan byggingarhluta án sjáanlegra ummerkja.
            </TermsSection>
            <TermsSection n={5} title="Framkvæmd skoðunar">
              Skoðunarmaður beitir sjónskoðun, tekur ljósmyndir og skráir athugasemdir um þá galla eða ágalla sem
              hann telur geta valdið verulegri skerðingu á notagildi eignar eða geti haft í för með sér verulegan
              kostnaðarauka fyrir væntanlegan kaupanda. Atriði sem teljast eðlilegt slit eða hafa ekki veruleg áhrif
              á notagildi eða kostnað eru almennt ekki talin upp.
            </TermsSection>
            <TermsSection n={6} title="Skýrslugerð og notkun skýrslu">
              Skýrsla er unnin á grundvelli þeirra upplýsinga sem skoðunarmaður hafði aðgang að á skoðunartíma.
              Allar niðurstöður og ályktunar byggjast á því að framangreindar upplýsingar um tiltekna fasteign séu
              réttar og fullnægjandi og takmarkast við þá dagsetningu sem fasteign var skoðuð. Varast skal að byggja
              ákvarðanir um fasteignakaup eingöngu á efni skýrslunnar. Skýrslan má ekki vera notuð í öðrum tilgangi
              en í tengslum við ákvarðanatöku um fasteignakaup eða til upplýsingaöflunar um ástand eigin eignar.
              Dreifing eða afhending skýrslu til þriðja aðila er óheimil nema með skriflegu samþykki Beton ehf.
            </TermsSection>
            <TermsSection n={7} title="Takmörkun ábyrgðar">
              Ábyrgð Beton ehf. og starfsmanna þess vegna ástandsskoðunar, skýrslugerðar eða athugasemda takmarkast,
              að hámarki, við þá heildarþóknun sem greitt var fyrir viðkomandi skoðun. Skoðunarmaður veitir enga
              ábyrgð, hvorki beina né óbeina, á því: að allir gallar hafi fundist, að skoðaðir byggingarhlutir séu
              rétt hannaðir eða framkvæmdir í samræmi við faglega verkhætti, að byggingarhlutir muni halda áfram að
              virka með sama hætti í framtíðinni, eða að fasteign eða einstakir hlutar hennar séu hæfir til tiltekins
              notkunartilgangs.
            </TermsSection>
            <TermsSection n={8} title="Öryggi">
              Skoðunarmaður áskilur sér rétt til að sleppa því að skoða eða mæla hluta fasteignar telji hann að
              öryggi sínu eða annarra sé stefnt í hættu, svo sem vegna fallhættu, óheilnæms vinnuumhverfis eða
              loftgæða.
            </TermsSection>
            <TermsSection n={9} title="Frekari athuganir">
              Nánari athugun eða viðgerð á göllum sem nefndir eru í skýrslu getur leitt í ljós frekari galla sem voru
              ekki sýnilegir eða aðgengilegir á skoðunartíma. Slíkir gallar falla utan ábyrgðar Beton ehf.
            </TermsSection>
            <TermsSection n={10} title="Hlutleysi og fagmennska">
              Skoðunarmaður starfar sem hlutlaus matsaðili, af heilindum og fagmennsku, og hefur engra annarra
              hagsmuna að gæta en að vinna verk sitt á faglegan hátt samkvæmt bestu vitund.
            </TermsSection>
            <TermsSection n={11} title="Greiðsla og afhending skýrslu vegna ástandsskoðunar">
              Greitt er fyrir ástandsskoðun ásamt skýrslu ekki seinna en 24 klst. fyrir áætlaða skoðun og fer
              ástandsskoðun ekki fram nema greiðsla hafi borist að fullu innan tilskilins frests. Skýrsla vegna
              ástandsskoðunar er afhent innan 48 klst. frá framkvæmd skoðunar, nema um annað hafi verið samið
              skriflega. Skilmálar þessir gilda fyrir allar ástandsskoðanir sem Beton ehf. framkvæmir nema annað sé
              sérstaklega samið skriflega.
            </TermsSection>
          </div>

          <div className="text-center mt-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="Beton ehf." className="h-16 w-auto mx-auto" />
          </div>
        </section>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-concrete bg-stone-50/30 text-xs text-fog print:hidden">
          <div className="flex justify-between">
            <span>
              Skýrsla gerð{" "}
              {inspection.report_generated_at
                ? new Date(inspection.report_generated_at).toLocaleString("is-IS")
                : "—"}
            </span>
            <span>
              {inspection.ai_model} &middot; ${inspection.ai_cost_usd?.toFixed(4) ?? "—"}
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}

function TocRow({ num, name }: { num: string; name: string }) {
  return (
    <div className="flex items-baseline gap-4 py-2.5 border-b border-dotted border-concrete">
      <span className="w-8 font-bold text-sev-calm flex-shrink-0">{num}</span>
      <span className="text-ink flex-1">{name}</span>
    </div>
  );
}

function InfoTableRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1.5 pr-4 text-fog w-2/5">{label}</td>
      <td className="py-1.5 text-ink">{value}</td>
    </tr>
  );
}

function TermsSection({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-bold text-xs text-ink mt-2 mb-0.5">{n}. {title}</h3>
      <p>{children}</p>
    </div>
  );
}

function ratingLabel(value: string): string {
  const labels: Record<string, string> = {
    ok: "Viðunandi",
    warn: "Athugasemd",
    danger: "Alvarleg athugasemd",
    mjog_alvarleg: "Mjög alvarleg athugasemd",
  };
  return labels[value] ?? value;
}

function ratingColor(value: string): string {
  const colors: Record<string, string> = {
    ok: "#8a8278",
    warn: "#3b4ec9",
    danger: "#c98a2e",
    mjog_alvarleg: "#b53d3d",
  };
  return colors[value] ?? "#8a8278";
}
