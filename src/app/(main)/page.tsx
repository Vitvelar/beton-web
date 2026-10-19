import Image from "next/image";
import Link from "next/link";
import { Eyebrow, metaLabel } from "@/components/Editorial";
import { ContactForm } from "@/components/ContactForm";
import { PRICING, COMPANY } from "@/lib/constants";
import { FAQ } from "@/lib/faq";
import { btn } from "@/lib/ui";

const SERVICES = [
  {
    title: "Ástandsskoðun",
    body: "Ítarleg úttekt á ástandi fasteignar — þak, klæðningar, raki og burðarvirki. Niðurstöður flokkaðar eftir alvarleika með skýrum tillögum að úrbótum.",
  },
  {
    title: "Kostnaðaráætlun",
    body: "Áætlun um kostnað við þær úrbætur sem skoðun leiðir í ljós, svo þú hafir skýra mynd af því sem framundan er áður en gengið er frá kaupum.",
  },
  {
    title: "Gerð útboðsgagna",
    body: "Útboðsgögn fyrir viðhaldsverk — verklýsingar, magnskrár og kostnaðaráætlanir — svo verktakar bjóði í sama verkið og tilboðin verði samanburðarhæf.",
  },
  {
    title: "Útboð viðhaldsverka",
    body: "Umsjón með útboði viðhaldsverka fyrir húsfélög og eigendur, frá auglýsingu til yfirferðar tilboða og ráðgjafar við val á verktaka.",
  },
  {
    title: "Eftirlit með framkvæmdum",
    body: "Faglegt eftirlit á verktíma sem tryggir að verkið sé unnið samkvæmt útboðsgögnum, með góðum frágangi og innan kostnaðaráætlunar.",
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
      className={`relative rounded-sharp border px-8 py-10 ${
        featured ? "border-ink bg-ink text-paper" : "border-concrete bg-paper text-ink"
      }`}
    >
      {featured && (
        <div className="absolute top-5 right-5 inline-flex h-6 items-center rounded-full bg-accent-on-inverse px-2.5 text-xs font-semibold text-ink">
          Algengust
        </div>
      )}
      <div className={`${metaLabel} mb-6 ${featured ? "text-on-inverse-muted" : ""}`}>
        Íbúðarhúsnæði
      </div>
      <div className="mb-1.5 text-h4 font-medium">{size}</div>
      <div className={`mb-8 text-sm ${featured ? "text-on-inverse-muted" : "text-fog"}`}>{note}</div>
      <div
        className={`flex items-baseline gap-1.5 border-t pt-6 ${
          featured ? "border-paper/20" : "border-concrete-dk"
        }`}
      >
        <span className="text-4xl font-medium tracking-tight">{price}</span>
        <span className={`text-base ${featured ? "text-on-inverse-muted" : "text-fog"}`}>kr.</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* HERO — editorial split */}
      <section className="px-6 pt-16 pb-20 lg:px-14 lg:pt-24 lg:pb-28">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div>
              <h1 className="mb-8 text-display font-medium text-ink text-balance">
                Traust
                <br />
                <span className="italic-accent">ástandsskoðun.</span>
              </h1>
              <a
                href={COMPANY.phoneHref}
                className="group mb-8 inline-flex min-h-11 items-baseline gap-3 text-ink"
              >
                <span className={metaLabel}>Sími</span>
                <span className="border-b-2 border-navy text-3xl font-medium tracking-tight transition-colors group-hover:border-ink lg:text-4xl">
                  {COMPANY.phone}
                </span>
              </a>
              <p className="mb-8 max-w-[560px] text-lead text-ink">
                Við sérhæfum okkur í ástandsskoðunum fasteigna og veitum faglega og
                hlutlausa ráðgjöf fyrir bæði kaupendur og seljendur. Markmið okkar er
                að tryggja að þú hafir skýra mynd af ástandi eignarinnar.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/samband" className={btn("primary", "lg")}>
                  Hafa samband <span aria-hidden="true">→</span>
                </Link>
                <Link href="/verdskra" className={btn("secondary", "lg")}>
                  Sjá verðskrá
                </Link>
              </div>
            </div>

            {/* Right: hero image of old house in Reykjavík */}
            <div className="relative">
              <div className="relative aspect-3/4 overflow-hidden rounded-sharp bg-concrete">
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
        </div>
      </section>

      {/* ÞJÓNUSTUFRAMBOÐ */}
      <section className="bg-paper-alt px-6 py-20 lg:px-14 lg:py-28">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-16">
            <Eyebrow>Þjónustuframboð Beton</Eyebrow>
            <h2 className="mt-5 max-w-[720px] text-h2 font-medium text-balance">
              Fagleg ráðgjöf um viðhald
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, i) => (
              <div key={s.title} className="rounded-sharp border border-concrete bg-paper p-8">
                <div className="mb-5 font-mono text-xs uppercase tracking-widest text-navy">
                  0{i + 1}
                </div>
                <h3 className="mb-3.5 text-h3 font-medium text-ink">{s.title}</h3>
                <p className="text-base leading-relaxed text-fog">{s.body}</p>
              </div>
            ))}
            {/* Sjötta spjaldið lokar rist með þremur dálkum og vísar á næsta skref. */}
            <div className="flex flex-col items-start rounded-sharp border border-concrete bg-paper p-8">
              <div className="mb-5 font-mono text-xs uppercase tracking-widest text-navy">
                Næsta skref
              </div>
              <h3 className="mb-3.5 text-h3 font-medium text-ink">Hafa samband</h3>
              <p className="mb-8 text-base leading-relaxed text-fog">
                Ertu með verkefni í huga? Segðu okkur frá því og við förum yfir næstu
                skref saman.
              </p>
              <Link href="/samband" className={btn("primary", "md", "mt-auto")}>
                Hafa samband <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* UM OKKUR — founder preview */}
      <section className="px-6 py-20 lg:px-14 lg:py-28">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-[5fr_7fr] md:gap-16">
            <div className="relative aspect-4/5 overflow-hidden rounded-sharp bg-concrete shadow-xl">
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
              <h2 className="mt-5 mb-7 text-h2 font-medium text-balance">
                Byggingafræðingur og smiður með mikla reynslu
              </h2>
              <div className="max-w-[600px] space-y-5 text-base text-ink lg:text-lead">
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
              <Link href="/umokkur" className={btn("quiet", "md", "mt-6 -ml-2 px-2!")}>
                Lesa meira um Beton <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section className="bg-paper-alt px-6 py-20 lg:px-14 lg:py-28">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-24 lg:mb-20">
            <div>
              <Eyebrow>Verðskrá</Eyebrow>
              <h2 className="mt-5 text-h2 font-medium">
                Gagnsæ verðlagning.
                <br />
                Enginn falinn kostnaður.
              </h2>
            </div>
            <div className="md:pt-3">
              <p className="text-lead text-fog">
                Verð miðast við stærð íbúðarhúsnæðis. VSK innifalin og akstur innan
                höfuðborgarsvæðisins. Atvinnuhúsnæði og húsfélög samkvæmt tilboði.
              </p>
              <Link href="/verdskra" className={btn("quiet", "md", "mt-4 -ml-2 px-2!")}>
                Sjá fulla verðskrá <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <PriceTier size={PRICING.residential[0].size} price="129.900" note="Stúdíó, lítil íbúð, raðhús" />
            <PriceTier size={PRICING.residential[1].size} price="159.900" note="Sérhæð, einbýli, raðhús" featured />
            <PriceTier size={PRICING.residential[2].size} price="189.900" note="Stærra einbýli, parhús" />
          </div>
        </div>
      </section>

      {/* SPURT OG SVARAÐ — FAQ for SEO/AEO */}
      <section className="px-6 py-20 lg:px-14 lg:py-28">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_2fr] md:gap-24">
            <div>
              <Eyebrow>Spurt og svarað</Eyebrow>
              <h2 className="mt-5 text-h2 font-medium text-balance">
                Algengar spurningar um ástandsskoðun.
              </h2>
            </div>
            <div className="divide-y divide-concrete-dk border-t border-concrete-dk">
              {FAQ.map(({ q, a }) => (
                <details key={q} className="group">
                  <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                    <h3 className="text-h4 font-medium text-ink">{q}</h3>
                    <span
                      aria-hidden="true"
                      className="mt-1 text-xl leading-none text-fog transition-transform group-open:rotate-45 motion-reduce:transition-none"
                    >
                      +
                    </span>
                  </summary>
                  <p className="-mt-2 max-w-[640px] pb-6 text-base leading-relaxed text-fog">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT — closing band with form */}
      <section id="hafa-samband" className="bg-ink px-6 py-24 text-paper lg:px-14 lg:py-32">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          <div>
            <Eyebrow onDark>Hafðu samband</Eyebrow>
            <h2 className="mt-6 mb-7 text-h2 font-medium text-paper text-balance">
              Tilbúin að bóka
              <br />
              skoðun á fasteign?
            </h2>
            <p className="max-w-[540px] text-lead text-on-inverse-muted">
              Ástandsskoðunarskýrsla er afhent innan 48 klukkustunda frá ástandsskoðun.
              Hafðu samband með því að fylla út formið{" "}
              <span className="hidden lg:inline">hér til hliðar</span>
              <span className="lg:hidden">hér að neðan</span> eða sendu tölvupóst á{" "}
              <a
                href={`mailto:${COMPANY.email}`}
                className="text-paper underline decoration-paper/40 underline-offset-4 transition-colors hover:decoration-paper"
              >
                {COMPANY.email}
              </a>{" "}
              eða hringdu í síma{" "}
              <a
                href={COMPANY.phoneHref}
                className="whitespace-nowrap text-paper underline decoration-paper/40 underline-offset-4 transition-colors hover:decoration-paper"
              >
                {COMPANY.phone}
              </a>
              .
            </p>
          </div>
          <div className="rounded-sharp bg-paper p-8 text-ink md:p-10">
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
