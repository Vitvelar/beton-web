import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ReportActions } from "./report-actions";
import { PhotoGrid } from "@/components/dashboard/PhotoGrid";
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

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-fog hover:text-ink transition-colors"
          >
            &larr; Til baka
          </Link>
          <h1 className="text-xl font-semibold text-ink mt-1">
            {inspection.address}
          </h1>
          <p className="text-sm text-fog">
            {inspection.postal_code}
            {inspection.municipality ? ` — ${inspection.municipality}` : ""}
          </p>
        </div>
        <StatusBadge status={inspection.status as InspectionStatus} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard value={rooms.length} label="Rými" />
        <StatCard value={totalObservations} label="Athugasemdir" />
        <StatCard value={totalPhotos} label="Myndir" />
      </div>

      {/* Property + inspection info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <InfoCard title="Eign">
          <InfoRow label="Fastanúmer" value={inspection.fastanumer} />
          <InfoRow label="Tegund" value={propertyData.tegund} />
          <InfoRow
            label="Stærð"
            value={
              propertyData.staerd_m2
                ? `${propertyData.staerd_m2} m²`
                : undefined
            }
          />
          <InfoRow
            label="Byggingarár"
            value={
              propertyData.byggingarar
                ? String(propertyData.byggingarar)
                : undefined
            }
          />
          <InfoRow label="Byggingarstig" value={propertyData.byggingarafangi} />
        </InfoCard>

        <InfoCard title="Skoðun">
          <InfoRow label="Viðskiptavinur" value={inspection.customer_name} />
          <InfoRow label="Dagsetning" value={inspection.inspection_date} />
          <InfoRow label="Skoðunarmaður" value={propertyData.inspectorName} />
          <InfoRow
            label="Viðstaddir"
            value={inspection.attendees?.join(", ")}
          />
          <InfoRow label="Veður" value={inspection.weather} />
        </InfoCard>
      </div>

      {/* Report actions */}
      <ReportActions
        inspectionId={inspection.id}
        reportUrl={reportSignedUrl}
        hasAiReport={!!inspection.ai_report_data}
      />

      {/* Rooms */}
      <h2 className="text-lg font-semibold text-ink mt-8 mb-4">
        Rými ({rooms.length})
      </h2>

      {rooms.length === 0 ? (
        <p className="text-fog text-sm">
          Engin rými skráð. Samstilltu skoðunina úr appinu.
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
                className="rounded-xl border border-concrete bg-white"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-concrete/50">
                  <h3 className="font-semibold text-ink">{room.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-fog">
                    <span>{obs.length} ath.</span>
                    <span>{photoCount} myndir</span>
                  </div>
                </div>

                {room.notes && (
                  <div className="px-4 py-2 text-sm text-fog border-b border-concrete/30 bg-paper-alt/50">
                    {room.notes}
                  </div>
                )}

                {obs.length > 0 && (
                  <ul className="divide-y divide-concrete/30">
                    {obs.map((o) => {
                      const obsPhotos = (o.photos ?? []).filter((p) => p.storage_path);
                      return (
                      <li key={o.id}>
                        <Link
                          href={`/dashboard/${id}/observation/${o.id}`}
                          className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-paper-alt/50 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              {o.observation_number && (
                                <span className="text-xs font-mono text-fog">
                                  #{o.observation_number}
                                </span>
                              )}
                              <span className="text-sm font-medium text-ink truncate">
                                {o.title}
                              </span>
                            </div>
                            {o.description && (
                              <p className="text-xs text-fog line-clamp-1">
                                {o.description}
                              </p>
                            )}
                          </div>
                          <SeverityBadge severity={o.severity as Severity} />
                        </Link>
                        {obsPhotos.length > 0 && (
                          <div className="px-4 pb-3">
                            <PhotoGrid photos={obsPhotos} />
                          </div>
                        )}
                      </li>
                      );
                    })}
                  </ul>
                )}

                {obs.length === 0 && (
                  <p className="px-4 py-3 text-sm text-fog">
                    Engar athugasemdir í þessu rými.
                  </p>
                )}

                {photoCount > 0 && (
                  <div className="px-4 py-3 border-t border-concrete/30">
                    <p className="text-xs font-semibold text-fog mb-2">
                      Myndir ({photoCount})
                    </p>
                    <PhotoGrid photos={roomPhotos} />
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
    <div className="rounded-xl border border-concrete bg-white p-4 text-center">
      <div className="text-2xl font-bold text-navy">{value}</div>
      <div className="text-xs text-fog mt-0.5">{label}</div>
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
    <div className="rounded-xl border border-concrete bg-white p-4">
      <h3 className="text-sm font-semibold text-ink mb-3">{title}</h3>
      <dl className="space-y-1.5">{children}</dl>
    </div>
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
    <div className="flex justify-between text-sm">
      <dt className="text-fog">{label}</dt>
      <dd className="text-ink font-medium">{value ?? "—"}</dd>
    </div>
  );
}
