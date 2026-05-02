import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/Editorial";
import { ContactForm } from "@/components/ContactForm";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Hafa samband",
  description:
    "Hafðu samband við Beton ehf. fyrir ástandsskoðun fasteigna á höfuðborgarsvæðinu. Sendu fyrirspurn eða hafðu samband á beton@beton.is",
  alternates: { canonical: "https://beton.is/samband" },
};

function SideBlock({
  label,
  value,
  href,
  mono,
  children,
}: {
  label: string;
  value?: string;
  href?: string;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="py-6 border-t border-concrete">
      <div className="text-[11px] font-mono tracking-[0.12em] text-fog uppercase mb-2">
        {label}
      </div>
      {href ? (
        <a
          href={href}
          className={`${mono ? "font-mono" : ""} text-[16px] text-ink border-b border-ink pb-0.5 hover:text-navy`}
        >
          {value}
        </a>
      ) : children ? (
        <div className="text-base text-ink leading-[1.5]">{children}</div>
      ) : (
        <div className={`${mono ? "font-mono" : ""} text-base text-ink leading-[1.5]`}>{value}</div>
      )}
    </div>
  );
}

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

          {/* Form + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-20">
            <div className="bg-paper border border-concrete-dk p-8 md:p-12">
              <div className="font-mono text-[11px] tracking-[0.12em] text-fog uppercase mb-8">
                Skilaboð · Form
              </div>
              <ContactForm />
            </div>

            <div className="flex flex-col">
              <SideBlock
                label="Netfang"
                value={COMPANY.email}
                href={`mailto:${COMPANY.email}`}
              />
              <SideBlock label="Staðsetning" value={COMPANY.location} />
              <SideBlock label="Kennitala" value={COMPANY.kennitala} mono />
              <SideBlock label="Þjónustusvæði">
                Höfuðborgarsvæðið innifalið. Önnur svæði eftir samkomulagi.
              </SideBlock>

              <div className="mt-8 bg-ink text-paper p-8">
                <div className="font-mono text-[11px] tracking-[0.12em] text-copper uppercase mb-4">
                  Vilt frekar bóka beint?
                </div>
                <div className="text-[22px] font-medium leading-[1.25] mb-6 tracking-[-0.015em]">
                  Bóka skoðun á netinu og veldu dagsetningu sem hentar.
                </div>
                <Link
                  href="/skodun"
                  className="inline-flex items-center gap-2 text-sm text-paper border-b border-copper pb-1"
                >
                  Til bókunar →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
