import type { Metadata } from "next";
import { Eyebrow } from "@/components/Editorial";
import { ContactForm } from "@/components/ContactForm";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Hafa samband",
  description:
    "Hafðu samband við Beton ehf. fyrir ástandsskoðun fasteigna á höfuðborgarsvæðinu. Sendu fyrirspurn á beton@beton.is eða hringdu í síma 899-8600.",
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
                sendu beint á netfangið okkar,{" "}
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="text-ink underline underline-offset-4 decoration-ink/30 hover:decoration-ink transition-colors"
                >
                  {COMPANY.email}
                </a>
                .
              </p>
              <a
                href={COMPANY.phoneHref}
                className="inline-flex items-baseline gap-3 mt-8 text-ink"
              >
                <span className="text-xs font-mono tracking-[0.1em] uppercase text-fog">
                  Sími
                </span>
                <span className="text-[26px] font-medium tracking-[-0.02em] border-b-2 border-copper hover:border-ink transition-colors">
                  {COMPANY.phone}
                </span>
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="max-w-[720px]">
            <div className="bg-paper border border-concrete-dk p-8 md:p-12">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
