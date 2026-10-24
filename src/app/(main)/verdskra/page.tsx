import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow, NumberedDivider, metaLabel } from "@/components/Editorial";
import { betonPageMetadata } from "@/lib/beton-metadata";
import { btn } from "@/lib/ui";

export const metadata: Metadata = betonPageMetadata({
  title: "Verðskrá — ástandsskoðun frá 129.900 kr.",
  description:
    "Verðskrá Beton ehf. fyrir ástandsskoðun fasteigna á höfuðborgarsvæðinu. Gagnsæ verðlagning með virðisaukaskatti, akstur innifalinn.",
  path: "/verdskra",
});

const residential = [
  { size: "0–100 m²", price: "129.900", note: "Stúdíó, lítil íbúð" },
  { size: "101–200 m²", price: "159.900", note: "Sérhæð, raðhús" },
  { size: "201–300 m²", price: "189.900", note: "Einbýli, parhús" },
  { size: "301–400 m²", price: "219.900", note: "Stærra einbýli" },
  { size: "Yfir 400 m²", price: "Tilboð", note: "Sérverkefni" },
];

function TilbodCard({ n, label, body }: { n: string; label: string; body: string }) {
  return (
    <div className="flex min-h-80 flex-col justify-between rounded-sharp border border-concrete bg-paper-alt p-8 text-ink lg:p-12">
      <div>
        <div className="mb-8 flex items-baseline justify-between">
          <div className="font-mono text-xs uppercase tracking-widest text-navy">
            {n} / {label}
          </div>
          <div className="text-h3 font-medium text-ink">Tilboð</div>
        </div>
        <p className="text-base leading-relaxed text-fog">{body}</p>
      </div>
      <Link href="/samband" className={btn("primary", "lg", "mt-8 w-full justify-between")}>
        <span>Óska eftir tilboði</span>
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

export default function Verdskra() {
  return (
    <>
      {/* Intro */}
      <section className="px-6 pt-20 pb-16 lg:px-14 lg:pt-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_2fr] md:gap-24">
            <div>
              <Eyebrow>Verðskrá</Eyebrow>
            </div>
            <div>
              <h1 className="mb-8 text-h1 font-medium text-balance">Verðskrá</h1>
              <div className="max-w-[640px] space-y-4 text-lead text-fog">
                <p>
                  Verð er gefið fyrir ástandsskoðun með skýrslu. Innifalið í verði er
                  allt verkfæragjald sem og akstur innan höfuðborgarsvæðisins.
                </p>
                <p>Skýrsla afhendist innan 48 klst. frá framkvæmd skoðunar.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Residential table */}
      <section className="px-6 pb-20 lg:px-14 lg:pb-28">
        <div className="mx-auto max-w-[1280px]">
          <NumberedDivider n="01" label="Íbúðarhúsnæði" />

          <div className="rounded-sharp border border-concrete bg-paper">
            {/* Header row */}
            <div className={`${metaLabel} hidden grid-cols-[100px_1.5fr_1fr_1fr] border-b border-concrete bg-paper-alt px-8 py-5 md:grid`}>
              <div>Þrep</div>
              <div>Stærð</div>
              <div className="text-right">Verð með VSK.</div>
              <div></div>
            </div>
            {residential.map((r, i) => (
              <div
                key={r.size}
                className={`grid grid-cols-[3rem_1fr] items-center gap-y-2 px-6 py-6 md:grid-cols-[100px_1.5fr_1fr_1fr] md:px-8 md:py-8 ${
                  i === residential.length - 1 ? "" : "border-b border-concrete"
                } ${i === 1 ? "bg-sev-calm-tint" : ""}`}
              >
                <div className="font-mono text-sm tracking-wide text-navy">T{i + 1}</div>
                <div className="text-h4 font-medium text-ink md:text-h3">{r.size}</div>
                <div className="col-start-2 flex items-baseline gap-1 md:col-start-auto md:justify-end">
                  <span className="text-2xl font-medium tracking-tight text-ink md:text-3xl">
                    {r.price}
                  </span>
                  {r.price !== "Tilboð" && <span className="text-base text-fog">kr.</span>}
                </div>
                <div className="col-start-2 md:col-start-auto md:text-right">
                  <Link href="/samband" className={btn("quiet", "md", "-ml-2 md:-mr-2 md:ml-0")}>
                    Bóka <span aria-hidden="true">→</span>
                    <span className="sr-only"> {r.size}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              ["VSK", "Innifalin í verði"],
              ["Akstur", "Höfuðborgarsvæðið innifalið"],
              ["Skýrsla", "Afhent innan 48 klst."],
            ].map(([k, v]) => (
              <div key={k} className="border-l-2 border-navy bg-paper-alt px-6 py-5">
                <div className={`${metaLabel} mb-1.5`}>{k}</div>
                <div className="text-base text-ink">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commercial + Housing */}
      <section className="px-6 pb-20 lg:px-14 lg:pb-28">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 md:grid-cols-2">
          <TilbodCard
            n="02"
            label="Atvinnuhúsnæði"
            body="Skrifstofur, verslunarhúsnæði, iðnaðarhúsnæði og blanda eigna. Verð miðast við umfang skoðunar, fjölda eininga og nauðsyn sérstakra mælinga."
          />
          <TilbodCard
            n="03"
            label="Húsfélög"
            body="Sameignir, fjölbýli og raðhúsalengjur. Yfirlitsskoðun á húsasameigninni með áherslu á þök, klæðningar og frágang sameignarrýma."
          />
        </div>
      </section>
    </>
  );
}
