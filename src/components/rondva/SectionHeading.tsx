// Fyrirsögn kafla á kynningarsíðunum (forsíða og /nz): yfirtexti + h2.
export function SectionHeading({
  eyebrow,
  children,
  light,
  id,
}: {
  eyebrow: string;
  children: React.ReactNode;
  light?: boolean;
  id?: string;
}) {
  return (
    <div className="rv-reveal max-w-2xl">
      <p className={light ? "rv-eyebrow !text-paper/60" : "rv-eyebrow"}>{eyebrow}</p>
      <h2 id={id} className={`rv-display rv-balance mt-4 text-[34px] sm:text-[44px] md:text-[52px] ${light ? "text-paper" : "text-ink"}`}>
        {children}
      </h2>
    </div>
  );
}
