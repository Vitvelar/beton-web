import type { InspectionStatus } from "@/lib/supabase/types";
import { dashboardCopy, type DashboardLocale } from "@/lib/i18n/dashboard";
import { badge, badgeDot } from "@/lib/ui";

type Tone = Parameters<typeof badge>[0];

// Litur + punktur + texti (aldrei litur einn, DESIGN.md §1). Birtist í töflu og á skoðunarsíðu.
const STATUS_TONE: Record<InspectionStatus, Tone> = {
  draft: "neutral",
  inspecting: "warn",
  completed: "success",
  generating: "calm",
  rendering_pdf: "calm",
  report_ready: "success",
  error: "danger",
};

export function StatusBadge({ status, locale }: { status: InspectionStatus; locale: DashboardLocale }) {
  const key: InspectionStatus = Object.hasOwn(STATUS_TONE, status) ? status : "draft";
  const tone = STATUS_TONE[key];
  return (
    <span className={badge(tone)}>
      <span aria-hidden="true" className={badgeDot(tone)} />
      {dashboardCopy(locale).status[key]}
    </span>
  );
}
