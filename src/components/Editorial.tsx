interface EyebrowProps {
  children: React.ReactNode;
  color?: string;
}

export function Eyebrow({ children, color = "var(--color-copper)" }: EyebrowProps) {
  return (
    <div
      className="text-[11px] font-semibold tracking-[0.16em] uppercase flex items-center gap-2.5"
      style={{ color }}
    >
      <span className="w-6 h-px" style={{ background: color }} />
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
    <div className="flex items-baseline gap-4 pb-4 border-b border-concrete-dk mb-12">
      <div className="text-xs font-semibold text-fog font-mono tracking-[0.05em]">{n}</div>
      <div className="text-[13px] font-semibold text-ink tracking-[0.08em] uppercase">{label}</div>
    </div>
  );
}
