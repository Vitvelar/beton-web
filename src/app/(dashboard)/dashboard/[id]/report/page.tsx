import "@/lib/report/typography.css";
import { englishVariantOf, formatAreaFor, formatReportDateFor } from "@/lib/report/english-variant";
import { reportPrintCss } from "@/lib/report/print-css";
import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  createBearerClient,
  getBearerAuthorization,
} from "@/lib/supabase/bearer";
import { createServiceClient } from "@/lib/supabase/service";
import {
  isWorkerRequest,
  WORKER_TOKEN_HEADER,
  reportTitle,
} from "@/lib/report/shared";
import type { Severity } from "@/lib/supabase/types";
import { resolveBranding } from "@/lib/report/branding";
import {
  ratingCategoryLabel,
  reportCategoryLabel,
  reportCopy,
  reportLocaleOf,
} from "@/lib/report/i18n";
import { ratingSchemeOf, reportStandardOf, type RatingScheme } from "@/lib/report/settings";
import { Nzs4306Report, type NzReportData, type NzReportPhoto } from "@/components/report/Nzs4306Report";
import { fill, format } from "@/lib/i18n/format";
import { dashboardCopy } from "@/lib/i18n/dashboard";
import { getDashboardLocale } from "@/lib/request-brand";
import type { Metadata } from "next";

