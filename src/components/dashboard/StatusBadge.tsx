import type { InspectionStatus } from "@/lib/supabase/types";

const STATUS_CONFIG: Record<
  InspectionStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Drög",
    className: "bg-concrete/60 text-fog",
  },
  inspecting: {
    label: "Í vinnslu",
    className: "bg-sev-warn/10 text-sev-warn",
  },
  completed: {
    label: "Lokið",
    className: "bg-emerald-50 text-emerald-700",
  },
};

export function StatusBadge({ status }: { status: InspectionStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
