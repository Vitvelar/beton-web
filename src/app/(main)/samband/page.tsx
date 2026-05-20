import type { Metadata } from "next";
import { Eyebrow } from "@/components/Editorial";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Hafa samband",
  description:
    "Hafðu samband við Beton ehf. fyrir ástandsskoðun fasteigna á höfuðborgarsvæðinu. Sendu fyrirspurn eða hafðu samband á beton@beton.is",
  alternates: { canonical: "https://beton.is/samband" },
};

export default function Samband() {
  return (
    <>
      <section className="px-6 lg:px-14 pt-20 lg:pt-24 pb-24 lg:pb-32">
        <div className="mx-auto max-w-[1280px]">
          {/* Intro */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12 md:gap-24 mb-16 lg:mb-20">
            <div>
              <Eyebrow>Hafa samband</Eyebrow>
              <div className="text-xs text-fog font-mono mt-12 lg:mt-14 tracking-[0.08em]">
                Svarað innan 24 klst.
                <br />
                virka daga
              </div>
            </div>
            <div>
              <h1 className="text-[44px] lg:text-[64px] leading-none font-medium tracking-[-0.03em] mb-6 text-balance">
                Sendu okkur línu —
                <br />
                <span className="italic-accent">við svörum fljótt.</span>
              </h1>
              <p className="text-[17.5px] leading-[1.55] text-fog max-w-[640px]">
                Spurningar um skoðun, verðskrá eða tímasetningu? Fylltu út formið eða
                sendu beint á netfangið okkar.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="max-w-[720px]">
            <div className="bg-paper border border-concrete-dk p-8 md:p-12">
              <div className="font-mono text-[11px] tracking-[0.12em] text-fog uppercase mb-8">
                Skilaboð · Form
              </div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