interface ReportData {
  /** Tungumál skýrslunnar, stimplað við gerð hennar; vantar = íslenska. */
  report_locale?: string;
  /** Matskerfi (standard | condition_1_3 | nz_terms), stimplað við gerð; vantar = standard. */
  rating_scheme?: string;
  /** Skýrslusnið (default | nzs_4306), stimplað við gerð; vantar = núverandi snið. */
  report_standard?: string;
  /** Enskt afbrigði (en-NZ/AU/GB/IE/US/CA), stimplað við gerð; vantar = almenn enska (eins og áður). */
  english_variant?: string;
  /** NZS 4306-hluti (aðeins þegar report_standard = nzs_4306) — sjá src/lib/report/nzs4306.ts. */
  nzs4306?: NzReportData["nzs4306"];
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

const SEV_COLORS: Record<string, { color: string; bg: string }> = {
  athugasemd: { color: "#3b4ec9", bg: "#eef0fb" },
  alvarleg: { color: "#c98a2e", bg: "#fbf2e3" },
  mjog_alvarleg: { color: "#b53d3d", bg: "#fbeaea" },
};

const SEV_ICON: Record<string, string> = {
  athugasemd: "!",
  alvarleg: "−",
  mjog_alvarleg: "×",
};

// Einkunnakerfi 1–3: umferðarljós (grænt/gult/rautt) og tölur í stað tákna.
const CONDITION_COLORS: Record<string, { color: string; bg: string }> = {
  athugasemd: { color: "#2f7d4f", bg: "#e8f3ec" },
  alvarleg: { color: "#c98a2e", bg: "#fbf2e3" },
  mjog_alvarleg: { color: "#b53d3d", bg: "#fbeaea" },
};

const CONDITION_ICON: Record<string, string> = {
  athugasemd: "1",
  alvarleg: "2",
  mjog_alvarleg: "3",
};

// NZ-matsorð (nz_terms): sömu litir og tákn og núverandi kerfi — aðeins heitin breytast
// (Maintenance / Defect / Significant defect).
const NZ_COLORS = SEV_COLORS;
const NZ_ICON = SEV_ICON;

const SEV_RANK: Record<string, number> = {
  mjog_alvarleg: 0,
  alvarleg: 1,
  athugasemd: 2,
};

// Myndir eru nú minnkaðar EINU SINNI við upphal í appinu (long edge ≤ 1600px,
// JPEG) — sjá beton-app/lib/utils/image.ts. Þess vegna sækjum við geymda
// hlutinn BEINT án Supabase image-transform (Pro-kvótinn er aðeins 100/lotu og
// ein myndaþung skoðun sprengdi hann, 108/100). Gamlar (full-size) myndir
// renderast líka fínt í puppeteer, bara stærri skrá — engin transform hvort sem er.

// Sets the PDF/document title to match the download name ("Beton Ástandsskoðun -
// <heimilisfang>, <dags>") instead of the dashboard's "Stjórnborð | …" template.
// `absolute` bypasses the parent layout title template entirely.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const hdrs = await headers();
    const workerRequest = isWorkerRequest(hdrs.get(WORKER_TOKEN_HEADER));
    const authorization = workerRequest
      ? null
      : getBearerAuthorization(hdrs.get("authorization"));
    const supabase = workerRequest
      ? createServiceClient()
      : authorization
      ? createBearerClient(authorization)
      : await createClient();
    let q = supabase
      .from("inspections")
      .select("address, inspection_date, local_id, report_locale:ai_report_data->>report_locale")
      .limit(1);
    q = authorization ? q.or(`id.eq.${id},local_id.eq.${id}`) : q.eq("id", id);
    const { data } = await q.maybeSingle();
    if (data?.address) {
      return { title: { absolute: reportTitle(data.address, data.inspection_date, reportLocaleOf(data)) } };
    }
  } catch {
    // fall back to a generic title below
  }
  return { title: { absolute: "Ástandsskoðun" } };
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pdf?: string }>;
}) {
  const { id } = await params;
  // ?pdf=1 er sett af server-PDF leiðinni (report/pdf/route.ts). Þá leggur
  // puppeteer til spássíurnar (25,4mm til hliðanna o.fl.), svo við sleppum
  // láréttu og minnkum lóðréttu padding-i hér til að tvöfalda það ekki.
  const isPdfMode = (await searchParams)?.pdf === "1";
  const hdrs = await headers();
  // Bakgrunns-worker (á beton.is) rendar þessa síðu með x-report-worker-token og
  // notar service-client (RLS bypass) því hann er ekki innskráður notandi. Annars
  // óbreytt: Bearer (app) eða cookie (admin).
  const workerRequest = isWorkerRequest(hdrs.get(WORKER_TOKEN_HEADER));
  const authorization = workerRequest
    ? null
    : getBearerAuthorization(hdrs.get("authorization"));
  const supabase = workerRequest
    ? createServiceClient()
    : authorization
    ? createBearerClient(authorization)
    : await createClient();

  let query = supabase
    .from("inspections")
    .select(`
      id, local_id, address, postal_code, municipality, fastanumer,
      customer_name, inspection_date, weather, attendees,
      property_data, ai_report_data, ai_summary,
      ai_cost_usd, ai_model, report_generated_at,
      inspectors ( full_name, company_name, company_logo_url, company_terms_url, company_terms_text ),
      rooms (
        id, name, slug, sort_order, ratings, notes,
        observations (
          id, observation_number, category, title, description, suggestion, severity, sort_order,
          photos (id, storage_path, photo_type, caption, is_cover, sort_order, room_id, observation_id)
        ),
        photos (id, storage_path, photo_type, caption, is_cover, sort_order, room_id, observation_id)
      )
    `)
    .limit(1);

  query = authorization
    ? query.or(`id.eq.${id},local_id.eq.${id}`)
    : query.eq("id", id);

  const { data: inspection } = await query.maybeSingle();

  if (!inspection?.ai_report_data) {
    notFound();
  }

  const report = inspection.ai_report_data as ReportData;
  // Skýrslumálið (stimplað í skýrsluna) ræður efninu; hnapparnir efst eru hluti
  // af stjórnborðinu og fylgja viðmótsmáli notandans.
  const locale = reportLocaleOf(report);
  // Enskt afbrigði (stimplað): dagsetningar, stærð (en-US) og stafsetning fastra texta (en-US).
  // Enginn stimpill (íslenska, almenn enska, eldri skýrslur) = 'en' = nákvæmlega eins og áður.
  const variant = englishVariantOf(report);
  const formatDate = (value: string | null | undefined) => formatReportDateFor(value, variant);
  const t = reportCopy(locale, variant);
  // Matskerfið (stimplað) ræður heitum, skýringum, litum og táknum alvarleika.
  const scheme = ratingSchemeOf(report);
  const condition = scheme === "condition_1_3";
  const nzTerms = scheme === "nz_terms";
  const sevText = condition ? t.conditionSeverity : nzTerms ? t.nzSeverity : t.severity;
  const sevColors = condition ? CONDITION_COLORS : nzTerms ? NZ_COLORS : SEV_COLORS;
  const sevIcon = condition ? CONDITION_ICON : nzTerms ? NZ_ICON : SEV_ICON;
  const roomRating = condition ? t.conditionRating : nzTerms ? t.nzRating : t.rating;
  const ui = dashboardCopy(await getDashboardLocale());

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
        // Engin transform — myndir eru þegar web-stærð (minnkaðar við upphal).
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
  // Fyrirtækjamerki/-nafn skoðunarmanns (white-label); Beton-sjálfgildi ef ekkert skráð.
  const inspectorRow = Array.isArray(inspection.inspectors)
    ? inspection.inspectors[0]
    : inspection.inspectors;
  const brand = resolveBranding(inspectorRow ?? null, propData.inspectorName);
  const inspectorName = brand.inspectorName;
  const logoSrc = brand.logoUrl;
  // Skilmálar (ákvörðun eiganda 2026-09-27): Beton á íslensku fær sína eigin fullu
  // skilmála eins og áður. Öll önnur fyrirtæki (og önnur mál) fá hlutlausan kafla um
  // takmarkanir skoðunar, svo eigin skilmálatexta og/eða tengil — aldrei lagatexta Beton.
  const betonTerms = locale === "is" && brand.isBeton;

  // NZS 4306:2005 (stimplað report_standard): eigið snið á ensku, sömu prentstílar og PDF-leið.
  if (reportStandardOf(report) === "nzs_4306") {
    const en = reportCopy("en");
    const nzSevText = condition ? en.conditionSeverity : nzTerms ? en.nzSeverity : en.severity;
    const nzRoomRating = condition ? en.conditionRating : nzTerms ? en.nzRating : en.rating;
    // Réttindi skoðunarmanns (inspectors.qualifications) — sér fyrirspurn svo venjulega
    // sniðið lesi aldrei nýja dálkinn; bregst mjúklega ef hann er ekki til.
    let qualifications: string | null = null;
    try {
      const { data: q } = await supabase
        .from("inspections")
        .select("inspectors ( qualifications )")
        .eq("id", inspection.id)
        .maybeSingle();
      const row = (Array.isArray(q?.inspectors) ? q?.inspectors[0] : q?.inspectors) as { qualifications?: unknown } | null | undefined;
      qualifications = typeof row?.qualifications === "string" && row.qualifications.trim() ? row.qualifications.trim() : null;
    } catch {
      qualifications = null;
    }
    const toPhoto = (p: PhotoWithUrl): NzReportPhoto => ({ id: p.id, url: p.url, caption: p.caption });
    const nzRoomPhotos: Record<string, NzReportPhoto[]> = {};
    const nzObsPhotos: Record<string, NzReportPhoto[]> = {};
    for (const room of report.rooms) {
      const dbRoom = dbRooms.find((r) => r.slug === room.slug);
      nzRoomPhotos[room.slug] = dbRoom ? roomPhotos(dbRoom.id).map(toPhoto) : [];
      for (const obs of room.observations) nzObsPhotos[obs.id] = obsPhotos(obs.id).map(toPhoto);
    }
    return (
      <div className="max-w-4xl mx-auto print:max-w-none">
        <style dangerouslySetInnerHTML={{ __html: reportPrintCss(isPdfMode) }} />
        <ReportNav id={id} ui={ui} />
        <Nzs4306Report
          report={report}
          brand={brand}
          inspectorName={inspectorName}
          qualifications={qualifications}
          sevText={nzSevText}
          sevColors={sevColors}
          roomRating={nzRoomRating}
          ratingColor={(value) => ratingColor(value, scheme)}
          coverPhotoUrl={coverPhoto?.url ?? null}
          roomPhotos={nzRoomPhotos}
          obsPhotos={nzObsPhotos}
          reportGeneratedAt={inspection.report_generated_at ?? null}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto print:max-w-none">
      <style dangerouslySetInnerHTML={{ __html: reportPrintCss(isPdfMode) }} />

      {/* Navigation — hidden in print */}
      <ReportNav id={id} ui={ui} />

      {/* lang = tungumál skýrslunnar (getur verið annað en stjórnborðsins/hýsilsins). */}
      <article lang={locale} className="bg-white rounded-xl border border-concrete overflow-hidden print:border-0 print:rounded-none print:shadow-none report-article">

        {/* ═══ PAGE 1: COVER ═══ */}
        <section className="rpt-cover">
          <div className="flex flex-col items-center text-center px-8 py-12 print:py-0">
            {logoSrc ? (
              <div className="mb-5 print:mb-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoSrc} alt={brand.name} className="h-20 w-auto print:h-24" />
              </div>
            ) : null}
            <p className="text-xs font-semibold tracking-[0.2em] text-navy mb-2">{brand.nameUpper}</p>
            <h1 className="text-3xl font-bold text-navy mb-3">{t.coverTitle}</h1>
            <p className="text-xl text-ink mb-6">{report.inspection.address}</p>

            {coverPhoto ? (
              <div className="w-full max-w-2xl h-64 sm:h-80 rounded-lg overflow-hidden mb-8 bg-concrete/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverPhoto.url} alt={t.coverPhotoAlt} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full max-w-2xl h-64 rounded-lg border-2 border-dashed border-concrete flex items-center justify-center mb-8 text-fog text-sm">
                {t.noCoverPhoto}
              </div>
            )}

            <div className="flex justify-around w-full max-w-lg text-center border-t border-concrete pt-5">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-fog">{t.customer}</p>
                <p className="font-semibold text-ink mt-1">{report.inspection.customer_name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-fog">{t.inspectionDate}</p>
                <p className="font-semibold text-ink mt-1">{formatDate(report.inspection.inspection_date)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-fog">{t.inspector}</p>
                <p className="font-semibold text-ink mt-1">{inspectorName}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ PAGE 2: EFNISYFIRLIT (TOC) ═══ */}
        <section className="px-8 py-8 border-t border-concrete print:border-0 print:break-before-page">
          <h2 className="text-2xl font-bold text-navy mb-2">{t.toc}</h2>
          <div className="h-0.5 bg-navy mb-6" />
          <div className="space-y-0">
            <TocRow num="M" name={t.tocIntro} />
            <TocRow num="1" name={t.tocSummary} />
            {report.rooms.map((room, idx) => (
              <TocRow key={room.slug} num={String(idx + 2)} name={format(t.tocRoom, { name: room.name })} />
            ))}
            {rankedObs.length > 0 && (
              <TocRow num={String(report.rooms.length + 2)} name={t.tocActionList} />
            )}
            <TocRow
              num={String(report.rooms.length + 2 + (rankedObs.length > 0 ? 1 : 0))}
              name={t.tocTerms}
            />
          </div>
        </section>

        {/* ═══ PAGE 3: INTRO + MATSKERFI ═══ */}
        <section className="px-8 py-8 border-t border-concrete print:border-0 print:break-before-page">
          <div className="border-l-4 border-navy bg-stone-50 rounded-sm px-6 py-5 mb-8">
            <h2 className="text-lg font-bold text-navy mb-3">{fill(t.introHeading, { company: brand.name })}</h2>
            <p className="text-sm text-ink/80 leading-relaxed mb-3">
              {fill(t.introPurpose, { company: brand.name })}
            </p>
            {brand.termsUrl ? (
              <p className="text-sm text-ink/80">
                {t.termsLinkBefore}{" "}
                <a href={brand.termsUrl} className="text-navy underline">
                  {fill(t.termsLinkText, { company: brand.name })}
                </a>
              </p>
            ) : null}
          </div>

          <h2 className="text-lg font-bold text-navy mb-3">
            <span className="text-sev-calm font-bold mr-2">M.</span>{t.ratingSystem}
          </h2>
          <p className="text-sm text-ink/80 leading-relaxed mb-2">
            {condition ? t.conditionRatingSystemHow : nzTerms ? t.nzRatingSystemHow : t.ratingSystemHow}
          </p>
          <p className="text-sm text-ink/80 leading-relaxed mb-6">
            {condition ? t.conditionRatingSystemTypes : nzTerms ? t.nzRatingSystemTypes : t.ratingSystemTypes}
          </p>

          <div className="space-y-6">
            {(["athugasemd", "alvarleg", "mjog_alvarleg"] as const).map((sev) => (
              <div key={sev} className="flex items-start gap-4 print:break-inside-avoid">
                <div
                  className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: sevColors[sev].color }}
                >
                  {sevIcon[sev]}
                </div>
                <div className="pt-1">
                  <p className="font-bold text-sm" style={{ color: sevColors[sev].color }}>
                    {sevText[sev].label}
                  </p>
                  <p className="text-sm text-ink/80 leading-relaxed mt-0.5">
                    {sevText[sev].description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ PAGE 4: SAMANTEKT ═══ */}
        <section className="px-8 py-8 border-t border-concrete print:border-0 print:break-before-page">
          <h2 className="text-lg font-bold text-navy mb-6">
            <span className="text-sev-calm font-bold mr-2">1.</span>{t.summary}
          </h2>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-navy mb-2">{t.introduction}</h3>
            <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">
              {report.ai_summary.introduction}
            </p>
          </div>

          {report.ai_summary.property_description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-navy mb-2">{t.propertyDescription}</h3>
              <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">
                {report.ai_summary.property_description}
              </p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-navy mb-2">{t.conclusion}</h3>
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
                style={{ borderLeftColor: sevColors[sev].color }}
              >
                <div className="text-2xl font-bold" style={{ color: sevColors[sev].color }}>
                  {sevCounts[sev]}
                </div>
                <div className="text-xs text-fog">{sevText[sev].short}</div>
              </div>
            ))}
          </div>

          {/* Property info table */}
          <h3 className="text-sm font-semibold text-navy mb-2 mt-6">{t.property}</h3>
          <table className="w-full text-sm mb-6">
            <tbody className="divide-y divide-concrete/50">
              <InfoTableRow label={t.address} value={report.inspection.address} />
              <InfoTableRow
                label={t.postcode}
                value={`${report.inspection.postal_code}${report.inspection.municipality ? " " + report.inspection.municipality : ""}`}
              />
              {report.inspection.fastanumer && (
                <InfoTableRow label={t.propertyId} value={report.inspection.fastanumer} />
              )}
              {propData.tegund ? <InfoTableRow label={t.propertyType} value={String(propData.tegund)} /> : null}
              {propData.staerd_m2 ? <InfoTableRow label={t.size} value={formatAreaFor(propData.staerd_m2, variant)} /> : null}
              {propData.byggingarar ? <InfoTableRow label={t.yearBuilt} value={String(propData.byggingarar)} /> : null}
              {propData.byggingarafangi ? <InfoTableRow label={t.buildStage} value={String(propData.byggingarafangi)} /> : null}
            </tbody>
          </table>

          <h3 className="text-sm font-semibold text-navy mb-2">{t.inspection}</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-concrete/50">
              <InfoTableRow label={t.customer} value={report.inspection.customer_name} />
              <InfoTableRow label={t.inspectionDate} value={formatDate(report.inspection.inspection_date)} />
              <InfoTableRow label={t.inspector} value={inspectorName} />
              {report.inspection.attendees?.length > 0 && (
                <InfoTableRow label={t.attendees} value={report.inspection.attendees.join(", ")} />
              )}
              {report.inspection.weather && (
                <InfoTableRow label={t.weather} value={report.inspection.weather} />
              )}
              <InfoTableRow label={t.roomCount} value={String(report.rooms.length)} />
              <InfoTableRow label={t.observationCount} value={String(totalObs)} />
              <InfoTableRow label={t.photoCount} value={String(photosWithUrls.length)} />
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
                    <img key={p.id} src={p.url} alt={p.caption ?? ""} className="w-full h-28 object-contain rounded rpt-photo bg-stone-100" />
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
                        <span className="text-fog capitalize">{ratingCategoryLabel(t, key)}</span>
                        <span className="font-semibold" style={{ color: ratingColor(value, scheme) }}>
                          {roomRating[value] ?? value}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {/* Room notes */}
              {room.notes && (
                <div className="bg-amber-50 rounded p-3 mb-4 text-sm">
                  <strong>{t.roomNotes}</strong> {room.notes}
                </div>
              )}

              {/* Observations */}
              {room.observations.length > 0 ? (
                <div className="space-y-4 print:space-y-3">
                  {room.observations.map((obs, obsIdx) => {
                    const sevKey = obs.severity in sevColors ? obs.severity : "athugasemd";
                    const sev = sevColors[sevKey];
                    const oPhotos = obsPhotos(obs.id);
                    return (
                      <div
                        key={obs.id}
                        className="rounded-lg p-4 border-l-4 bg-white shadow-[0_0_2px_rgba(0,0,0,0.04)]"
                        style={{ borderLeftColor: sev.color }}
                      >
                        <div className="flex items-baseline gap-2 flex-wrap mb-1 rpt-obs-title">
                          <span className="font-bold text-navy text-sm">
                            {roomIdx + 2}.{obsIdx + 1}
                          </span>
                          <span className="font-semibold text-sm text-ink flex-1">{obs.title}</span>
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded"
                            style={{ backgroundColor: sev.bg, color: sev.color }}
                          >
                            {sevText[sevKey].label}
                          </span>
                        </div>
                        {obs.category && (
                          <p className="text-[10px] uppercase tracking-wider text-fog mb-2">{reportCategoryLabel(t, obs.category)}</p>
                        )}
                        {obs.description && (
                          <p className="text-sm text-ink/80 leading-relaxed mb-2">{obs.description}</p>
                        )}
                        {obs.suggestion && (
                          <div className="bg-stone-50 rounded px-3 py-2 mt-2 rpt-keep">
                            <p className="text-sm text-ink/80">
                              <strong className="text-navy">{t.suggestion}</strong> {obs.suggestion}
                            </p>
                          </div>
                        )}
                        {oPhotos.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-3 items-start">
                            {oPhotos.map((p) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={p.id} src={p.url} alt={p.caption ?? ""} className="w-full h-28 object-contain rounded rpt-photo bg-stone-100" />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-fog italic">{t.noObservations}</p>
              )}
            </section>
          );
        })}

        {/* ═══ VERKEFNALISTI ═══ */}
        {rankedObs.length > 0 && (
          <section className="px-8 py-8 border-t border-concrete print:border-0 print:break-before-page">
            <h2 className="text-lg font-bold text-navy mb-2">
              <span className="text-sev-calm font-bold mr-2">{report.rooms.length + 2}.</span>
              {t.actionList}
            </h2>
            <p className="text-sm text-ink/80 mb-4">
              {t.actionListIntro}
            </p>
            <div className="space-y-3">
              {rankedObs.map(({ obs, roomName }, i) => {
                const sevKey = obs.severity in sevColors ? obs.severity : "athugasemd";
                const sev = sevColors[sevKey];
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
                        {sevText[sevKey].label}
                      </span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-fog mb-1">
                      {roomName}{obs.category ? ` · ${reportCategoryLabel(t, obs.category)}` : ""}
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
            {fill(t.termsHeading, { company: brand.name })}
          </h2>
          <div className="h-0.5 bg-navy mb-4" />

          {betonTerms ? (
          <div className="space-y-1.5 text-[11px] leading-snug text-ink/90 print:text-[7.5pt] print:leading-[1.3]">
            <TermsSection n={1} title="Markmið og gildissvið">
              Markmið ástandsskoðunar er að veita verkkaupa upplýsingar um almennt og sýnilegt ástand fasteignar á
              þeim tímapunkti sem skoðun fer fram. Ástandsskoðun byggir á hlutlausri skoðun og stöðluðum verkferlum
              {" "}{brand.name} og er ætluð til upplýsingaöflunar vegna fasteignaviðskipta eða mats á ástandi eigin eignar.
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
              Dreifing eða afhending skýrslu til þriðja aðila er óheimil nema með skriflegu samþykki {brand.name}
            </TermsSection>
            <TermsSection n={7} title="Takmörkun ábyrgðar">
              Ábyrgð {brand.name} og starfsmanna þess vegna ástandsskoðunar, skýrslugerðar eða athugasemda takmarkast,
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
              ekki sýnilegir eða aðgengilegir á skoðunartíma. Slíkir gallar falla utan ábyrgðar {brand.name}
            </TermsSection>
            <TermsSection n={10} title="Hlutleysi og fagmennska">
              Skoðunarmaður starfar sem hlutlaus matsaðili, af heilindum og fagmennsku, og hefur engra annarra
              hagsmuna að gæta en að vinna verk sitt á faglegan hátt samkvæmt bestu vitund.
            </TermsSection>
            <TermsSection n={11} title="Greiðsla og afhending skýrslu vegna ástandsskoðunar">
              Greitt er fyrir ástandsskoðun ásamt skýrslu ekki seinna en 24 klst. fyrir áætlaða skoðun og fer
              ástandsskoðun ekki fram nema greiðsla hafi borist að fullu innan tilskilins frests. Skýrsla vegna
              ástandsskoðunar er afhent innan 48 klst. frá framkvæmd skoðunar, nema um annað hafi verið samið
              skriflega. Skilmálar þessir gilda fyrir allar ástandsskoðanir sem {brand.name} framkvæmir nema annað sé
              sérstaklega samið skriflega.
            </TermsSection>
          </div>
          ) : (
            <div className="space-y-1.5 text-[11px] leading-snug text-ink/90 print:text-[7.5pt] print:leading-[1.3]">
              <h3 className="font-bold text-xs text-ink mt-2 mb-0.5 print:mt-2 print:mb-0.5 print:text-[8.5pt]">
                {t.limitationsHeading}
              </h3>
              {t.limitations.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {brand.termsText ? (
                <>
                  <h3 className="font-bold text-xs text-ink mt-4 mb-0.5 print:mt-3 print:mb-0.5 print:text-[8.5pt]">
                    {fill(t.ownTermsHeading, { company: brand.name })}
                  </h3>
                  <p className="whitespace-pre-line">{brand.termsText}</p>
                </>
              ) : null}
              {brand.termsUrl ? (
                <p className="pt-2">
                  {fill(t.termsLinkOnly, { company: brand.name })}{" "}
                  <a href={brand.termsUrl} className="text-navy underline break-all">
                    {brand.termsUrl}
                  </a>
                </p>
              ) : null}
            </div>
          )}

          {logoSrc ? (
            <div className="text-center mt-8 print:mt-5 print:break-inside-avoid print:break-before-avoid">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc} alt={brand.name} className="h-16 w-auto mx-auto print:h-14" />
            </div>
          ) : null}
        </section>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-concrete bg-stone-50/30 text-xs text-fog print:hidden">
          <div className="flex justify-between">
            <span>
              {t.reportCreated}{" "}
              {inspection.report_generated_at
                ? formatDate(inspection.report_generated_at)
                : "—"}
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}

// Hnapparnir efst (stjórnborð), faldir í prentun. Sameiginlegt báðum sniðum.
function ReportNav({ id, ui }: { id: string; ui: ReturnType<typeof dashboardCopy> }) {
  return (
    <div className="flex items-center justify-between mb-6 print:hidden">
      <Link href={`/dashboard/${id}`} className="text-sm text-navy hover:underline">
        {ui.common.backLink}
      </Link>
      {/* EIN aðgerð: server-PDF (áreiðanlegar spássíur + blaðsíðunúmer, óháð
          prentglugga). GET á route handler sem skilar application/pdf. Gamli
          "Prenta/Vista" (window.print) hnappurinn fjarlægður til að forðast
          rugling — PrintButton-comp er áfram til ef við viljum varaleið síðar. */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/${id}/report/edit`}
          className="rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5 transition-colors"
        >
          {ui.reportActions.editText}
        </Link>
        <a
          href={`/dashboard/${id}/report/pdf`}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-deep transition-colors"
        >
          {ui.reportActions.downloadPdf}
        </a>
      </div>
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
      <h3 className="font-bold text-xs text-ink mt-2 mb-0.5 print:mt-2 print:mb-0.5 print:text-[8.5pt]">{n}. {title}</h3>
      <p>{children}</p>
    </div>
  );
}

function ratingColor(value: string, scheme: RatingScheme): string {
  const colors: Record<string, string> = {
    ok: "#8a8278",
    warn:
      scheme === "condition_1_3"
        ? CONDITION_COLORS.athugasemd.color
        : scheme === "nz_terms"
          ? NZ_COLORS.athugasemd.color
          : "#3b4ec9",
    danger: "#c98a2e",
    mjog_alvarleg: "#b53d3d",
  };
  return colors[value] ?? "#8a8278";
}
