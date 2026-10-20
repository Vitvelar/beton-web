import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GuardedLink } from "@/components/dashboard/GuardedLink";
import { ObservationForm } from "@/components/dashboard/ObservationForm";
import { PhotoGrid } from "@/components/dashboard/PhotoGrid";
import { getDashboardLocale, getDashboardRatingScheme } from "@/lib/request-brand";
import { dashboardCopy, fill, format } from "@/lib/i18n/dashboard";
import { tapLink } from "@/lib/ui";
import type { Observation, Photo } from "@/lib/supabase/types";

// PGRST116 = engin lína, 22P02 = ógilt uuid í slóðinni: bæði eru „finnst ekki“.
// Allt annað (bilun í gagnagrunni, netvilla) er villa → error.tsx, ekki 404.
function isMissingRow(error: { code?: string } | null): boolean {
  return error?.code === "PGRST116" || error?.code === "22P02";
}

async function loadObservation(id: string, obsId: string) {
  const supabase = await createClient();

  const { data: observation, error } = await supabase
    .from("observations")
    .select("*")
    .eq("id", obsId)
    .maybeSingle();
  if (error) {
    if (isMissingRow(error)) notFound();
    throw new Error(`observation load failed: ${error.message}`);
  }
  // Athugasemdin verður að tilheyra skoðuninni í slóðinni.
  if (!observation || observation.inspection_id !== id) notFound();

  const { data: inspection, error: inspectionError } = await supabase
    .from("inspections")
    .select("address, ai_report_data")
    .eq("id", id)
    .maybeSingle();
  if (inspectionError) {
    if (isMissingRow(inspectionError)) notFound();
    throw new Error(`inspection load failed: ${inspectionError.message}`);
  }
  if (!inspection) notFound();

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, name")
    .eq("id", observation.room_id)
    .maybeSingle();
  if (roomError) throw new Error(`room load failed: ${roomError.message}`);

  return { supabase, observation: observation as Observation, inspection, room };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; obsId: string }>;
}): Promise<Metadata> {
  const { id, obsId } = await params;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("observations")
      .select("title, inspection_id")
      .eq("id", obsId)
      .maybeSingle();
    if (data?.title && data.inspection_id === id) {
      const { data: inspection } = await supabase
        .from("inspections")
        .select("address")
        .eq("id", id)
        .maybeSingle();
      const t = dashboardCopy(await getDashboardLocale()).observation;
      return {
        title: inspection?.address
          ? format(t.metaTitle, { title: data.title, address: inspection.address })
          : data.title,
      };
    }
  } catch {
    // Síðan sjálf sýnir villuna; titillinn fellur aftur á sjálfgefinn.
  }
  return {};
}

export default async function ObservationEditorPage({
  params,
}: {
  params: Promise<{ id: string; obsId: string }>;
}) {
  const { id, obsId } = await params;
  const locale = await getDashboardLocale();
  const copy = dashboardCopy(locale);
  const { supabase, observation, inspection, room } = await loadObservation(id, obsId);

  const { data: photos, error: photosError } = await supabase
    .from("photos")
    .select("*")
    .eq("observation_id", obsId)
    .order("sort_order");
  if (photosError) throw new Error(`photos load failed: ${photosError.message}`);

  const backHref = room ? `/dashboard/${id}#room-${room.id}` : `/dashboard/${id}`;
  const hasReport = !!inspection.ai_report_data;

  return (
    <div>
      <div className="mb-6">
        <GuardedLink href={backHref} className={`${tapLink} text-sm text-fog hover:text-ink`}>
          &larr; {inspection.address}
          {room?.name ? ` › ${room.name}` : ""}
        </GuardedLink>
        <h1 className="mt-1 text-2xl font-semibold text-ink wrap-break-word hyphens-auto">
          {observation.title}
        </h1>
        {observation.observation_number && (
          <p className="text-sm font-mono text-fog">
            #{observation.observation_number}
          </p>
        )}
      </div>

      {hasReport && (
        <p
          role="note"
          className="mb-6 rounded-xl border border-concrete bg-surface px-4 py-3 text-sm text-ink"
        >
          {copy.observation.reportNotice}{" "}
          <Link
            href={`/dashboard/${id}/report/edit`}
            className="font-semibold text-navy underline underline-offset-4 hover:text-navy-deep"
          >
            {copy.observation.reportNoticeLink}
          </Link>
        </p>
      )}

      {photos && photos.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold text-ink">
            {fill(copy.observation.photosHeading, { count: photos.length })}
          </h2>
          <PhotoGrid photos={photos as Photo[]} locale={locale} />
        </div>
      )}

      <ObservationForm
        observation={observation}
        inspectionId={id}
        locale={locale}
        scheme={await getDashboardRatingScheme()}
        backHref={backHref}
        backLabel={copy.common.back}
      />
    </div>
  );
}
