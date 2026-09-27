import type { Severity } from "@/lib/supabase/types";
import { dashboardCopy, type DashboardLocale } from "@/lib/i18n/dashboard";
import type { RatingScheme } from "@/lib/report/settings";

const SEVERITY_CLASS: Record<Severity, string> = {
  athugasemd: "bg-sev-calm/10 text-sev-calm",
  alvarleg: "bg-sev-warn/10 text-sev-warn",
  mjog_alvarleg: "bg-sev-danger/10 text-sev-danger",
};

// Einkunnakerfi 1–3: einkunn 1 græn, eins og í skýrslunni (umferðarljós).
const CONDITION_CLASS: Record<Severity, string> = {
  ...SEVERITY_CLASS,
  athugasemd: "bg-emerald-50 text-emerald-700",
};

export function SeverityBadge({
  severity,
  locale,
  scheme = "standard",
}: {
  severity: Severity;
  locale: DashboardLocale;
  /** Matskerfi fyrirtækisins; aðeins birting — geymda gildið breytist ekki. */
  scheme?: RatingScheme;
}) {
  const key: Severity = Object.hasOwn(SEVERITY_CLASS, severity) ? severity : "athugasemd";
  const condition = scheme === "condition_1_3";
  const copy = dashboardCopy(locale);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${(condition ? CONDITION_CLASS : SEVERITY_CLASS)[key]}`}
    >
      {(condition ? copy.conditionSeverity : copy.severity)[key]}
    </span>
  );
}
