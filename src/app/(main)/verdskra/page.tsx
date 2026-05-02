import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow, NumberedDivider } from "@/components/Editorial";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Verðskrá — ástandsskoðun frá 129.900 kr.",
  description:
    "Verðskrá Beton ehf. fyrir ástandsskoðun fasteigna á höfuðborgarsvæðinu. Gagnsæ verðlagning með virðisaukaskatti, akstur innifalinn.",
  alternates: { canonical: "https://beton.is/verdskra" },
};

const residential = [
  { size: "0–100 m²", price: "129.900", note: "Stúdíó, lítil íbúð" },
  { size: "101–200 m²", price: "159.900", note: "Sérhæð, raðhús" },
  { size: "201–300 m²", price: "189.900", note: "Einbýli, parhús" },
  { size: "301–400 m²", price: "219.900", note: "Stærra einbýli" },
  { size: "Yfir 400 m²", price: "Tilboð", note: "Sérverkefni" },
];

function TilbodCard({ n, label, body }: { n: string; label: string; body: string }) {
  return (
    <div className="bg-ink text-paper rounded-[2px] p-10 lg:p-12 flex flex-col justify-between min-h-[320px]">
      <div>
        <div className="flex justify-between items-baseline mb-8">
          <div className="text-[11px] font-mono tracking-[0.12em] text-copper uppercase">
            {n} / {label}
          </div>
          <div className="text-[32px] font-medium text-paper tracking-[-0.02em]">Tilboð</div>
        </div>
        <p className="text-base leading-[1.6] text-paper/75">{body}</p>
      </div>
      <a
        href={`mailto:${COMPANY.email}`}
        className="mt-8 px-6 py-4 bg-paper/[0.06] border border-paper/[0.18] text-paper text-sm font-medium flex justify-between items-center rounded-[2px] hover:bg-paper/10 transition-colors"
      >
        <span>Óska eftir tilboði</span>
        <span className="opacity-60">→</span>
      </a>
    </div>
  );
}

export default function Verdskra() {
  return (
    <>
      {/* Intro */}
      <section className="px-6 lg:px-14 pt-20 lg:pt-24 pb-16">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12 md:gap-24">
            <div>
              <Eyebrow>Verðskrá</Eyebrow>
              <div className="text-xs text-fog font-mono mt-12 lg:mt-14 tracking-[0.08em]">
                Gildir frá 01.01.2026
                <br />
                Verðskrá v. 3.2
              </div>
            </div>
            <div>
              <h1 className="text-[44px] lg:text-[64px] leading-none font-medium tracking-[-0.03em] mb-8 text-balance">
                Verð miðað við stærð.
                <br />
                <span className="italic-accent">Engar undanskotnar tölur.</span>
              </h1>
              <p className="text-[17.5px] leading-[1.55] text-fog max-w-[640px]">
                Allar tölur eru með VSK. Akstur innan höfuðborgarsvæðisins er innifalinn.
                Skýrsla afhent innan 5 virkra daga frá skoðun.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Residential table */}
      <section className="px-6 lg:px-14 pb-20 lg:pb-24">
        <div className="mx-auto max-w-[1280px]">
          <NumberedDivider n="01" label="Íbúðarhúsnæði" />

          <div className="border border-concrete-dk bg-paper">
            {/* Header row */}
            <div className="hidden md:grid grid-cols-[120px_1.4fr_2fr_1fr_1fr] px-8 py-5 bg-paper-alt border-b border-concrete-dk text-[11px] tracking-[0.12em] uppercase font-mono text-fog font-semibold">
              <div>Þrep</div>
              <div>Stærð</div>
              <div>Lýsing</div>
              <div className="text-right">Verð</div>
              <div></div>
            </div>
            {residential.map((r, i) => (
              <div
                key={r.size}
                className={`grid grid-cols-[60px_1fr] md:grid-cols-[120px_1.4fr_2fr_1fr_1fr] px-6 md:px-8 py-6 md:py-8 items-center gap-y-2 ${
                  i === residential.length - 1 ? "" : "border-b border-concrete"
                } ${i === 1 ? "bg-copper/[0.04]" : ""}`}
              >
                <div className="font-mono text-[13px] text-copper tracking-[0.05em]">
                  T{i + 1}
                </div>
                <div className="text-[20px] md:text-[22px] font-medium tracking-[-0.01em] text-ink">
                  {r.size}
                </div>
                <div className="hidden md:block text-[14.5px] text-fog">{r.note}</div>
                <div className="md:text-right flex items-baseline md:justify-end gap-1">
                  <span className="text-[24px] md:text-[26px] font-medium text-ink tracking-[-0.02em]">
                    {r.price}
                  </span>
                  {r.price !== "Tilboð" && <span className="text-[14px] text-fog">kr.</span>}
                </div>
                <div className="md:text-right">
                  <Link
                    href="/skodun"
                    className="text-[13px] text-ink border-b border-ink pb-0.5"
                  >
                    Bóka →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[
              ["VSK", "Innifalin í verði"],
              ["Akstur", "Höfuðborgarsvæðið innifalið"],
              ["Skýrsla", "Afhent innan 5 virkra daga"],
            ].map(([k, v]) => (
              <div key={k} className="px-6 py-5 bg-paper-alt border-l-2 border-copper">
                <div className="text-[11px] text-fog tracking-[0.12em] uppercase font-mono mb-1.5">
                  {k}
                </div>
                <div className="text-[15px] text-ink">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commercial + Housing */}
      <section className="px-6 lg:px-14 pb-24 lg:pb-32">
        <div className="mx-auto max-w-[1280px] grid grid-cols-1 md:grid-cols-2 gap-6">
          <TilbodCard
            n="02"
            label="Atvinnuhúsnæði"
            body="Skrifstofur, verslunarhúsnæði, iðnaðarhúsnæði og blanda eigna. Verð miðast við umfang skoðunar, fjölda eininga og nauðsyn sérstakra mælinga."
          />
          <TilbodCard
            n="03"
            label="Húsfélög"
            body="Sameignir, fjölbýli og raðhúsalengjur. Yfirlitsskoðun á húsasameigninni með áherslu á þök, klæðningar, lagnir og frágang sameignarrýma."
          />
        </div>
      </section>
    </>
  );
}
