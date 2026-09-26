import type { Severity } from "@/lib/supabase/types";
import { dashboardCopy, type DashboardLocale } from "@/lib/i18n/dashboard";

const SEVERITY_CLASS: Record<Severity, string> = {
  athugasemd: "bg-sev-calm/10 text-sev-calm",
  alvarleg: "bg-sev-warn/10 text-sev-warn",
  mjog_alvarleg: "bg-sev-danger/10 text-sev-danger",
};

export function SeverityBadge({ severity, locale }: { severity: Severity; locale: DashboardLocale }) {
  const key: Severity = Object.hasOwn(SEVERITY_CLASS, severity) ? severity : "athugasemd";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${SEVERITY_CLASS[key]}`}
    >
      {dashboardCopy(locale).severity[key]}
    </span>
  );
}
