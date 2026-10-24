import type { Severity } from "@/lib/supabase/types";
import { dashboardCopy, type DashboardLocale } from "@/lib/i18n/dashboard";
import type { RatingScheme } from "@/lib/report/settings";
import { badge, badgeDot } from "@/lib/ui";

type Tone = Parameters<typeof badge>[0];

const SEVERITY_TONE: Record<Severity, Tone> = {
  athugasemd: "calm",
  alvarleg: "warn",
  mjog_alvarleg: "danger",
};

// Einkunnakerfi 1–3: einkunn 1 græn, eins og í skýrslunni (umferðarljós).
const CONDITION_TONE: Record<Severity, Tone> = {
  ...SEVERITY_TONE,
  athugasemd: "success",
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
  const key: Severity = Object.hasOwn(SEVERITY_TONE, severity) ? severity : "athugasemd";
  const condition = scheme === "condition_1_3";
  const copy = dashboardCopy(locale);
  // NZ-matsorð (nz_terms): sömu litir og núverandi kerfi, aðeins heitin breytast.
  const labels = condition ? copy.conditionSeverity : scheme === "nz_terms" ? copy.nzSeverity : copy.severity;
  const tone = (condition ? CONDITION_TONE : SEVERITY_TONE)[key];
  return (
    <span className={badge(tone)}>
      <span aria-hidden="true" className={badgeDot(tone)} />
      {labels[key]}
    </span>
  );
}
