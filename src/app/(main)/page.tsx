import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/Editorial";
import { ContactForm } from "@/components/ContactForm";
import { PRICING, COMPANY } from "@/lib/constants";
import { FAQ } from "@/lib/faq";

const SERVICES = [
  {
    title: "Ástandsskoðun",
    body: "Ítarleg úttekt á ástandi fasteignar — þak, klæðningar, lagnir, raki og burðarvirki. Niðurstöður flokkaðar eftir alvarleika með skýrum tillögum að úrbótum.",
  },
  {
    title: "Kostnaðarmat",
    body: "Mat á áætluðum kostnaði við þær úrbætur sem skoðun leiðir í ljós, svo þú hafir skýra mynd af því sem framundan er áður en gengið er frá kaupum.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

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
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-start">
          <div>
            <h1 className="text-[56px] lg:text-[84px] leading-[0.95] font-medium tracking-[-0.035em] text-ink mb-8 text-balance">
              Traust
              <br />
              <span className="italic-accent">ástandsskoðun.</span>
            </h1>
            <div className="text-[17px] lg:text-[18px] leading-[1.65] text-ink/80 max-w-[560px] mb-10 space-y-4">
              <p>
                Við sérhæfum okkur í ástandsskoðunum fasteigna og veitum faglega og
                hlutlausa ráðgjöf fyrir bæði kaupendur og seljendur. Markmið okkar er
                að tryggja að þú hafir skýra mynd af ástandi eignarinnar.
              </p>
              <p>
                Með áralanga reynslu úr byggingageiranum leggjum við áherslu á vönduð
                vinnubrögð, nákvæma skýrslugerð og góða þjónustu. Með faglegu og
                skilvirku verklagi gerir það okkur kleift að meta ástand eignarinnar
                og greina helstu áhættuþætti.
              </p>
              <p>
                Við trúum því að traust og gagnsæi skipti öllu máli. Þess vegna
                leggjum við okkur fram við að útskýra niðurstöður á mannamáli, svo
                þú getir tekið upplýsta ákvörðun og byggt hana á góðum grunni.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <Link
                href="/samband"
                className="inline-flex items-center gap-2.5 px-7 py-4 bg-navy text-paper text-[14.5px] font-semibold rounded-full hover:bg-navy-deep transition-colors"
              >
                Hafa samband
                <span className="opacity-80">→</span>
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
          </div>
        </div>
      </section>

      {/* ÞJÓNUSTUFRAMBOÐ */}
      <section className="bg-paper-alt px-6 lg:px-14 py-20 lg:py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-16">
            <Eyebrow>Þjónustuframboð Beton</Eyebrow>
            <h2 className="text-[36px] lg:text-[48px] leading-[1.05] font-medium tracking-[-0.03em] mt-5 max-w-[720px] text-balance">
              Fagleg ráðgjöf um viðhald
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SERVICES.map((s, i) => (
              <div key={s.title} className="bg-paper border border-concrete-dk px-8 py-9">
                <div className="font-mono text-[12px] tracking-[0.1em] text-copper uppercase mb-5">
                  0{i + 1}
                </div>
                <h3 className="text-[24px] font-medium tracking-[-0.015em] text-ink mb-3.5">
                  {s.title}
                </h3>
                <p className="text-[15.5px] leading-[1.65] text-fog">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UM OKKUR — founder preview */}
      <section className="px-6 lg:px-14 py-24 lg:py-32">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-12 md:gap-16 items-center">
            <div className="relative aspect-[4/5] rounded-[2px] overflow-hidden bg-concrete shadow-[0_30px_60px_-30px_rgba(10,13,46,0.25)]">
              <Image
                src="/images/bragi.webp"
                alt="Bragi Michaelsson, stofnandi Beton ehf."
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 500px"
              />
            </div>
            <div>
              <Eyebrow>Um okkur</Eyebrow>
              <h2 className="text-[32px] lg:text-[44px] leading-[1.05] font-medium tracking-[-0.025em] mt-5 mb-7 text-balance">
                Byggingafræðingur og smiður með mikla reynslu
              </h2>
              <div className="text-[16.5px] leading-[1.65] text-ink/80 space-y-5 max-w-[600px]">
                <p>
                  Bragi Michaelsson stofnaði Beton og leiðir hverja skoðun sjálfur. Hann
                  er byggingafræðingur og húsasmíðameistari með áralanga reynslu úr
                  byggingageiranum á Íslandi og í Danmörku.
                </p>
                <p>
                  Þessi blanda af handverki, fræðum og rekstrarþekkingu tryggir hlutlausa
                  úttekt þar sem niðurstöður eru útskýrðar á mannamáli — án hagsmunatengsla
                  við kaupanda, seljanda eða fasteignasala.
                </p>
              </div>
              <Link
                href="/umokkur"
                className="inline-flex items-center gap-2 mt-8 text-sm font-medium text-ink border-b border-ink pb-0.5"
              >
                Lesa meira um Beton <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section className="bg-paper-alt px-6 lg:px-14 py-24 lg:py-32">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 mb-16 lg:mb-20">
            <div>
              <Eyebrow>Verðskrá</Eyebrow>
              <h2 className="text-[36px] lg:text-[48px] leading-[1.05] font-medium tracking-[-0.03em] mt-5">
                Gagnsæ verðlagning.
                <br />
                Enginn falinn kostnaður.
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

      {/* SPURT OG SVARAÐ — FAQ for SEO/AEO */}
      <section className="px-6 lg:px-14 py-24 lg:py-32">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12 md:gap-24">
            <div>
              <Eyebrow>Spurt og svarað</Eyebrow>
              <h2 className="text-[32px] lg:text-[44px] leading-[1.05] font-medium tracking-[-0.03em] mt-5 text-balance">
                Algengar spurningar um ástandsskoðun.
              </h2>
            </div>
            <div className="divide-y divide-concrete-dk border-t border-concrete-dk">
              {FAQ.map(({ q, a }) => (
                <details key={q} className="group py-6">
                  <summary className="flex items-start justify-between gap-6 cursor-pointer list-none">
                    <h3 className="text-[19px] lg:text-[21px] font-medium tracking-[-0.01em] text-ink">
                      {q}
                    </h3>
                    <span className="mt-1 text-fog text-xl leading-none transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 text-[16px] leading-[1.65] text-fog max-w-[640px]">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT — closing band with form */}
      <section id="hafa-samband" className="bg-ink text-paper px-6 lg:px-14 py-20 lg:py-28">
        <div className="mx-auto max-w-[1280px] grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-20 items-start">
          <div>
            <Eyebrow color="var(--color-navy-soft)">Hafðu samband</Eyebrow>
            <h2 className="text-[40px] lg:text-[56px] leading-none font-medium tracking-[-0.03em] mt-6 mb-7 text-paper text-balance">
              Tilbúin að bóka
              <br />
              skoðun á fasteign?
            </h2>
            <p className="text-[17px] leading-[1.65] text-paper/70 max-w-[540px]">
              Ástandsskoðunarskýrsla er afhent innan 48 klukkustunda frá ástandsskoðun.
              Hafðu samband með því að fylla út formið hér til hliðar eða sendu tölvupóst á{" "}
              <a
                href={`mailto:${COMPANY.email}`}
                className="text-paper underline underline-offset-4 decoration-paper/40 hover:decoration-paper transition-colors"
              >
                {COMPANY.email}
              </a>
              .
            </p>
          </div>
          <div className="bg-paper text-ink p-8 md:p-10 rounded-[2px]">
            <ContactForm />
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
