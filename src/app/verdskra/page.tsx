import type { Metadata } from "next";
import { HeroSection } from "@/components/HeroSection";
import { SectionHeading } from "@/components/SectionHeading";
import { PricingCard } from "@/components/PricingCard";
import { Button } from "@/components/Button";
import { PRICING } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Verðskrá — ástandsskoðun frá 129.900 kr.",
  description:
    "Verðskrá Beton ehf. fyrir ástandsskoðun fasteigna á höfuðborgarsvæðinu. Gagnsæ verðlagning með virðisaukaskatti, akstur innifalinn.",
  alternates: { canonical: "https://beton.is/verdskra" },
};

export default function Verdskra() {
  return (
    <>
      <HeroSection
        title="Verðskrá"
        subtitle="Gagnsæ og sanngjörn verðlagning sem gerir þér kleift að bera saman þjónustu."
        imageSrc="/images/pricing.jpg"
        imageAlt="Nútímaleg íbúðarhús"
      />

      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          {/* Residential pricing */}
          <SectionHeading
            title="Íbúðarhúsnæði"
            subtitle="Verð er gefið fyrir ástandsskoðun með skýrslu."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {PRICING.residential.map((item) => (
              <div
                key={item.size}
                className="bg-white rounded-xl p-6 ring-1 ring-gray-200 hover:ring-charcoal/20 transition-all"
              >
                <p className="text-sm text-slate mb-2">{item.size}</p>
                <p className="text-2xl font-bold text-charcoal">{item.price}</p>
              </div>
            ))}
          </div>

          <div className="bg-light-gray rounded-xl p-6 mb-16">
            <p className="text-sm text-slate leading-relaxed">
              Verð er gefið fyrir ástandsskoðun með skýrslu. Innifalið í verði er
              allt verkfæragjald sem og akstur innan höfuðborgarsvæðisins.
              Uppgefið verð er <strong>með</strong> virðisaukaskatti.
            </p>
          </div>

          {/* Commercial + Housing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <PricingCard
              title="Atvinnuhúsnæði"
              note={PRICING.commercial}
            />
            <PricingCard
              title="Húsfélög"
              note={PRICING.housingAssociations}
            />
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button href="/skodun" className="text-base px-10 py-4">
              Bóka skoðun
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
