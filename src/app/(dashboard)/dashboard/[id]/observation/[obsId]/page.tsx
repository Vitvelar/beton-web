import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ObservationForm } from "@/components/dashboard/ObservationForm";
import { PhotoGrid } from "@/components/dashboard/PhotoGrid";
import type { Observation, Photo } from "@/lib/supabase/types";

export default async function ObservationEditorPage({
  params,
}: {
  params: Promise<{ id: string; obsId: string }>;
}) {
  const { id, obsId } = await params;
  const supabase = await createClient();

  const { data: observation, error } = await supabase
    .from("observations")
    .select("*")
    .eq("id", obsId)
    .single();

  if (error || !observation) {
    notFound();
  }

  const { data: room } = await supabase
    .from("rooms")
    .select("name")
    .eq("id", observation.room_id)
    .single();

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("observation_id", obsId)
    .order("sort_order");

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dashboard/${id}`}
          className="text-sm text-fog hover:text-ink transition-colors"
        >
          &larr; {room?.name ?? "Til baka"}
        </Link>
        <h1 className="text-xl font-semibold text-ink mt-1">
          {observation.title}
        </h1>
        {observation.observation_number && (
          <p className="text-sm font-mono text-fog">
            #{observation.observation_number}
          </p>
        )}
      </div>

      {photos && photos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-ink mb-3">
            Myndir ({photos.length})
          </h2>
          <PhotoGrid photos={photos as Photo[]} />
        </div>
      )}

      <ObservationForm
        observation={observation as Observation}
        inspectionId={id}
      />
    </div>
  );
}
