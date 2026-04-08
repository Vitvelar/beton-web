interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export function SectionHeading({
  title,
  subtitle,
  centered = true,
}: SectionHeadingProps) {
  return (
    <div className={`mb-12 ${centered ? "text-center" : ""}`}>
      <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-slate max-w-2xl mx-auto">{subtitle}</p>
      )}
    </div>
  );
}
