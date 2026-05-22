import type { Severity } from "@/lib/supabase/types";

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; className: string }
> = {
  athugasemd: {
    label: "Athugasemd",
    className: "bg-sev-calm/10 text-sev-calm",
  },
  alvarleg: {
    label: "Alvarleg",
    className: "bg-sev-warn/10 text-sev-warn",
  },
  mjog_alvarleg: {
    label: "Mjög alvarleg",
    className: "bg-sev-danger/10 text-sev-danger",
  },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const config = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.athugasemd;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
