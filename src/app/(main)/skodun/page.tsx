import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/Editorial";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Bóka ástandsskoðun í Reykjavík og nágrenni",
  description:
    "Bókaðu ástandsskoðun fasteigna hjá Beton ehf. á höfuðborgarsvæðinu. Fagleg skoðun með ítarlegri skýrslu.",
  alternates: { canonical: "https://beton.is/skodun" },
};

export default function Skodun() {
  return (
    <>
      <section className="px-6 lg:px-14 pt-20 lg:pt-24 pb-24 lg:pb-32">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12 md:gap-24 mb-16 lg:mb-20">
            <div>
              <Eyebrow>Bóka skoðun</Eyebrow>
            </div>
            <div>
              <h1 className="text-[40px] lg:text-[56px] leading-none font-medium tracking-[-0.03em] mb-6 text-balance">
                Bókaðu ástandsskoðun
                <br />
                <span className="italic-accent">á fasteign.</span>
              </h1>
              <p className="text-[17px] leading-[1.55] text-fog max-w-[640px]">
                Hafðu samband við okkur til að bóka skoðun. Skýrsla vegna ástandsskoðunar
                er afhent innan 48 klst. frá framkvæmd skoðunar.
              </p>
            </div>
          </div>

          <div className="max-w-[640px] mx-auto">
            <div className="bg-ink text-paper p-10 lg:p-14">
              <div className="font-mono text-[11px] tracking-[0.12em] text-copper uppercase mb-8">
                Hafðu samband
              </div>
              <h2 className="text-[28px] lg:text-[36px] font-medium tracking-[-0.02em] mb-8 leading-[1.1]">
                Sendu okkur fyrirspurn og við finnum tíma sem hentar.
              </h2>

              <div className="space-y-5 mb-10">
                <div className="flex items-center gap-4 py-4 border-t border-paper/12">
                  <span className="text-[13px] text-paper/60 min-w-[80px]">Netfang</span>
                  <a
                    href={`mailto:${COMPANY.email}`}
                    className="text-[17px] text-paper font-medium hover:text-copper transition-colors"
                  >
                    {COMPANY.email}
                  </a>
                </div>
                <div className="flex items-center gap-4 py-4 border-t border-paper/12">
                  <span className="text-[13px] text-paper/60 min-w-[80px]">Staðsetning</span>
                  <span className="text-[17px] text-paper font-medium">{COMPANY.location}</span>
                </div>
                <div className="flex items-center gap-4 py-4 border-t border-b border-paper/12">
                  <span className="text-[13px] text-paper/60 min-w-[80px]">Svæði</span>
                  <span className="text-[17px] text-paper font-medium">Höfuðborgarsvæðið og nágrenni</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="px-7 py-4 bg-paper text-ink text-[14.5px] font-semibold flex justify-between items-center flex-1"
                >
                  <span>Senda tölvupóst</span>
                  <span>→</span>
                </a>
                <Link
                  href="/samband"
                  className="px-7 py-4 border border-paper/25 text-paper text-[14.5px] font-medium flex justify-between items-center flex-1"
                >
                  <span>Fylla út form</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
