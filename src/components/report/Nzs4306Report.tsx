// NZS 4306:2005 skýrslusnið (report_standard = "nzs_4306"). Rendrað af
// src/app/(dashboard)/dashboard/[id]/report/page.tsx í stað venjulega sniðsins; sömu
// prentstílar (src/lib/report/print-css.ts) og sama PDF-leið (render-pdf.ts).
//
// Röð kafla (samningur, plan/rondva/NZ-SKYRSLUSNID-HONNUN.md): Executive summary /
// significant defects → Certificate of Inspection → Property & inspection conditions →
// element sections (site, exterior, roof, roof space, subfloor, interior, services,
// accessory) → Gradual deterioration & maintenance → Moisture readings → Limitations &
// areas not inspected → AI disclosure → Company terms.
//
// Aðeins texti AI er úr ai_summary og nzs4306.*_summary. Tafla verulegra galla,
// viðhaldstafla, vottorð, rakatafla, takmarkanir (orðrétt frá skoðunarmanni) og AI-
// yfirlýsingin eru byggð úr gögnum og föstum texta, aldrei af AI.
//
// LÖGFRÆÐILEG YFIRFERÐ: fastur texti vottorðsins og „Scope of this inspection“ hér að
// neðan er drög — lögfræðingur og NZ-skoðunarmaður (stofnskoðunarmenn) lesi yfir.

import type { ReactNode } from "react";
import { formatReportDateNz } from "@/lib/report/date";
import { REPORT_COPY, ratingCategoryLabel, reportCategoryLabel } from "@/lib/report/i18n";
import type { ReportBranding } from "@/lib/report/branding";
import {
  NZ_ROOMS,
  NZ_SECTION_KEYS,
  NZ_SECTION_LABELS,
  NZ_RATING_LABELS,
  nzBaseSlug,
  nzSectionOf,
  type NzSectionKey,
} from "@/lib/report/nz-elements";
import {
  NZ_AREA_KEYS,
  NZ_AREA_LABELS,
  NZ_AREA_VALUE_LABELS,
  areaValue,
  furnishedLabel,
  moistureRowsOf,
  nzConditionsOf,
  occupancyLabel,
  yearBuiltOf,
  type Nzs4306ReportData,
} from "@/lib/report/nzs4306";

type SeverityKey = "athugasemd" | "alvarleg" | "mjog_alvarleg";

export interface NzReportPhoto {
  id: string;
  url: string;
  caption: string | null;
}

export interface NzReportData {
  inspection: {
    address: string;
    postal_code: string;
    municipality: string;
    /** NZ: „Legal description / title reference“ (appið geymir hana í inspections.fastanumer); vantar í eldri skýrslum. */
    fastanumer?: string | null;
    customer_name: string;
    inspection_date: string;
    weather: string;
    attendees: string[];
    property_data: Record<string, unknown>;
  };
  ai_summary: { introduction: string; property_description: string; conclusion: string };
  rooms: Array<{
    name: string;
    slug: string;
    sort_order: number;
    ratings: Record<string, string>;
    notes: string;
    observations: Array<{
      id: string;
      category: string;
      title: string;
      description: string;
      suggestion: string;
      severity: string;
    }>;
  }>;
  nzs4306?: Nzs4306ReportData;
}

export interface Nzs4306ReportProps {
  report: NzReportData;
  brand: ReportBranding;
  inspectorName: string;
  /** inspectors.qualifications; null = ekki skráð. */
  qualifications: string | null;
  sevText: Record<string, { label: string; short: string; description: string }>;
  sevColors: Record<string, { color: string; bg: string }>;
  roomRating: Record<string, string>;
  ratingColor: (value: string) => string;
  coverPhotoUrl: string | null;
  roomPhotos: Record<string, NzReportPhoto[]>;
  obsPhotos: Record<string, NzReportPhoto[]>;
  reportGeneratedAt: string | null;
}

const T = REPORT_COPY.en;
const SECTION = "px-8 py-8 border-t border-concrete print:border-0 print:break-before-page";
/** Stuttir kaflar halda áfram á sömu síðu (rakamælingar á eftir viðhaldi, AI og skilmálar á eftir takmörkunum). */
const SECTION_FLOW = "px-8 py-8 border-t border-concrete print:border-0";
const SEV_KEYS: SeverityKey[] = ["mjog_alvarleg", "alvarleg", "athugasemd"];
const NO_SIGNIFICANT_DEFECTS = "No significant defects were recorded.";

