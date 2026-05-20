import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/Editorial";
import { BetonMark } from "@/components/BetonMark";
import { PRICING, COMPANY } from "@/lib/constants";

const SERVICES = ["Ástandsskoðun", "Kostnaðarmat", "Ástand pípulagna"];

function PriceTier({
  size,
  price,
  note,
  featured,
}: {
  size: string;
  price: string;
  note: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative px-8 py-10 rounded-[2px] border ${
        featured ? "bg-ink border-ink text-paper" : "bg-paper border-concrete-dk text-ink"
      }`}
    >
      {featured && (
        <div className="absolute top-5 right-5 px-2 py-1 bg-copper text-paper text-[10px] tracking-[0.1em] font-semibold uppercase font-mono">
          Algengust
        </div>
      )}
      <div
        className={`text-xs font-mono tracking-[0.1em] uppercase mb-6 ${
          featured ? "text-paper/60" : "text-fog"
        }`}
      >
        Íbúðarhúsnæði
      </div>
      <div className="text-[22px] font-medium mb-1.5">{size}</div>
      <div className={`text-[13.5px] mb-8 ${featured ? "text-paper/65" : "text-fog"}`}>{note}</div>
      <div
        className={`flex items-baseline gap-1.5 pt-6 border-t ${
          featured ? "border-paper/[0.18]" : "border-concrete-dk"
        }`}
      >
        <span className="text-[38px] font-medium tracking-[-0.02em]">{price}</span>
        <span className="text-[15px] opacity-70">kr.</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* HERO — editorial split */}
      <section className="mx-auto max-w-[1280px] px-6 lg:px-14 pt-16 lg:pt-[88px] pb-20 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
          <div>
            <h1 className="text-[56px] lg:text-[84px] leading-[0.95] font-medium tracking-[-0.035em] text-ink mb-7 text-balance">
              Fagleg og
              <br />
              hlutlaus
              <br />
              <span className="italic-accent">ráðgjöf.</span>
            </h1>
            <p className="text-lg leading-[1.55] text-fog max-w-[520px] mb-10">
              Við sérhæfum okkur í ástandsskoðunum fasteigna og veitum faglega og
              hlutlausa ráðgjöf fyrir bæði kaupendur og seljendur.
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <Link
                href="/skodun"
                className="inline-flex items-center gap-2.5 px-7 py-4 bg-ink text-paper text-[14.5px] font-semibold rounded-[2px] hover:bg-navy-deep transition-colors"
              >
                Bóka skoðun
                <span className="opacity-70">→</span>
              </Link>
              <Link
                href="/verdskra"
                className="inline-flex items-center px-7 py-4 text-ink text-[14.5px] font-medium border-b border-ink"
              >
                Sjá verðskrá
              </Link>
            </div>
          </div>

          {/* Right: hero image of old house in Reykjavík */}
          <div className="relative">
            <div className="relative aspect-[3/4] rounded-[2px] overflow-hidden bg-concrete">
              <Image
                src="/images/hero.jpg"
                alt="Litrík timburhús í miðbæ Reykjavíkur"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 600px"
              />
            </div>
            {/* Floating chevron mark */}
            <div className="hidden md:flex absolute -top-8 -right-8 w-[88px] h-[88px] bg-paper border border-concrete-dk items-center justify-center rounded-[2px]">
              <BetonMark color="var(--color-navy)" size={44} />
            </div>
          </div>
        </div>
      </section>

      {/* ÞJÓNUSTUFRAMBOÐ */}
      <section className="bg-paper-alt px-6 lg:px-14 py-20 lg:py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-16">
            <Eyebrow>Þjónustuframboð Beton</Eyebrow>
            <h2 className="text-[36px] lg:text-[48px] leading-[1.05] font-medium tracking-[-0.03em] mt-5 max-w-[720px] text-balance">
              Veldu þá þjónustu sem hentar þér.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SERVICES.map((s) => (
              <Link
                key={s}
                href="/samband"
                className="group bg-paper border border-concrete-dk px-8 py-7 flex items-center justify-between hover:border-ink transition-colors"
              >
                <span className="text-[18px] font-medium tracking-[-0.01em] text-navy group-hover:text-ink transition-colors">
                  {s}
                </span>
                <span className="text-navy text-xl">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section className="px-6 lg:px-14 py-24 lg:py-32">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 mb-16 lg:mb-20">
            <div>
              <Eyebrow>Verðskrá</Eyebrow>
              <h2 className="text-[36px] lg:text-[48px] leading-[1.05] font-medium tracking-[-0.03em] mt-5">
                Gagnsæ verðlagning.
                <br />
                Engin falinn kostnaður.
              </h2>
            </div>
            <div className="md:pt-3">
              <p className="text-[17px] leading-[1.6] text-fog">
                Verð miðast við stærð íbúðarhúsnæðis. VSK innifalin og akstur innan
                höfuðborgarsvæðisins. Atvinnuhúsnæði og húsfélög samkvæmt tilboði.
              </p>
              <Link
                href="/verdskra"
                className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-ink border-b border-ink pb-0.5"
              >
                Sjá fulla verðskrá <span>→</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PriceTier size={PRICING.residential[0].size} price="129.900" note="Stúdíó, lítil íbúð, raðhús" />
            <PriceTier size={PRICING.residential[1].size} price="159.900" note="Sérhæð, einbýli, raðhús" featured />
            <PriceTier size={PRICING.residential[2].size} price="189.900" note="Stærra einbýli, parhús" />
          </div>
        </div>
      </section>

      {/* CTA — closing band */}
      <section className="bg-ink text-paper px-6 lg:px-14 py-20 lg:py-24">
        <div className="mx-auto max-w-[1280px] grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <Eyebrow color="var(--color-copper)">Hafðu samband</Eyebrow>
            <h2 className="text-[40px] lg:text-[56px] leading-none font-medium tracking-[-0.03em] mt-6 mb-6 text-paper text-balance">
              Tilbúin að bóka
              <br />
              skoðun á fasteign?
            </h2>
            <p className="text-[17px] leading-[1.6] text-paper/70 max-w-[540px]">
              Skýrsla vegna ástandsskoðunar er afhent innan 48 klst. frá framkvæmd skoðunar.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/skodun"
              className="px-7 py-5 bg-paper text-ink text-[15px] font-semibold flex justify-between items-center rounded-[2px]"
            >
              <span>Bóka skoðun á netinu</span>
              <span>→</span>
            </Link>
            <a
              href={`mailto:${COMPANY.email}`}
              className="px-7 py-5 text-paper text-[15px] font-medium border border-paper/25 flex justify-between items-center rounded-[2px]"
            >
              <span>{COMPANY.email}</span>
              <span className="opacity-60">↗</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
