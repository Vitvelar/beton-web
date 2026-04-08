import Image from "next/image";
import Link from "next/link";

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  imageSrc: string;
  imageAlt: string;
  overlay?: boolean;
}

export function HeroSection({
  title,
  subtitle,
  ctaText,
  ctaHref,
  imageSrc,
  imageAlt,
  overlay = true,
}: HeroSectionProps) {
  return (
    <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />
      {overlay && (
        <div className="absolute inset-0 bg-charcoal/60" />
      )}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in-up">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto animate-fade-in-up-delay">
            {subtitle}
          </p>
        )}
        {ctaText && ctaHref && (
          <div className="animate-fade-in-up-delay-2">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-md bg-white px-8 py-3.5 text-base font-semibold text-charcoal shadow-lg hover:bg-gray-100 transition-colors"
            >
              {ctaText}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
