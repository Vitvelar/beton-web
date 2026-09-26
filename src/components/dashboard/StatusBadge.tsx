import type { InspectionStatus } from "@/lib/supabase/types";
import { dashboardCopy, type DashboardLocale } from "@/lib/i18n/dashboard";

const STATUS_CLASS: Record<InspectionStatus, string> = {
  draft: "bg-concrete/60 text-fog",
  inspecting: "bg-sev-warn/10 text-sev-warn",
  completed: "bg-emerald-50 text-emerald-700",
};

export function StatusBadge({ status, locale }: { status: InspectionStatus; locale: DashboardLocale }) {
  const key: InspectionStatus = Object.hasOwn(STATUS_CLASS, status) ? status : "draft";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[key]}`}
    >
      {dashboardCopy(locale).status[key]}
    </span>
  );
}
