// isop skýrslusnið (report_standard = "isop"): kerfaröð fyrir Bandaríkin og Kanada. Rendrað af
// src/app/(dashboard)/dashboard/[id]/report/page.tsx í stað venjulega sniðsins þegar skýrslan er stimpluð
// „isop“ OG ai_report_data.isop er til; sömu prentstílar (src/lib/report/print-css.ts) og sama PDF-leið
// (render-pdf.ts, fótur „{Company} · Page n of N“). Nzs4306Report.tsx er EKKI snert (pixla-golden NZ).
//
// Röð (samningur: plan/rondva/ISOP-SNID-HONNUN.md §5.2): forsíða → Inspection details → How to read this report →
// Summary of deficiencies → Systems at a glance → kaflar 1–10 í fastri röð (+ Additional items) → Limitations and
// items not inspected → General exclusions → Use of AI in this report → Terms.
//
// Aðeins texti AI er úr ai_summary og isop.deficiencies_summary/maintenance_summary. Gallataflan, kerfayfirlitið
// og Deficiency-talningar eru REIKNUÐ úr athugasemdum skoðunarmanns (src/lib/report/systems/), aldrei af AI.
// Status kerfa, ástæður, „describe“-gildi, takmarkanir og merki eru orð skoðunarmannsins og prentast orðrétt.
// Skýrslan er DRÖG þar til „Sign & issue“ (vef #46) kemur: forsíðan segir „Draft — not yet issued“ og
// yfirlýsingin „Not yet reviewed or issued“.
//
// Sniðið lofar ALDREI samræmi við staðal, vottun eða viðurkenningu; InterNACHI/ASHI/TREC eru ekki nefnd í föstum
// texta; engin kostnaðaráætlun, enginn líftími, engin kaupráðgjöf. Prófað sjálfvirkt (scripts/verify-report-isop.cjs).
//
// LÖGFRÆÐILEG YFIRFERÐ + BANDARÍSKUR YFIRLESTUR: allur fastur texti hér að neðan (How to read, General exclusions,
// blýmálning, AI-yfirlýsing) er okkar eigin orð og drög — sjá merkingar [YFIRLESTUR] í samningnum.

import type { ReactNode } from "react";
import { formatReportDateFor, type EnglishVariant } from "@/lib/report/english-variant";
import { REPORT_COPY, reportCategoryLabel } from "@/lib/report/i18n";
import type { ReportBranding } from "@/lib/report/branding";
import {
  ISOP_CATALOG,
  ISOP_TERMS,
  SYSTEM_STATUS_LABELS,
  buildDeficiencySummary,
  deficiencyCategoryOf,
  groupRoomsBySystem,
  systemOverview,
  systemsDataFrom,
  type DeficiencyCategory,
  type SystemDef,
  type SystemRoom,
} from "@/lib/report/systems";
import {
  ISOP_LEAD_PAINT_YEAR,
  ISOP_RATING_VALUE_LABELS,
  firstSentences,
  isopConditionsOf,
  isopRatingKeyLabel,
  isopSizeLine,
  isopTagsOf,
  isopVariantOf,
  type IsopReportData,
} from "@/lib/report/isop";
import { furnishedLabel, occupancyLabel, yearBuiltOf } from "@/lib/report/nzs4306";

export interface IsopReportPhoto {
  id: string;
  url: string;
  caption: string | null;
}

