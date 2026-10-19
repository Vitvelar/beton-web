import type { Metadata } from "next";
import { Eyebrow, metaLabel } from "@/components/Editorial";
import { ContactForm } from "@/components/ContactForm";
import { COMPANY } from "@/lib/constants";
import { betonPageMetadata } from "@/lib/beton-metadata";

export const metadata: Metadata = betonPageMetadata({
  title: "Hafa samband",
  description:
    "Hafðu samband við Beton ehf. fyrir ástandsskoðun fasteigna á höfuðborgarsvæðinu. Sendu fyrirspurn á beton@beton.is eða hringdu í síma 899-8600.",
  path: "/samband",
});

export default function Samband() {
  return (
    <section className="px-6 pt-20 pb-20 lg:px-14 lg:pt-24 lg:pb-28">
      <div className="mx-auto max-w-[1280px]">
        {/* Ein rist: hliðardálkur, fyrirsögn og form deila sama hægri dálki. */}
        <div className="grid grid-cols-1 gap-x-24 gap-y-12 md:grid-cols-[1fr_2fr]">
          <div>
            <Eyebrow>Hafa samband</Eyebrow>
            <div className={`${metaLabel} mt-12 lg:mt-14`}>
              Svarað innan 24 klst.
              <br />
              virka daga
            </div>
          </div>
          <div>
            <h1 className="mb-6 text-h1 font-medium text-balance">
              Sendu okkur línu —
              <br />
              <span className="italic-accent">við svörum fljótt.</span>
            </h1>
            <p className="max-w-[640px] text-lead text-fog">
              Spurningar um skoðun, verðskrá eða tímasetningu? Fylltu út formið eða
              sendu beint á netfangið okkar,{" "}
              <a
                href={`mailto:${COMPANY.email}`}
                className="text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-ink"
              >
                {COMPANY.email}
              </a>
              .
            </p>
            <a
              href={COMPANY.phoneHref}
              className="mt-8 inline-flex min-h-11 items-baseline gap-3 text-ink"
            >
              <span className={metaLabel}>Sími</span>
              <span className="border-b-2 border-navy text-3xl font-medium tracking-tight transition-colors hover:border-ink">
                {COMPANY.phone}
              </span>
            </a>
          </div>

          <div className="md:col-start-2">
            <div className="max-w-[720px] rounded-sharp border border-concrete p-8 md:p-12">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