export function Nzs4306Report({
  report,
  brand,
  inspectorName,
  qualifications,
  sevText,
  sevColors,
  roomRating,
  ratingColor,
  coverPhotoUrl,
  roomPhotos,
  obsPhotos,
  reportGeneratedAt,
}: Nzs4306ReportProps) {
  const insp = report.inspection;
  const propData = insp.property_data ?? {};
  const nzs = report.nzs4306 ?? {};
  const conditions = nzConditionsOf(nzs, propData);
  const moisture = moistureRowsOf(nzs);
  const yearBuilt = yearBuiltOf(propData);
  const inspectionDate = formatReportDateNz(insp.inspection_date);
  const legalDescription = legalDescriptionOf(insp);
  const sevKey = (s: string): SeverityKey => (s === "alvarleg" || s === "mjog_alvarleg" ? s : "athugasemd");

  // Element sections in contract order; rooms keep their recorded order inside a section.
  const rooms = [...(report.rooms ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const grouped = NZ_SECTION_KEYS.map((key) => ({ key, rooms: rooms.filter((r) => nzSectionOf(r.slug) === key) })).filter(
    (g) => g.rooms.length > 0,
  );
  const FIRST_ELEMENT = 4;
  const obsRef = new Map<string, string>();
  const obsLocation = new Map<string, string>();
  grouped.forEach((g, i) => {
    let n = 0;
    for (const room of g.rooms) {
      for (const obs of room.observations ?? []) {
        obsRef.set(obs.id, `${FIRST_ELEMENT + i}.${++n}`);
        obsLocation.set(obs.id, roomTitle(room));
      }
    }
  });
  const allObs = grouped.flatMap((g) => g.rooms.flatMap((r) => r.observations ?? []));
  const significant = allObs.filter((o) => o.severity === "mjog_alvarleg");
  const maintenance = allObs.filter((o) => o.severity === "athugasemd");
  const counts = Object.fromEntries(SEV_KEYS.map((k) => [k, allObs.filter((o) => sevKey(o.severity) === k).length]));

  let next = FIRST_ELEMENT + grouped.length;
  const nMaintenance = next++;
  const nMoisture = next++;
  const nLimitations = next++;
  const nDisclosure = next++;
  const hasTerms = Boolean(brand.termsText || brand.termsUrl);
  const nTerms = next++;

  const notInspected = NZ_AREA_KEYS.filter((k) => {
    const v = areaValue(conditions, k);
    return v === "no" || v === "limited";
  });
  const disclosureInspector = nzs.disclosure?.inspector?.trim() || inspectorName;
  const disclosureCompany = nzs.disclosure?.company?.trim() || brand.name;
  const ratingLabel = (key: string) => NZ_RATING_LABELS[key] ?? ratingCategoryLabel(T, key);

  return (
    <article
      lang="en-NZ"
      className="bg-white rounded-xl border border-concrete overflow-hidden print:border-0 print:rounded-none print:shadow-none report-article"
    >
      {/* ═══ COVER ═══ */}
      <section className="rpt-cover">
        <div className="flex flex-col items-center text-center px-8 py-12 print:py-0">
          {brand.logoUrl ? (
            <div className="mb-5 print:mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brand.logoUrl} alt={brand.name} className="h-20 w-auto print:h-24" />
            </div>
          ) : null}
          <p className="text-xs font-semibold tracking-[0.2em] text-navy mb-2">{brand.nameUpper}</p>
          <h1 className="text-3xl font-bold text-navy mb-2">Property inspection report</h1>
          <p className="text-sm text-fog mb-3">Prepared in accordance with NZS 4306:2005</p>
          <p className="text-xl text-ink mb-6">{insp.address}</p>
          {coverPhotoUrl ? (
            <div className="w-full max-w-2xl h-64 sm:h-80 rounded-lg overflow-hidden mb-8 bg-concrete/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverPhotoUrl} alt="Cover photo" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full max-w-2xl h-64 rounded-lg border-2 border-dashed border-concrete flex items-center justify-center mb-8 text-fog text-sm">
              No cover photo
            </div>
          )}
          <div className="flex justify-around w-full max-w-lg text-center border-t border-concrete pt-5">
            <CoverFact label="Client" value={insp.customer_name} />
            <CoverFact label="Date of inspection" value={inspectionDate} />
            <CoverFact label="Inspector" value={inspectorName} />
          </div>
        </div>
      </section>

      {/* ═══ 1. EXECUTIVE SUMMARY ═══ */}
      <section className={SECTION}>
        <Heading n={1}>Executive summary</Heading>
        {report.ai_summary?.introduction ? <Para>{report.ai_summary.introduction}</Para> : null}

        <h3 className="text-sm font-semibold text-navy mb-2 mt-6">Significant defects</h3>
        {significant.length === 0 ? (
          <Para>{NO_SIGNIFICANT_DEFECTS}</Para>
        ) : (
          <>
            {nzs.significant_defects_summary?.trim() ? <Para>{nzs.significant_defects_summary}</Para> : null}
            <ItemTable
              rows={significant.map((o) => ({
                ref: obsRef.get(o.id) ?? "",
                location: obsLocation.get(o.id) ?? "",
                item: o.title,
                action: o.suggestion,
              }))}
              actionHeading="Recommended action"
            />
          </>
        )}

        <h3 className="text-sm font-semibold text-navy mb-2 mt-6">Summary of findings</h3>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {SEV_KEYS.map((sev) => (
            <div key={sev} className="rounded-lg p-3 border-l-4" style={{ borderLeftColor: sevColors[sev].color }}>
              <div className="text-2xl font-bold" style={{ color: sevColors[sev].color }}>
                {counts[sev]}
              </div>
              <div className="text-xs text-fog">{sevText[sev].label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 mb-6">
          {SEV_KEYS.map((sev) => (
            <p key={sev} className="text-xs text-ink/80 leading-relaxed">
              <strong style={{ color: sevColors[sev].color }}>{sevText[sev].label}:</strong> {sevText[sev].description}
            </p>
          ))}
        </div>

        {report.ai_summary?.conclusion ? (
          <>
            <h3 className="text-sm font-semibold text-navy mb-2">Conclusion</h3>
            <Para>{report.ai_summary.conclusion}</Para>
          </>
        ) : null}
      </section>

      {/* ═══ 2. CERTIFICATE OF INSPECTION ═══ */}
      <section className={SECTION}>
        <Heading n={2}>Certificate of Inspection</Heading>
        <p className="text-xs uppercase tracking-wider text-fog mb-4">NZS 4306:2005</p>
        <table className="w-full text-sm mb-6">
          <tbody className="divide-y divide-concrete/50">
            <Row label="Client" value={insp.customer_name} />
            <Row label="Site address" value={siteAddress(insp)} />
            {legalDescription ? <Row label="Legal description" value={legalDescription} /> : null}
            <Row label="Inspector" value={inspectorName} />
            <Row label="Qualifications" value={qualifications?.trim() || "Not recorded"} />
            <Row label="Company" value={brand.name} />
            <Row label="Date of inspection" value={inspectionDate} />
          </tbody>
        </table>
        <h3 className="text-sm font-semibold text-navy mb-2">Areas inspected</h3>
        <table className="w-full text-sm mb-4 rpt-keep">
          <thead>
            <tr className="border-b border-concrete text-left">
              <th className="py-1.5 pr-4 font-semibold text-ink">Area</th>
              <th className="py-1.5 font-semibold text-ink w-1/4">Inspected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-concrete/50">
            {NZ_AREA_KEYS.map((key) => {
              const v = areaValue(conditions, key);
              return <Row key={key} label={NZ_AREA_LABELS[key]} value={v ? NZ_AREA_VALUE_LABELS[v] : "Not recorded"} />;
            })}
          </tbody>
        </table>
        <Para>
          {`Any limitations to the coverage of this inspection are set out in section ${nLimitations} (Limitations and areas not inspected).`}
        </Para>
        <Para>
          I certify that I carried out the inspection of the property at the site address above on the date stated, and
          that this report has been prepared in accordance with NZS 4306:2005.
        </Para>
        <div className="mt-10 grid grid-cols-2 gap-8 text-sm rpt-keep">
          <div>
            <div className="border-b border-ink/60 h-10" />
            <p className="mt-1 text-xs text-fog">Signature</p>
            <p className="text-ink">{inspectorName}</p>
          </div>
          <div>
            <div className="border-b border-ink/60 h-10 flex items-end pb-1 text-ink">
              {reportGeneratedAt ? formatReportDateNz(reportGeneratedAt) : ""}
            </div>
            <p className="mt-1 text-xs text-fog">Date</p>
          </div>
        </div>
      </section>

      {/* ═══ 3. PROPERTY AND INSPECTION CONDITIONS ═══ */}
      <section className={SECTION}>
        <Heading n={3}>Property and inspection conditions</Heading>
        <table className="w-full text-sm mb-6">
          <tbody className="divide-y divide-concrete/50">
            <Row label="Site address" value={siteAddress(insp)} />
            {legalDescription ? <Row label="Legal description" value={legalDescription} /> : null}
            {propData.tegund ? <Row label="Property type" value={String(propData.tegund)} /> : null}
            {yearBuilt ? <Row label="Year built (approx.)" value={String(yearBuilt)} /> : null}
            {propData.staerd_m2 ? <Row label="Floor area" value={`${propData.staerd_m2} m²`} /> : null}
            <Row label="Date of inspection" value={inspectionDate} />
            {conditions.weather?.trim() || insp.weather ? (
              <Row label="Weather" value={conditions.weather?.trim() || insp.weather} />
            ) : null}
            {occupancyLabel(conditions.occupancy) ? <Row label="Occupancy" value={occupancyLabel(conditions.occupancy)} /> : null}
            {furnishedLabel(conditions.furnished) ? <Row label="Furnishing" value={furnishedLabel(conditions.furnished)} /> : null}
            {insp.attendees?.length > 0 ? <Row label="Present" value={insp.attendees.join(", ")} /> : null}
            {conditions.meter?.trim() ? <Row label="Moisture meter" value={conditions.meter.trim()} /> : null}
          </tbody>
        </table>
        {report.ai_summary?.property_description ? (
          <>
            <h3 className="text-sm font-semibold text-navy mb-2">Building description</h3>
            <Para>{report.ai_summary.property_description}</Para>
          </>
        ) : null}
      </section>

      {/* ═══ ELEMENT SECTIONS ═══ */}
      {grouped.map((group, gi) => {
        const n = FIRST_ELEMENT + gi;
        return (
          <section key={group.key} className={SECTION}>
            <Heading n={n}>{NZ_SECTION_LABELS[group.key as NzSectionKey]}</Heading>
            {group.rooms.map((room) => {
              const photos = roomPhotos[room.slug] ?? [];
              const ratings = orderedRatings(room.slug, room.ratings);
              const showRoomTitle = group.rooms.length > 1 || roomTitle(room) !== NZ_SECTION_LABELS[group.key];
              return (
                <div key={room.slug} className="mb-8 last:mb-0">
                  {showRoomTitle ? <h3 className="text-base font-semibold text-navy mb-3">{roomTitle(room)}</h3> : null}
                  {photos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 mb-4 print:break-inside-avoid">
                      {photos.map((p) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={p.id} src={p.url} alt={p.caption ?? ""} className="w-full h-28 object-contain rounded rpt-photo bg-stone-100" />
                      ))}
                    </div>
                  ) : null}
                  {ratings.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 bg-stone-50 rounded p-3 mb-4 text-xs print:break-inside-avoid">
                      {ratings.map(([key, value]) => (
                        <div key={key} className="flex justify-between py-0.5">
                          <span className="text-fog">{ratingLabel(key)}</span>
                          <span className="font-semibold" style={{ color: ratingColor(value) }}>
                            {roomRating[value] ?? value}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {room.notes ? (
                    <div className="bg-amber-50 rounded p-3 mb-4 text-sm">
                      <strong>Inspector&apos;s notes:</strong> {room.notes}
                    </div>
                  ) : null}
                  {(room.observations ?? []).length > 0 ? (
                    <div className="space-y-4 print:space-y-3">
                      {room.observations.map((obs) => {
                        const key = sevKey(obs.severity);
                        const sev = sevColors[key];
                        const oPhotos = obsPhotos[obs.id] ?? [];
                        return (
                          <div
                            key={obs.id}
                            className="rounded-lg p-4 border-l-4 bg-white shadow-[0_0_2px_rgba(0,0,0,0.04)]"
                            style={{ borderLeftColor: sev.color }}
                          >
                            <div className="flex items-baseline gap-2 flex-wrap mb-1 rpt-obs-title">
                              <span className="font-bold text-navy text-sm">{obsRef.get(obs.id)}</span>
                              <span className="font-semibold text-sm text-ink flex-1">{obs.title}</span>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: sev.bg, color: sev.color }}>
                                {sevText[key].label}
                              </span>
                            </div>
                            {obs.category ? (
                              <p className="text-[10px] uppercase tracking-wider text-fog mb-2">{reportCategoryLabel(T, obs.category)}</p>
                            ) : null}
                            {obs.description ? <p className="text-sm text-ink/80 leading-relaxed mb-2">{obs.description}</p> : null}
                            {obs.suggestion ? (
                              <div className="bg-stone-50 rounded px-3 py-2 mt-2 rpt-keep">
                                <p className="text-sm text-ink/80">
                                  <strong className="text-navy">Recommendation:</strong> {obs.suggestion}
                                </p>
                              </div>
                            ) : null}
                            {oPhotos.length > 0 ? (
                              <div className="grid grid-cols-3 gap-2 mt-3 items-start">
                                {oPhotos.map((p) => (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img key={p.id} src={p.url} alt={p.caption ?? ""} className="w-full h-28 object-contain rounded rpt-photo bg-stone-100" />
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-fog italic">No defects or maintenance items were recorded.</p>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}

      {/* ═══ GRADUAL DETERIORATION AND MAINTENANCE ═══ */}
      <section className={SECTION}>
        <Heading n={nMaintenance}>Gradual deterioration and maintenance</Heading>
        {maintenance.length === 0 ? (
          <Para>No maintenance items were recorded.</Para>
        ) : (
          <>
            {nzs.maintenance_summary?.trim() ? <Para>{nzs.maintenance_summary}</Para> : null}
            <ItemTable
              rows={maintenance.map((o) => ({
                ref: obsRef.get(o.id) ?? "",
                location: obsLocation.get(o.id) ?? "",
                item: o.title,
                action: o.suggestion,
              }))}
              actionHeading="Recommended maintenance"
            />
          </>
        )}
      </section>

      {/* ═══ MOISTURE READINGS ═══ */}
      <section className={SECTION_FLOW}>
        <Heading n={nMoisture}>Moisture readings</Heading>
        {/* Stutt tafla helst með inngangi sínum á einni síðu; löng tafla má klofna milli lína. */}
        <div className={moisture.length <= 12 ? "rpt-keep" : undefined}>
          <Para>
            Non-invasive moisture readings were taken at selected locations. Readings are indicative only and depend on the
            meter and scale used; they are reported here as recorded by the inspector. Elevated or wet readings should be
            investigated further by a specialist, which may require invasive testing.
          </Para>
          {conditions.meter?.trim() ? (
            <p className="text-sm text-ink/80 mb-4">
              <strong className="text-navy">Meter:</strong> {conditions.meter.trim()}
            </p>
          ) : null}
          {moisture.length === 0 ? (
            <Para>No moisture readings were recorded in the inspector&apos;s notes.</Para>
          ) : (
            <table className="w-full text-sm rpt-moisture">
              <thead>
                <tr className="border-b border-concrete text-left">
                  <th className="py-1.5 pr-3 font-semibold text-ink">Area / location</th>
                  <th className="py-1.5 pr-3 font-semibold text-ink">Reading</th>
                  <th className="py-1.5 pr-3 font-semibold text-ink">Scale / unit</th>
                  <th className="py-1.5 font-semibold text-ink">Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-concrete/50">
                {moisture.map((row, i) => (
                  <tr key={`${row.source_id}-${i}`}>
                    <td className="py-1.5 pr-3 text-ink">
                      {row.location}
                      {obsRef.has(row.source_id) ? <span className="text-fog"> (see {obsRef.get(row.source_id)})</span> : null}
                    </td>
                    <td className="py-1.5 pr-3 text-ink font-semibold">{row.reading}</td>
                    <td className="py-1.5 pr-3 text-ink">{row.unit || "—"}</td>
                    <td className="py-1.5 text-ink">{capitalise(row.assessment) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ═══ LIMITATIONS AND AREAS NOT INSPECTED ═══ */}
      <section className={SECTION}>
        <Heading n={nLimitations}>Limitations and areas not inspected</Heading>
        <h3 className="text-sm font-semibold text-navy mb-2">Limitations recorded by the inspector</h3>
        {conditions.limitations?.trim() ? (
          <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line mb-6 rpt-limitations">{conditions.limitations}</p>
        ) : (
          <Para>No additional limitations were recorded by the inspector.</Para>
        )}
        {notInspected.length > 0 ? (
          <>
            <h3 className="text-sm font-semibold text-navy mb-2">Areas not inspected or with limited access</h3>
            <ul className="list-disc pl-5 text-sm text-ink/80 mb-6">
              {notInspected.map((k) => {
                const v = areaValue(conditions, k);
                return (
                  <li key={k}>
                    {NZ_AREA_LABELS[k]}: {v ? NZ_AREA_VALUE_LABELS[v] : ""}
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
        <h3 className="text-sm font-semibold text-navy mb-2">Scope of this inspection</h3>
        {/* LÖGFRÆÐILEG YFIRFERÐ: hlutlaus NZ-texti, drög til yfirlestrar. */}
        <div className="space-y-2 text-sm text-ink/80 leading-relaxed">
          <p>
            This inspection was a visual, non-invasive inspection of the accessible parts of the property on the date of
            inspection. It reports on the condition seen at that time and is not a guarantee that the property is free of
            defects.
          </p>
          <p>
            Areas that were concealed, covered or inaccessible were not inspected, for example inside wall cavities,
            under floor coverings, behind fixed furniture or stored goods, and parts of the roof, roof space or subfloor
            that could not be accessed safely.
          </p>
          <p>
            Services such as electrical, plumbing, drainage, gas and heating were inspected visually only where they were
            accessible; they were not tested. A licensed tradesperson should be engaged to assess their condition or
            compliance.
          </p>
          <p>
            Moisture readings are indicative only. Weathertightness problems and moisture damage can be present without
            visible signs.
          </p>
          <p>
            This report is not an assessment of compliance with the Building Code, and it does not confirm whether building
            consents or code compliance certificates exist. These can be checked with the local council, for example
            through a LIM report.
          </p>
          {yearBuilt && yearBuilt < 2000 ? (
            <p>
              Buildings constructed before 2000 may contain asbestos-containing materials. Asbestos cannot be identified by
              visual inspection; testing by a qualified person is recommended before any renovation or demolition work.
            </p>
          ) : null}
          <p>
            This report has been prepared for the client named on the Certificate of Inspection and should not be relied
            on by any other party.
          </p>
        </div>
      </section>

      {/* ═══ AI DISCLOSURE (fastur texti, aldrei AI) ═══ */}
      <section className={SECTION_FLOW}>
        <Heading n={nDisclosure}>Use of AI in this report</Heading>
        <div className="border-l-4 border-navy bg-stone-50 rounded-sm px-5 py-4 rpt-keep rpt-disclosure">
          <p className="text-sm text-ink/90 leading-relaxed">
            {`Report text drafted with AI assistance from the inspector's notes and photos. All observations, ratings and conclusions were made and reviewed by ${disclosureInspector}, ${disclosureCompany}.`}
          </p>
          <p className="text-xs text-fog leading-relaxed mt-2">
            Moisture readings and the inspector&apos;s limitations are reproduced from the inspector&apos;s own notes, and
            readings are checked against those notes before they are included.
            {nzs.disclosure?.model ? ` Drafting model: ${nzs.disclosure.model}.` : ""}
            {nzs.disclosure?.generated_at ? ` Drafted ${formatReportDateNz(nzs.disclosure.generated_at)}.` : ""}
          </p>
        </div>
        {!hasTerms && brand.logoUrl ? (
          <div className="text-center mt-8 print:mt-5 print:break-inside-avoid">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brand.logoUrl} alt={brand.name} className="h-16 w-auto mx-auto print:h-14" />
          </div>
        ) : null}
      </section>

      {/* ═══ COMPANY TERMS ═══ */}
      {hasTerms ? (
        <section className={`rpt-terms ${SECTION_FLOW}`}>
          <Heading n={nTerms}>{`Terms and conditions of ${brand.name}`}</Heading>
          <div className="space-y-1.5 text-[11px] leading-snug text-ink/90 print:text-[7.5pt] print:leading-[1.3]">
            {brand.termsText ? <p className="whitespace-pre-line">{brand.termsText}</p> : null}
            {brand.termsUrl ? (
              <p className="pt-2">
                {`This inspection and report are subject to the terms and conditions of ${brand.name}:`}{" "}
                <a href={brand.termsUrl} className="text-navy underline break-all">
                  {brand.termsUrl}
                </a>
              </p>
            ) : null}
          </div>
          {brand.logoUrl ? (
            <div className="text-center mt-8 print:mt-5 print:break-inside-avoid print:break-before-avoid">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brand.logoUrl} alt={brand.name} className="h-16 w-auto mx-auto print:h-14" />
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Footer — hidden in print */}
      <div className="px-8 py-4 border-t border-concrete bg-stone-50/30 text-xs text-fog print:hidden">
        <span>
          {T.reportCreated} {reportGeneratedAt ? formatReportDateNz(reportGeneratedAt) : "—"}
        </span>
      </div>
    </article>
  );
}

/** Orð skoðunarmannsins óbreytt, aðeins fyrsti stafur hástafur í töflunni. */
function capitalise(text: string | null | undefined): string {
  const t = (text ?? "").trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

function roomTitle(room: { name: string; slug: string }): string {
  const base = nzBaseSlug(room.slug);
  return room.name?.trim() || (base ? NZ_ROOMS[base].label : room.slug);
}

/** „Legal description / title reference“ — tómt þegar ekkert er skráð (þá kemur engin lína). */
function legalDescriptionOf(insp: NzReportData["inspection"]): string {
  return typeof insp.fastanumer === "string" ? insp.fastanumer.trim() : "";
}

function siteAddress(insp: NzReportData["inspection"]): string {
  const place = [insp.municipality, insp.postal_code].filter((x) => x && String(x).trim()).join(" ");
  return [insp.address, place].filter(Boolean).join(", ");
}

/** Matslyklar í röð NZ-sniðmátsins, svo aðrir; „na“ og tóm gildi sleppt. */
function orderedRatings(slug: string, ratings: Record<string, string> | null | undefined): Array<[string, string]> {
  const entries = Object.entries(ratings ?? {}).filter(([, v]) => v && v !== "na");
  const base = nzBaseSlug(slug);
  const order = base ? NZ_ROOMS[base].ratings : [];
  const rank = (k: string) => {
    const i = order.indexOf(k);
    return i === -1 ? order.length : i;
  };
  return entries.sort((a, b) => rank(a[0]) - rank(b[0]));
}

function Heading({ n, children }: { n: number; children: ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-navy mb-4">
      <span className="text-sev-calm font-bold mr-2">{n}.</span>
      {children}
    </h2>
  );
}

function Para({ children }: { children: ReactNode }) {
  return <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line mb-4">{children}</p>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1.5 pr-4 text-fog w-2/5">{label}</td>
      <td className="py-1.5 text-ink">{value}</td>
    </tr>
  );
}

function CoverFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-fog">{label}</p>
      <p className="font-semibold text-ink mt-1">{value}</p>
    </div>
  );
}

function ItemTable({
  rows,
  actionHeading,
}: {
  rows: Array<{ ref: string; location: string; item: string; action: string }>;
  actionHeading: string;
}) {
  return (
    <table className="w-full text-sm mb-4">
      <thead>
        <tr className="border-b border-concrete text-left">
          <th className="py-1.5 pr-3 font-semibold text-ink w-12">Ref</th>
          <th className="py-1.5 pr-3 font-semibold text-ink">Location</th>
          <th className="py-1.5 pr-3 font-semibold text-ink">Item</th>
          <th className="py-1.5 font-semibold text-ink">{actionHeading}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-concrete/50">
        {rows.map((r) => (
          <tr key={`${r.ref}-${r.item}`}>
            <td className="py-1.5 pr-3 font-bold text-navy align-top">{r.ref}</td>
            <td className="py-1.5 pr-3 text-ink align-top">{r.location}</td>
            <td className="py-1.5 pr-3 text-ink align-top">{r.item}</td>
            <td className="py-1.5 text-ink/80 align-top">{r.action || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
