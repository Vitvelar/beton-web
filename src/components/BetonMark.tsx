interface BetonMarkProps {
  color?: string;
  size?: number;
}

export function BetonMark({ color = "var(--color-navy)", size = 32 }: BetonMarkProps) {
  return (
    <svg
      width={size}
      height={size * 0.85}
      viewBox="0 0 100 85"
      fill="none"
      aria-hidden="true"
    >
      <path d="M8 60 L42 18" stroke={color} strokeWidth="11" strokeLinecap="round" />
      <path d="M44 60 L78 18" stroke={color} strokeWidth="11" strokeLinecap="round" />
    </svg>
  );
}
