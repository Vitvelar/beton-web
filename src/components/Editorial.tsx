// Stíll fyrir meta-merki í Abel: 12px, hástafir, aldrei feitletrað (Abel hefur
// ekkert feitt snið, svo font-semibold gæfi gervifeitletrun). DESIGN.md §6.
export const metaLabel = "font-mono text-xs uppercase tracking-widest text-fog";

interface EyebrowProps {
  children: React.ReactNode;
  /** Á dökkum fleti notar yfirskriftin `accent-on-inverse` í stað `navy`. */
  onDark?: boolean;
}

export function Eyebrow({ children, onDark = false }: EyebrowProps) {
  return (
    <div
      className={`flex items-center gap-2.5 text-label font-semibold uppercase ${
        onDark ? "text-accent-on-inverse" : "text-navy"
      }`}
    >
      <span className="h-px w-6 bg-current" aria-hidden="true" />
      {children}
    </div>
  );
}

interface NumberedDividerProps {
  n: string;
  label: string;
}

export function NumberedDivider({ n, label }: NumberedDividerProps) {
  return (
    <div className="mb-12 flex items-baseline gap-4 border-b border-concrete-dk pb-4">
      <div className={metaLabel}>{n}</div>
      <div className="text-label font-semibold uppercase text-ink">{label}</div>
    </div>
  );
}
