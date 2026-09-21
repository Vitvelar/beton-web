// Línutákn Rondva — sama strikþykkt og hringmerkið (round caps, ~8% af hæð).
// Notuð á kynningarsíðunni; síðar í viðmótinu (sjá brand/USAGE.md „Enn ógert").

type IconProps = { className?: string; title?: string };

function Base({ children, className, title }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width="32"
      height="32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={className}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconProperty(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M5 15 16 6l11 9" />
      <path d="M8 13v13h16V13" />
      <path d="M14 26v-7h4v7" />
    </Base>
  );
}

export function IconCamera(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M5 11h5l2-3h8l2 3h5v14H5z" />
      <circle cx="16" cy="18" r="4.5" />
    </Base>
  );
}

export function IconThermal(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M13 19.5V7a3 3 0 0 1 6 0v12.5a5 5 0 1 1-6 0Z" />
      <path d="M16 14v9" />
      <circle cx="16" cy="23" r="1.4" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconDraft(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M8 4h11l6 6v18H8z" />
      <path d="M19 4v6h6" />
      <path d="M12 16h9M12 20h9M12 24h6" />
    </Base>
  );
}

export function IconReview(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M4 16s4.5-8 12-8 12 8 12 8-4.5 8-12 8S4 16 4 16Z" />
      <circle cx="16" cy="16" r="3.5" />
    </Base>
  );
}

export function IconExport(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M16 20V5" />
      <path d="m10 11 6-6 6 6" />
      <path d="M6 19v7h20v-7" />
    </Base>
  );
}

export function IconLogo(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="5" y="7" width="22" height="18" rx="2" />
      <path d="M9 21l5-6 4 4 2-2 3 4" />
      <circle cx="21" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconShield(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M16 4 6 8v8c0 6 4.5 10.5 10 12 5.5-1.5 10-6 10-12V8z" />
      <path d="m12 16 3 3 5-6" />
    </Base>
  );
}

/** Litli hringurinn úr merkinu — bilið neðst til hægri, blár punktur. */
export function RondvaRing({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 78 78" width="78" height="78" fill="none" aria-hidden="true" className={className}>
      <g transform="translate(-21,-21)">
        <path d="M71.63 91.95 A34 34 0 1 1 91.95 71.63" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
        <circle cx="84.04" cy="84.04" r="7" fill="#1B4FD8" />
      </g>
    </svg>
  );
}
