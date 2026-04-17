import type { Metadata } from "next";
import { HeroSection } from "@/components/HeroSection";
import { ContactForm } from "@/components/ContactForm";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Hafa samband",
  description:
    "Hafðu samband við Beton ehf. fyrir ástandsskoðun fasteigna á höfuðborgarsvæðinu. Sendu fyrirspurn eða hafðu samband á beton@betonehf.is",
  alternates: { canonical: "https://beton.is/samband" },
};

export default function Samband() {
  return (
    <>
      <HeroSection
        title="Hafðu samband"
        subtitle="Ef þú hefur einhverjar spurningar, ekki hika við að hafa samband."
        imageSrc="/images/contact.jpg"
        imageAlt="Hafðu samband við Beton ehf."
      />

      <section className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
            {/* Contact form */}
            <div className="lg:col-span-3 relative">
              <h2 className="text-2xl font-bold text-charcoal mb-2">
                Senda fyrirspurn
              </h2>
              <p className="text-slate mb-8">
                Einnig er hægt að skilja eftir símanúmer og við hringjum í þig
                við fyrsta tækifæri.
              </p>
              <ContactForm />
            </div>

            {/* Contact info */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-charcoal mb-8">
                Upplýsingar
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-2">
                    Netfang
                  </h3>
                  <a
                    href={`mailto:${COMPANY.email}`}
                    className="text-slate hover:text-charcoal transition-colors"
                  >
                    {COMPANY.email}
                  </a>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-2">
                    Staðsetning
                  </h3>
                  <p className="text-slate">{COMPANY.location}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider mb-2">
                    Kennitala
                  </h3>
                  <p className="text-slate">{COMPANY.kennitala}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
