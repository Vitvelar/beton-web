import Image from "next/image";
import { HeroSection } from "@/components/HeroSection";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/Button";
import { PRICING, COMPANY } from "@/lib/constants";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <HeroSection
        title="Ástandsskoðun fasteigna"
        subtitle="Fagleg og hlutlaus skoðun sem veitir þér öryggi og yfirsýn yfir ástand eignar."
        ctaText="Bóka skoðun"
        ctaHref="/skodun"
        imageSrc="/images/hero.jpg"
        imageAlt="Litrík timburhús í miðbæ Reykjavíkur"
      />

      {/* Services */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Hvað er ástandsskoðun?"
            subtitle="Við sérhæfum okkur í ástandsskoðunum fasteigna og veitum faglega og hlutlausa ráðgjöf fyrir bæði kaupendur og seljendur."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-light-gray rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-charcoal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-charcoal mb-3">
                Ítarleg skoðun
              </h3>
              <p className="text-slate leading-relaxed">
                Við leggjum áherslu á vandaða vinnubrögð, nákvæma skjalfestingu
                og gæðaþjónustu. Með reynslu úr byggingaiðnaðinum metum við
                eignir og greinum helstu áhættuþætti.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-light-gray rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-charcoal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-charcoal mb-3">
                Traust og gagnsæi
              </h3>
              <p className="text-slate leading-relaxed">
                Við trúum því að traust og gagnsæi skipti öllu máli. Við útskýrum
                niðurstöður á skýru og aðgengilegu máli svo þú getir tekið
                upplýsta ákvörðun.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-light-gray rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-charcoal" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-charcoal mb-3">
                Ítarleg skýrsla
              </h3>
              <p className="text-slate leading-relaxed">
                Þú færð ítarlega skýrslu sem lýsir ástandi eignarinnar,
                dregur úr óvissu í fasteignaviðskiptum og gefur þér
                heildstæða mynd af ástandinu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Image divider */}
      <section className="relative h-[40vh] min-h-[300px]">
        <Image
          src="/images/concrete.jpg"
          alt="Steypt bygging að næstu"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-charcoal/40" />
      </section>

      {/* Pricing preview */}
      <section className="py-24 px-6 bg-light-gray">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Verðskrá"
            subtitle="Gagnsæ og sanngjörn verðlagning sem gerir þér kleift að bera saman þjónustu."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {PRICING.residential.slice(0, 3).map((item) => (
              <div
                key={item.size}
                className="bg-white rounded-xl p-6 ring-1 ring-gray-200"
              >
                <p className="text-sm text-slate mb-2">{item.size}</p>
                <p className="text-2xl font-bold text-charcoal">{item.price}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button href="/verdskra" variant="primary">
              Sjá alla verðskrá
            </Button>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading
            title="Hafðu samband"
            subtitle="Ef þú hefur einhverjar spurningar, ekki hika við að hafa samband. Einnig er hægt að skilja eftir símanúmer og við hringjum í þig við fyrsta tækifæri."
          />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/samband">Senda fyrirspurn</Button>
            <Button href={`mailto:${COMPANY.email}`} variant="secondary">
              {COMPANY.email}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