export interface IsopReportInput {
  inspection: {
    address: string;
    postal_code: string;
    municipality: string;
    customer_name: string;
    inspection_date: string;
    weather: string;
    attendees: string[];
    property_data: Record<string, unknown>;
  };
  ai_summary: { introduction: string; property_description: string; conclusion: string };
  rooms: Array<{
    /** Edge-fallið stimplar id (til að varpa sérsniðnum rýmum á kerfi); vantar í eldri skyndimyndum. */
    id?: string;
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
  isop?: IsopReportData;
}

export interface IsopReportProps {
  report: IsopReportInput;
  brand: ReportBranding;
  inspectorName: string;
  /** inspectors.qualifications (t.d. „IL Home Inspector Lic. …“, texti skoðunarmannsins); null = ekki skráð. */
  qualifications: string | null;
  /** Enskt afbrigði skýrslunnar (en-US eða en-CA ræður dagsetningum og stafsetningu). */
  variant: EnglishVariant;
  sevColors: Record<string, { color: string; bg: string }>;
  coverPhotoUrl: string | null;
  /** Rýmismyndir eftir slug. */
  roomPhotos: Record<string, IsopReportPhoto[]>;
  /** Athugasemdamyndir eftir athugasemdar-id. */
  obsPhotos: Record<string, IsopReportPhoto[]>;
  reportGeneratedAt: string | null;
}

const T = REPORT_COPY.en;
const SECTION = "px-8 py-8 border-t border-concrete print:border-0 print:break-before-page";
/** Stuttir kaflar halda áfram á sömu síðu. */
const SECTION_FLOW = "px-8 py-8 border-t border-concrete print:border-0 print:mt-4";
const SAFETY_COLOR = { color: "#8a1c1c", bg: "#f6e3e3" };
const NEUTRAL_COLOR = "#8a8278";
const NO_DEFICIENCIES = "No deficiencies were recorded by the inspector.";

export function IsopReport({
  report,
  brand,
  inspectorName,
  qualifications,
  variant,
  sevColors,
  coverPhotoUrl,
  roomPhotos,
  obsPhotos,
  reportGeneratedAt,
}: IsopReportProps) {
  const insp = report.inspection;
  const propData = insp.property_data ?? {};
  const isop = report.isop ?? {};
  const conditions = isopConditionsOf(isop, propData);
  const v = isopVariantOf(variant);
  const formatDate = (value: string | null | undefined) => formatReportDateFor(value, v);
  const mold = v === "en-CA" ? "mould" : "mold";
  const inspectionDate = formatDate(insp.inspection_date);
  const yearBuilt = yearBuiltOf(propData);
  const sizeLine = isopSizeLine(conditions, propData, v);

  // ── Gögn kerfa (inntak skoðunarmanns) og athugasemdir ─────────────────────────────────────────────────────
  const systemsData = systemsDataFrom({ systems: isop.systems ?? propData.systems });
  const tags = isopTagsOf(isop);
  const options = { roomMap: systemsData.room_map, tagsByObservation: tags };
  const rooms = [...(report.rooms ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const sysRooms: SystemRoom[] = rooms.map((room) => ({
    id: room.id ?? null,
    slug: room.slug,
    name: roomTitle(room),
    observations: (room.observations ?? []).map((o) => ({
      id: o.id,
      severity: o.severity,
      title: o.title,
      category: o.category,
      suggestion: o.suggestion,
    })),
  }));
  const groups = groupRoomsBySystem(rooms, ISOP_CATALOG, systemsData.room_map);
  const overview = systemOverview(systemsData, sysRooms, ISOP_CATALOG, options);
  const summary = buildDeficiencySummary(sysRooms, ISOP_CATALOG, options);

  // Athugasemdanúmer = <kafli>.<röð innan kafla>; sama númer í töflum og köflum.
  const refById = new Map<string, string>();
  for (const { system, rooms: groupRooms } of groups) {
    let n = 0;
    for (const room of groupRooms) {
      for (const obs of room.observations ?? []) {
        refById.set(obs.id, `${system.order}.${++n}`);
      }
    }
  }

  const categoryLabel = (c: DeficiencyCategory | "maintenance") => ISOP_TERMS.category[c];
  const colorOf = (c: DeficiencyCategory | "maintenance") =>
    c === "safety" ? SAFETY_COLOR : c === "major" ? sevColors.mjog_alvarleg : c === "repair" ? sevColors.alvarleg : sevColors.athugasemd;
  const ratingColor = (value: string) =>
    value === "warn" ? sevColors.athugasemd.color : value === "danger" ? sevColors.alvarleg.color : value === "mjog_alvarleg" ? sevColors.mjog_alvarleg.color : NEUTRAL_COLOR;

  const notInspected = overview.filter((row) => row.status === "not_inspected");
  const limitedSystems = overview.filter((row) => row.limitations.trim() !== "");
  const additional = groups.find((g) => g.system.key === ISOP_CATALOG.fallbackKey);
  const showAdditional = !!additional && additional.rooms.length > 0;
  const chapters = groups.filter((g) => g.system.key !== ISOP_CATALOG.fallbackKey || g.rooms.length > 0);
  const glanceRows = overview.filter((row) => row.key !== ISOP_CATALOG.fallbackKey || showAdditional);

  const disclosureInspector = isop.disclosure?.inspector?.trim() || inspectorName;
  const disclosureCompany = isop.disclosure?.company?.trim() || brand.name;
  const draftedOnRaw = isop.disclosure?.generated_at || reportGeneratedAt;
  const draftedOn = draftedOnRaw ? formatDate(draftedOnRaw) : "";
  const hasTerms = Boolean(brand.termsText || brand.termsUrl);
  const qualificationsText = qualifications?.trim() || "";
  const address = siteAddress(insp, conditions.state);

  return (
    <article
      lang={v}
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
          <h1 className="text-3xl font-bold text-navy mb-2">Home inspection report</h1>
          {/* Drög þar til „Sign & issue“ (vef #46) kemur; sniðið nefnir engan staðal. */}
          <p className="text-sm text-fog mb-3">Draft — not yet issued</p>
          <p className="text-xl text-ink mb-6">{address}</p>
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
            <CoverFact label="Inspector" value={inspectorName} note={qualificationsText} />
          </div>
        </div>
      </section>

      {/* ═══ INSPECTION DETAILS ═══ */}
      <section className={SECTION}>
        <Heading>Inspection details</Heading>
        {report.ai_summary?.introduction ? <Para>{report.ai_summary.introduction}</Para> : null}
        <table className="w-full text-sm mb-6">
          <tbody className="divide-y divide-concrete/50">
            <Row label="Property address" value={address} />
            <Row label="Client" value={insp.customer_name} />
            <Row label="Date of inspection" value={inspectionDate} />
            {propData.tegund ? <Row label="Property type" value={String(propData.tegund)} /> : null}
            {yearBuilt ? <Row label="Year built (approx.)" value={String(yearBuilt)} /> : null}
            {sizeLine ? <Row label="Size" value={sizeLine} /> : null}
            {insp.weather?.trim() ? <Row label="Weather" value={insp.weather.trim()} /> : null}
            {occupancyLabel(conditions.occupancy) ? <Row label="Occupancy" value={occupancyLabel(conditions.occupancy)} /> : null}
            {furnishedLabel(conditions.furnished) ? <Row label="Furnishing" value={furnishedLabel(conditions.furnished)} /> : null}
            {insp.attendees?.length > 0 ? <Row label="Present" value={insp.attendees.join(", ")} /> : null}
            {conditions.agreement_ref?.trim() ? <Row label="Agreement reference" value={conditions.agreement_ref.trim()} /> : null}
            <Row label="Inspector" value={inspectorName} />
            {qualificationsText ? <Row label="License / qualifications" value={qualificationsText} /> : null}
            <Row label="Company" value={brand.name} />
          </tbody>
        </table>
        {report.ai_summary?.property_description ? (
          <>
            <h3 className="text-sm font-semibold text-navy mb-2">Property description</h3>
            <Para>{report.ai_summary.property_description}</Para>
          </>
        ) : null}
      </section>

      {/* ═══ HOW TO READ THIS REPORT ═══ */}
      <section className={SECTION_FLOW}>
        <Heading>How to read this report</Heading>
        <h3 className="text-sm font-semibold text-navy mb-2">System status</h3>
        <dl className="text-sm text-ink/80 leading-relaxed space-y-1.5 mb-5">
          <Term term={SYSTEM_STATUS_LABELS.inspected}>
            The inspector looked at the accessible parts of this system on the day of the inspection.
          </Term>
          <Term term={SYSTEM_STATUS_LABELS.not_inspected}>The inspector did not inspect this system. The reason is given.</Term>
          <Term term={SYSTEM_STATUS_LABELS.not_present}>The home does not have this system.</Term>
          <Term term={ISOP_TERMS.deficiency}>
            A system shows a deficiency count when the inspector recorded at least one safety hazard, major defect or
            repair-or-replace item for it. The count is calculated from the inspector&apos;s observations. It is not a
            separate judgment.
          </Term>
        </dl>
        <h3 className="text-sm font-semibold text-navy mb-2">Categories</h3>
        <dl className="text-sm text-ink/80 leading-relaxed space-y-1.5">
          <Term term={ISOP_TERMS.category.safety} color={SAFETY_COLOR.color}>
            The inspector flagged this item as a possible risk of harm to people. Have it looked at promptly.
          </Term>
          <Term term={ISOP_TERMS.category.major} color={sevColors.mjog_alvarleg.color}>
            A significant problem with a part of the home. It usually needs attention from a qualified professional.
          </Term>
          <Term term={ISOP_TERMS.category.repair} color={sevColors.alvarleg.color}>
            A part that is damaged or not working as intended and should be repaired or replaced.
          </Term>
          <Term term={ISOP_TERMS.category.maintenance} color={sevColors.athugasemd.color}>
            Routine upkeep or minor wear that an owner can plan for. Maintenance items are listed separately from the
            deficiencies.
          </Term>
          <Term term={ISOP_TERMS.furtherEvaluation}>
            The inspector suggests that a qualified professional look more closely before you rely on the finding or
            decide how to repair it.
          </Term>
        </dl>
      </section>

      {/* ═══ SUMMARY OF DEFICIENCIES ═══ */}
      <section className={SECTION}>
        <Heading>Summary of deficiencies</Heading>
        <div className="grid grid-cols-4 gap-3 mb-6 rpt-keep">
          {(["safety", "major", "repair", "maintenance"] as const).map((c) => (
            <div key={c} className="rounded-lg p-3 border-l-4" style={{ borderLeftColor: colorOf(c).color }}>
              <div className="text-2xl font-bold" style={{ color: colorOf(c).color }}>
                {summary.counts[c]}
              </div>
              <div className="text-xs text-fog">{categoryLabel(c)}</div>
            </div>
          ))}
        </div>
        {report.ai_summary?.conclusion ? (
          <>
            <h3 className="text-sm font-semibold text-navy mb-2">Overview</h3>
            <Para>{report.ai_summary.conclusion}</Para>
          </>
        ) : null}
        <h3 className="text-sm font-semibold text-navy mb-2 mt-2">Deficiencies</h3>
        {summary.rows.length === 0 ? (
          <Para>{NO_DEFICIENCIES}</Para>
        ) : (
          <>
            {isop.deficiencies_summary?.trim() ? <Para>{isop.deficiencies_summary}</Para> : null}
            <p className="text-xs text-fog leading-relaxed mb-3">
              Every safety hazard, major defect and repair-or-replace item the inspector recorded, in that order and then
              by system. Details and photos are in the numbered sections.
            </p>
            <table className="w-full text-xs mb-4">
              <thead>
                <tr className="border-b border-concrete text-left">
                  <th className="py-1.5 pr-2 font-semibold text-ink w-9">#</th>
                  <th className="py-1.5 pr-2 font-semibold text-ink w-[17%]">Category</th>
                  <th className="py-1.5 pr-2 font-semibold text-ink w-[16%]">System</th>
                  <th className="py-1.5 pr-2 font-semibold text-ink w-[13%]">Location</th>
                  <th className="py-1.5 pr-2 font-semibold text-ink w-[20%]">Item</th>
                  <th className="py-1.5 font-semibold text-ink">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-concrete/50">
                {summary.rows.map((row) => {
                  const ref = refById.get(row.observationId) ?? row.number;
                  const rec = firstSentences(row.recommendation, 2);
                  return (
                    <tr key={row.observationId}>
                      <td className="py-1.5 pr-2 font-bold text-navy align-top">{ref}</td>
                      <td className="py-1.5 pr-2 align-top">
                        <span className="font-semibold" style={{ color: colorOf(row.category).color }}>
                          {categoryLabel(row.category)}
                        </span>
                        {row.furtherEvaluation ? <span className="block text-fog">{ISOP_TERMS.furtherEvaluation}</span> : null}
                      </td>
                      <td className="py-1.5 pr-2 text-ink align-top">{row.systemLabel}</td>
                      <td className="py-1.5 pr-2 text-ink align-top">{row.roomName}</td>
                      <td className="py-1.5 pr-2 text-ink align-top">{row.title}</td>
                      <td className="py-1.5 text-ink/80 align-top">
                        {rec.text ? `${rec.text}${rec.cut ? ` (see ${ref})` : ""}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        <h3 className="text-sm font-semibold text-navy mb-2 mt-6">Maintenance items</h3>
        {summary.maintenance.length === 0 ? (
          <Para>No maintenance items were recorded.</Para>
        ) : (
          <>
            {isop.maintenance_summary?.trim() ? <Para>{isop.maintenance_summary}</Para> : null}
            <ul className="text-sm text-ink/80 leading-relaxed list-none pl-0 mb-2">
              {summary.maintenance.map((row) => (
                <li key={row.observationId} className="py-0.5 rpt-keep">
                  <span className="font-bold text-navy mr-2">{refById.get(row.observationId) ?? row.number}</span>
                  {row.title}
                  <span className="text-fog">
                    {` — ${row.systemLabel}${row.roomName && row.roomName !== row.systemLabel ? `, ${row.roomName}` : ""}`}
                  </span>
                  {row.furtherEvaluation ? <span className="text-fog">{` · ${ISOP_TERMS.furtherEvaluation}`}</span> : null}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* ═══ SYSTEMS AT A GLANCE ═══ */}
      <section className={SECTION}>
        <Heading>Systems at a glance</Heading>
        <table className="w-full text-sm mb-4 rpt-keep">
          <thead>
            <tr className="border-b border-concrete text-left">
              <th className="py-1.5 pr-3 font-semibold text-ink w-9">#</th>
              <th className="py-1.5 pr-3 font-semibold text-ink">System</th>
              <th className="py-1.5 pr-3 font-semibold text-ink w-[30%]">Status</th>
              <th className="py-1.5 font-semibold text-ink w-[30%]">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-concrete/50">
            {glanceRows.map((row) => (
              <tr key={row.key}>
                <td className="py-1.5 pr-3 font-bold text-navy align-top">{row.order}</td>
                <td className="py-1.5 pr-3 text-ink align-top">{row.label}</td>
                <td className="py-1.5 pr-3 align-top">
                  <span
                    className={row.hasDeficiency ? "font-semibold" : "text-ink"}
                    style={row.hasDeficiency ? { color: sevColors.alvarleg.color } : undefined}
                  >
                    {statusText(row)}
                  </span>
                </td>
                <td className="py-1.5 text-ink/80 align-top">
                  {row.status === "not_inspected" && row.reason.trim()
                    ? row.reason.trim()
                    : row.limitations.trim()
                      ? "Limitations noted"
                      : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-fog leading-relaxed">
          The deficiency count is calculated from the inspector&apos;s observations in each system.
        </p>
      </section>

      {/* ═══ SYSTEM SECTIONS ═══ */}
      {chapters.map(({ system, rooms: groupRooms }) => {
        const row = overview.find((o) => o.key === system.key);
        const entry = systemsData.items[system.key];
        // Rými án einkunna, athugasemda, minnispunkta og mynda fær enga undirfyrirsögn (t.d. „Water heater“ tómt undir
        // Plumbing); ef ekkert rými á kerfinu hefur efni kemur ein lína fyrir allt kerfið.
        const contentRooms = groupRooms
          .map((room) => ({ room, photos: roomPhotos[room.slug] ?? [], ratings: orderedRatings(system, room.ratings) }))
          .filter(({ room, photos, ratings }) =>
            photos.length > 0 || ratings.length > 0 || !!room.notes?.trim() || (room.observations ?? []).length > 0,
          );
        const hasContent = groupRooms.some((r) => (r.observations ?? []).length > 0 || (roomPhotos[r.slug] ?? []).length > 0);
        return (
          <section key={system.key} className={hasContent ? SECTION : SECTION_FLOW}>
            <Heading n={system.order}>{system.label}</Heading>
            <SystemStatusLine system={system} row={row} sevColors={sevColors} />
            <DescribeBox system={system} values={entry?.describe} />
            {entry?.limitations?.trim() ? (
              <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line mb-4">
                <strong className="text-navy">Limitations:</strong> {entry.limitations.trim()}
              </p>
            ) : null}
            {contentRooms.length === 0 ? (
              row?.status === "not_present" || row?.status === "not_inspected" ? (
                // Tómt rými (án undirfyrirsagnar) skilur eftir sama tóma umbúðakassa og áður: hann ræður síðuskilum á undan
                // næsta kafla, svo kerfi sem eru „Not present/Not inspected“ prentast nákvæmlega eins og fyrr.
                groupRooms.length > 0 ? <div className="mb-8 last:mb-0" /> : null
              ) : (
                <p className="text-sm text-fog italic">No observations were recorded for this system.</p>
              )
            ) : (
              contentRooms.map(({ room, photos, ratings }) => {
                const showRoomTitle = groupRooms.length > 1 || roomTitle(room) !== system.label;
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
                            <span className="text-fog">{isopRatingKeyLabel(key)}</span>
                            <span className="font-semibold" style={{ color: ratingColor(value) }}>
                              {ISOP_RATING_VALUE_LABELS[value] ?? value}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {room.notes?.trim() ? (
                      <div className="bg-amber-50 rounded p-3 mb-4 text-sm">
                        <strong>Inspector&apos;s notes:</strong> {room.notes}
                      </div>
                    ) : null}
                    {(room.observations ?? []).length > 0 ? (
                      <div className="space-y-4 print:space-y-3">
                        {room.observations.map((obs) => {
                          const category = deficiencyCategoryOf(
                            { id: obs.id, severity: obs.severity },
                            tags[obs.id],
                          );
                          const badge = category ?? "maintenance";
                          const sev = colorOf(severityCategory(obs.severity));
                          const obsTags = tags[obs.id] ?? [];
                          const oPhotos = obsPhotos[obs.id] ?? [];
                          return (
                            <div
                              key={obs.id}
                              className="rounded-lg p-4 border-l-4 bg-white shadow-[0_0_2px_rgba(0,0,0,0.04)] print:break-inside-avoid"
                              style={{ borderLeftColor: colorOf(badge).color }}
                            >
                              <div className="flex items-baseline gap-2 flex-wrap mb-1 rpt-obs-title">
                                <span className="font-bold text-navy text-sm">{refById.get(obs.id)}</span>
                                <span className="font-semibold text-sm text-ink flex-1">{obs.title}</span>
                                {badge === "safety" ? <Badge color={SAFETY_COLOR}>{ISOP_TERMS.category.safety}</Badge> : null}
                                <Badge color={sev}>{categoryLabel(severityCategory(obs.severity))}</Badge>
                                {obsTags.includes("further_evaluation") ? (
                                  <Badge color={{ color: NEUTRAL_COLOR, bg: "#f1efeb" }}>{ISOP_TERMS.furtherEvaluation}</Badge>
                                ) : null}
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
                    ) : row?.status === "not_present" || row?.status === "not_inspected" ? null : (
                      <p className="text-sm text-fog italic">No observations were recorded.</p>
                    )}
                  </div>
                );
              })
            )}
          </section>
        );
      })}

      {/* ═══ LIMITATIONS AND ITEMS NOT INSPECTED ═══ */}
      <section className={SECTION}>
        <Heading>Limitations and items not inspected</Heading>
        <h3 className="text-sm font-semibold text-navy mb-2">Systems not inspected</h3>
        {notInspected.length === 0 ? (
          <Para>No system was marked as not inspected.</Para>
        ) : (
          <ul className="list-disc pl-5 text-sm text-ink/80 mb-6">
            {notInspected.map((row) => (
              <li key={row.key}>
                <strong className="text-ink">{row.label}:</strong> {row.reason.trim() || "No reason was recorded."}
              </li>
            ))}
          </ul>
        )}
        <h3 className="text-sm font-semibold text-navy mb-2">Limitations recorded by the inspector</h3>
        {conditions.limitations?.trim() ? (
          <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line mb-4 rpt-limitations">{conditions.limitations}</p>
        ) : (
          <Para>No general limitations were recorded by the inspector.</Para>
        )}
        {limitedSystems.length > 0 ? (
          <p className="text-xs text-fog mb-1">Limitations by system</p>
        ) : null}
        {limitedSystems.length > 0 ? (
          <ul className="list-disc pl-5 text-sm text-ink/80 mb-6">
            {limitedSystems.map((row) => (
              <li key={row.key}>
                <strong className="text-ink">{row.label}:</strong> {row.limitations.trim()}
              </li>
            ))}
          </ul>
        ) : null}

        <h3 className="text-sm font-semibold text-navy mb-2 mt-6">General exclusions</h3>
        {/* LÖGFRÆÐILEG YFIRFERÐ + BANDARÍSKUR YFIRLESTUR: okkar eigin orð, ekki texti úr neinum staðli. */}
        <div className="space-y-2 text-sm text-ink/80 leading-relaxed">
          <p>
            This was a visual inspection of the parts of the home that could be reached safely on the day of the
            inspection. The inspector does not open walls, move furniture or stored items, or take equipment apart.
          </p>
          <p>
            It describes what was seen at that time. It does not predict how long any part will last, what repairs will
            cost or whether a part will fail later, and no inspection can promise that a home is free of defects.
          </p>
          <p>
            Areas that were hidden, covered or out of reach were not inspected. Problems that cannot be seen from the
            surface can exist.
          </p>
          <p>
            Equipment was assessed by sight and, where the inspector noted it, by operating its normal controls. It was
            not taken apart or tested to its limits.
          </p>
          <p>
            This is not a building code inspection. It does not say whether the home conforms to building codes, permits
            or local rules, either now or when it was built.
          </p>
          <p>
            Unless the inspector mentions them in this report, it does not cover {mold}, asbestos, lead, radon, pests,
            water or air quality, or other environmental hazards. If you are concerned about any of these, ask a qualified
            specialist to test.
          </p>
          {yearBuilt && yearBuilt < ISOP_LEAD_PAINT_YEAR ? (
            <p>{`Homes built before ${ISOP_LEAD_PAINT_YEAR} may contain lead-based paint. No paint was tested for lead.`}</p>
          ) : null}
          <p>
            This report is not an appraisal and does not give advice on whether to buy. It was prepared for the client
            named on it and should not be relied on by anyone else. It does not replace any form or statement that your
            state or province requires from an inspector.
          </p>
        </div>
      </section>

      {/* ═══ USE OF AI (fastur texti, aldrei AI) ═══ */}
      <section className={SECTION_FLOW}>
        <Heading>Use of AI in this report</Heading>
        <div className="border-l-4 border-navy bg-stone-50 rounded-sm px-5 py-4 rpt-keep rpt-disclosure">
          <p className="text-sm text-ink/90 leading-relaxed">
            {`Observations and ratings by ${disclosureInspector}, ${disclosureCompany}. Text drafted with AI assistance${draftedOn ? ` (${draftedOn})` : ""}. Not yet reviewed or issued.`}
          </p>
          <p className="text-xs text-fog leading-relaxed mt-2">
            System statuses, reasons for not inspecting, descriptions, tags and the inspector&apos;s limitations are the
            inspector&apos;s own entries and are reproduced as entered. The deficiency summary table and the systems
            overview are calculated from the inspector&apos;s observations, not written by AI.
          </p>
        </div>
        {!hasTerms && brand.logoUrl ? (
          <div className="text-center mt-8 print:mt-5 print:break-inside-avoid">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brand.logoUrl} alt={brand.name} className="h-16 w-auto mx-auto print:h-14" />
          </div>
        ) : null}
      </section>

      {/* ═══ TERMS AND STATE / PROVINCIAL STATEMENTS ═══ */}
      {hasTerms ? (
        <section className={`rpt-terms ${SECTION_FLOW}`}>
          <Heading>Terms and state or provincial statements</Heading>
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
          {T.reportCreated} {reportGeneratedAt ? formatDate(reportGeneratedAt) : "—"}
        </span>
      </div>
    </article>
  );
}

/** Alvarleiki → flokkur til birtingar á alvarleikamerki (safety er sér merki ofan á). */
function severityCategory(severity: string): "major" | "repair" | "maintenance" {
  return severity === "mjog_alvarleg" ? "major" : severity === "alvarleg" ? "repair" : "maintenance";
}

function statusText(row: { status: string | null; statusText: string }): string {
  return row.status === null ? "Not recorded" : row.statusText;
}

function roomTitle(room: { name: string; slug: string }): string {
  const name = room.name?.trim();
  if (name) return name;
  const base = room.slug.replace(/^isop-/, "").replace(/-\d+$/, "").replace(/-/g, " ");
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : room.slug;
}

/** Fullt heimilisfang: gata, borg, fylki + ZIP/postal code („123 Example Street, Anytown, IL 60000“). */
function siteAddress(insp: IsopReportInput["inspection"], state: string | undefined): string {
  const stateZip = [state?.trim(), insp.postal_code]
    .filter((x) => x && String(x).trim())
    .map((x) => String(x).trim())
    .join(" ");
  return [insp.address, insp.municipality?.trim(), stateZip].filter((x) => x && String(x).trim()).join(", ");
}

/** Matslyklar í röð kerfisins, svo aðrir; „na“ og tóm gildi sleppt. */
function orderedRatings(system: SystemDef, ratings: Record<string, string> | null | undefined): Array<[string, string]> {
  const entries = Object.entries(ratings ?? {}).filter(([, value]) => value && value !== "na");
  const rank = (key: string) => {
    const i = system.ratingKeys.indexOf(key);
    return i === -1 ? system.ratingKeys.length : i;
  };
  return entries.sort((a, b) => rank(a[0]) - rank(b[0]));
}

function SystemStatusLine({
  system,
  row,
  sevColors,
}: {
  system: SystemDef;
  row: ReturnType<typeof systemOverview>[number] | undefined;
  sevColors: Record<string, { color: string; bg: string }>;
}) {
  if (system.allowedStatuses.length === 0) return null;
  const status = row?.status ?? null;
  const color = row?.hasDeficiency ? sevColors.alvarleg.color : NEUTRAL_COLOR;
  return (
    <div className="mb-4 text-sm">
      <span className="text-fog mr-2">Status:</span>
      <span className="font-semibold" style={{ color }}>
        {row ? statusText(row) : "Not recorded"}
      </span>
      {status === "not_inspected" ? (
        <p className="text-ink/80 leading-relaxed whitespace-pre-line mt-1">
          <strong className="text-navy">Reason:</strong> {row?.reason.trim() || "No reason was recorded."}
        </p>
      ) : null}
    </div>
  );
}

function DescribeBox({ system, values }: { system: SystemDef; values: Record<string, string> | undefined }) {
  const rows = system.describe
    .map((field) => ({ label: field.label, value: values?.[field.key]?.trim() ?? "" }))
    .filter((r) => r.value !== "");
  if (rows.length === 0) return null;
  return (
    <div className="bg-stone-50 rounded p-3 mb-4 text-sm rpt-keep">
      <p className="text-[10px] uppercase tracking-wider text-fog mb-1">Description</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
        {rows.map((r) => (
          <div key={r.label} className="flex gap-2">
            <span className="text-fog">{r.label}:</span>
            <span className="text-ink">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Heading({ n, children }: { n?: number; children: ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-navy mb-4">
      {n !== undefined ? <span className="text-sev-calm font-bold mr-2">{n}.</span> : null}
      {children}
    </h2>
  );
}

function Para({ children }: { children: ReactNode }) {
  return <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line mb-4">{children}</p>;
}

function Term({ term, color, children }: { term: string; color?: string; children: ReactNode }) {
  return (
    <div className="rpt-keep">
      <dt className="inline font-semibold" style={color ? { color } : undefined}>
        {term}:
      </dt>{" "}
      <dd className="inline">{children}</dd>
    </div>
  );
}

function Badge({ color, children }: { color: { color: string; bg: string }; children: ReactNode }) {
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: color.bg, color: color.color }}>
      {children}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1.5 pr-4 text-fog w-2/5">{label}</td>
      <td className="py-1.5 text-ink">{value}</td>
    </tr>
  );
}

function CoverFact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-fog">{label}</p>
      <p className="font-semibold text-ink mt-1">{value}</p>
      {note ? <p className="text-xs text-fog mt-0.5">{note}</p> : null}
    </div>
  );
}
