import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canUseBetonDrive } from "@/lib/beton-drive";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ReportActions } from "./report-actions";
import { PhotoGrid } from "@/components/dashboard/PhotoGrid";
import { getDashboardLocale, getDashboardRatingScheme } from "@/lib/request-brand";
import { dashboardCopy, fill, plural } from "@/lib/i18n/dashboard";
import { tapLink } from "@/lib/ui";
import type {
  Severity,
  InspectionStatus,
  Observation,
  Room,
  Photo,
} from "@/lib/supabase/types";

interface PropertyData {
  tegund?: string;
  staerd_m2?: number;
  byggingarar?: number;
  byggingarafangi?: string;
  inspectorName?: string;
  [key: string]: unknown;
}

// Flipatitill = heimilisfang skoðunarinnar (sniðmát skipulagsins bætir viðskeytinu við).
// Léttur lestur; RLS tryggir að notandinn sér aðeins eigin skoðanir. Bregðist hann
// fær síðan almennan titil.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data } = await supabase.from("inspections").select("address").eq("id", id).maybeSingle();
    const address = data?.address?.trim();
    if (address) return { title: address };
  } catch {
    // fellur til baka á almennan titil
  }
  return { title: dashboardCopy(await getDashboardLocale()).list.title };
}

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getDashboardLocale();
  const scheme = await getDashboardRatingScheme();
  const copy = dashboardCopy(locale);
  const t = copy.inspection;
  const supabase = await createClient();
  // „Senda í Google Drive" skrifar í Drive Beton ehf. — aðeins skoðanir Beton
  // (ákvörðun eiganda 2026-09-27; src/lib/beton-drive.ts).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const canSendToDrive = await canUseBetonDrive(supabase, user?.email);

  const { data: inspection, error } = await supabase
    .from("inspections")
    .select(
      `
      *,
      rooms (
        id, name, slug, sort_order, ratings, notes,
        observations (
          id, observation_number, category, title, description, suggestion, severity, sort_order,
          photos (id, storage_path, photo_type, caption, is_cover, sort_order)
        ),
        photos (id, storage_path, photo_type, caption, is_cover, sort_order, observation_id)
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !inspection) {
    notFound();
  }

  let reportSignedUrl: string | null = null;
  if (inspection.report_url) {
    const { data: urlData } = await supabase.storage
      .from("inspection-reports")
      .createSignedUrl(inspection.report_url, 3600);
    reportSignedUrl = urlData?.signedUrl ?? null;
  }

  const propertyData = (inspection.property_data ?? {}) as PropertyData;
  const rooms = (inspection.rooms as (Room & {
    observations: (Observation & { photos?: Photo[] })[];
    photos: Photo[];
  })[]) ?? [];
  rooms.sort((a, b) => a.sort_order - b.sort_order);

  const totalObservations = rooms.reduce(
    (sum, r) => sum + (r.observations?.length ?? 0),
    0
  );
  // Heildarmyndir = rýmismyndir + athugasemdamyndir. Rýmismyndir eru aðeins
  // þær sem hafa ekkert observation_id; athugasemdamyndir teljast undir sinni
  // athugasemd (og birtast ekki í rýmisyfirlitinu að neðan).
  const totalPhotos = rooms.reduce((sum, r) => {
    const roomOnly = (r.photos ?? []).filter((p) => !p.observation_id).length;
    const obsPhotos = (r.observations ?? []).reduce(
      (s, o) => s + (o.photos?.length ?? 0),
      0
    );
    return sum + roomOnly + obsPhotos;
  }, 0);

  return (
    <div>
      <Link
        href="/dashboard"
        className={`${tapLink} -ml-1 px-1 text-sm text-fog transition-colors hover:text-ink`}
      >
        {copy.settings.backToList}
      </Link>
      <div className="mb-6 mt-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-ink hyphens-auto wrap-break-word">
            {inspection.address}
          </h1>
          <p className="text-sm text-fog">
            {inspection.postal_code}
            {inspection.municipality ? ` — ${inspection.municipality}` : ""}
          </p>
        </div>
        <div className="shrink-0 pt-1">
          <StatusBadge status={inspection.status as InspectionStatus} locale={locale} />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,6.5rem),1fr))] gap-3">
        <StatCard value={rooms.length} label={t.statRooms} />
        <StatCard value={totalObservations} label={t.statObservations} />
        <StatCard value={totalPhotos} label={t.statPhotos} />
      </div>

      {/* Property + inspection info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <InfoCard title={t.property}>
          <InfoRow label={t.propertyId} value={inspection.fastanumer} />
          <InfoRow label={t.type} value={propertyData.tegund} />
          <InfoRow
            label={t.size}
            value={
              propertyData.staerd_m2
                ? `${propertyData.staerd_m2} m²`
                : undefined
            }
          />
          <InfoRow
            label={t.yearBuilt}
            value={
              propertyData.byggingarar
                ? String(propertyData.byggingarar)
                : undefined
            }
          />
          <InfoRow label={t.buildStage} value={propertyData.byggingarafangi} />
        </InfoCard>

        <InfoCard title={t.inspection}>
          <InfoRow label={t.customer} value={inspection.customer_name} />
          <InfoRow label={t.date} value={inspection.inspection_date} />
          <InfoRow label={t.inspector} value={propertyData.inspectorName} />
          <InfoRow
            label={t.attendees}
            value={inspection.attendees?.join(", ")}
          />
          <InfoRow label={t.weather} value={inspection.weather} />
        </InfoCard>
      </div>

      {/* Report actions */}
      <ReportActions
        inspectionId={inspection.id}
        reportUrl={reportSignedUrl}
        hasAiReport={!!inspection.ai_report_data}
        canSendToDrive={canSendToDrive}
        locale={locale}
        // Fjöldi athugasemda (W3a bætir propinu við ReportActions; dreift svo tsc standist
        // meðan það er ekki komið — óþekkt prop er hunsað).
        {...{ observationCount: totalObservations }}
      />

      {/* Rooms */}
      <h2 className="mb-4 mt-8 text-lg font-semibold text-ink">
        {fill(t.roomsHeading, { count: rooms.length })}
      </h2>

      {rooms.length === 0 ? (
        <p className="text-sm text-fog">
          {t.noRooms}
        </p>
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => {
            const obs = room.observations ?? [];
            obs.sort((a: Observation, b: Observation) => a.sort_order - b.sort_order);
            // Aðeins rýmismyndir í yfirlitinu — athugasemdamyndir birtast undir
            // sinni athugasemd, ekki hér.
            const roomPhotos = (room.photos ?? []).filter((p) => !p.observation_id);
            const photoCount = roomPhotos.length;

            return (
              <div
                key={room.id}
                id={`room-${room.id}`}
                className="scroll-mt-24 rounded-xl border border-concrete bg-surface"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-concrete px-4 py-3">
                  <h3 className="min-w-0 font-semibold text-ink wrap-break-word">{room.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-fog">
                    <span>{fill(t.roomObservations, { count: obs.length })}</span>
                    <span>{fill(plural(locale, photoCount, t.roomPhotos), { count: photoCount })}</span>
                  </div>
                </div>

                {room.notes && (
                  <div className="border-b border-concrete bg-paper-alt px-4 py-2 text-sm text-fog">
                    {room.notes}
                  </div>
                )}

                {obs.length > 0 && (
                  <ul className="divide-y divide-concrete">
                    {obs.map((o) => {
                      const obsPhotos = (o.photos ?? []).filter((p) => p.storage_path);
                      return (
                      <li key={o.id}>
                        <Link
                          href={`/dashboard/${id}/observation/${o.id}`}
                          className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-paper-alt active:bg-paper-alt"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="mb-0.5 flex items-start gap-2">
                              {o.observation_number && (
                                <span className="shrink-0 font-mono text-xs text-fog">
                                  #{o.observation_number}
                                </span>
                              )}
                              <span className="line-clamp-2 text-sm font-medium text-ink wrap-break-word">
                                {o.title}
                              </span>
                            </div>
                            {o.description && (
                              <p className="text-xs text-fog line-clamp-1">
                                {o.description}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0">
                            <SeverityBadge severity={o.severity as Severity} locale={locale} scheme={scheme} />
                          </span>
                        </Link>
                        {obsPhotos.length > 0 && (
                          <div className="px-4 pb-3">
                            <PhotoGrid photos={obsPhotos} locale={locale} />
                          </div>
                        )}
                      </li>
                      );
                    })}
                  </ul>
                )}

                {obs.length === 0 && (
                  <p className="px-4 py-3 text-sm text-fog">
                    {t.noObservations}
                  </p>
                )}

                {photoCount > 0 && (
                  <div className="border-t border-concrete px-4 py-3">
                    <p className="text-xs font-semibold text-fog mb-2">
                      {fill(t.photosHeading, { count: photoCount })}
                    </p>
                    <PhotoGrid photos={roomPhotos} locale={locale} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-concrete bg-surface p-3 text-center sm:p-4">
      <div className="text-2xl font-bold text-navy">{value}</div>
      <div className="mt-0.5 text-xs text-fog wrap-break-word hyphens-auto">{label}</div>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-concrete bg-surface p-4">
      <h2 className="mb-3 text-base font-semibold text-ink">{title}</h2>
      <dl className="space-y-1.5">{children}</dl>
    </section>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="shrink-0 text-fog">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-ink wrap-break-word">{value ?? "—"}</dd>
    </div>
  );
}
