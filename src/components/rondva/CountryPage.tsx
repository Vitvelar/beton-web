import Link from "next/link";
import { BRANDS } from "@/lib/brand";
import { money, type Country } from "@/lib/rondva-countries";
import { RONDVA_INCLUDED, RONDVA_OFFER_LINE, RONDVA_PACK, RONDVA_PLANS } from "@/lib/rondva-pricing";
import { breadcrumbLd, faqPageLd, organizationLd, softwareApplicationLd } from "@/lib/rondva-seo";
import { rvBtn } from "@/components/rondva/ui";
import { RondvaHeader } from "@/components/rondva/RondvaHeader";
import { RondvaFooter } from "@/components/rondva/RondvaFooter";
import { AppStoreBadge, AppStoreQr } from "@/components/rondva/AppStoreBadge";
import { JsonLd } from "@/components/rondva/JsonLd";
import { PhoneFrame } from "@/components/rondva/PhoneFrame";
import { RevealObserver } from "@/components/rondva/Reveal";
import { SectionHeading } from "@/components/rondva/SectionHeading";
import { WhereAiStops } from "@/components/rondva/WhereAiStops";

// Sameiginlegt útlit landasíðnanna /au, /uk, /ie, /us og /ca (sama röð og /nz): hetja, hvað er í
// skýrslunni, á staðnum án merkis, „Where the AI stops“, verð í mynt landsins og spurningar.
// Allur texti kemur úr src/lib/rondva-countries.ts; FAQ-svörin eru sami texti og í FAQPage JSON-LD.

const check = (
  <svg
    viewBox="0 0 20 20"
    className="mt-px h-5 w-5 shrink-0 text-blue"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m4 10.5 4 4 8-9" />
  </svg>
);

const soloReports = RONDVA_PLANS.find((p) => p.id === "solo")?.reports ?? 0;
const proReports = RONDVA_PLANS.find((p) => p.id === "pro")?.reports ?? 0;

export function CountryPage({ country }: { country: Country }) {
  const c = country;
  const id = c.code;
  const plans = [
    { name: "Solo", price: `${money(c, "solo")}/month`, body: `${soloReports} AI-drafted reports a month.` },
    { name: "Pro", price: `${money(c, "pro")}/month`, body: `${proReports} AI-drafted reports a month.` },
    {
      name: RONDVA_PACK.name,
      price: `${money(c, "pack")} one-time`,
      body: `${RONDVA_PACK.blurb} They never expire.`,
    },
  ];

  return (
    <>
      <JsonLd
        nodes={[
          organizationLd(),
          softwareApplicationLd({ currency: c.currencyCode, ...c.prices }),
          breadcrumbLd([
            { name: "Rondva", path: "/" },
            { name: c.name, path: c.path },
          ]),
          faqPageLd(c.faq.map((f) => ({ q: f.q, a: f.a }))),
        ]}
      />
      <RondvaHeader />
      <main id="content" className="flex-1">
        {/* 1. Hetja */}
        <section aria-labelledby={`${id}-title`} className="rv-hero rv-blueprint rv-grain relative overflow-hidden px-6 text-paper">
          <div className="pointer-events-none absolute -right-64 -top-72 h-[560px] w-[560px] rounded-full bg-blue/25 blur-[140px]" aria-hidden="true" />
          <div className="relative mx-auto max-w-[1180px] pb-16 pt-12 sm:pt-16 md:pb-24 md:pt-20">
            <p className="rv-eyebrow rv-eyebrow-inverse">{c.eyebrow}</p>
            <h1
              id={`${id}-title`}
              className="rv-display rv-balance mt-6 max-w-4xl text-[40px] sm:text-[56px] md:text-[64px]"
            >
              {c.h1.before}
              <em>{c.h1.em}</em>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-on-inverse-muted md:text-xl">{c.lead}</p>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-on-inverse-muted">{c.formatLine}</p>
            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-4 lg:items-end">
              <AppStoreBadge />
              {c.sample?.enabled ? (
                <a href={c.sample.url} className={rvBtn("inverse", "md")}>
                  See a sample report (PDF)
                </a>
              ) : null}
              <AppStoreQr className="lg:ml-2" />
            </div>
            <p className="mt-6 text-sm text-on-inverse-muted">{RONDVA_OFFER_LINE}</p>
          </div>
        </section>

        {/* 2. Hvað er í skýrslunni */}
        <section className="px-6 py-20 md:py-28" aria-labelledby={`${id}-contents-title`}>
          <div
            className={`mx-auto max-w-[1180px] ${c.screen ? "grid gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20" : ""}`}
          >
            <div className={c.screen ? "" : "max-w-3xl"}>
              <SectionHeading id={`${id}-contents-title`} eyebrow="What's in the report">
                {c.format.heading}
              </SectionHeading>
              <ul className="mt-12 space-y-6">
                {c.format.items.map((item, i) => (
                  <li key={item.title} className="rv-reveal flex gap-4" style={{ "--i": i } as React.CSSProperties}>
                    {check}
                    <div>
                      <h3 className="text-[17px] font-semibold tracking-tight text-ink">{item.title}</h3>
                      <p className="mt-1 leading-relaxed text-muted">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="rv-reveal mt-10 max-w-xl text-sm leading-relaxed text-muted">{c.format.note}</p>
            </div>
            {c.screen ? (
              <figure className="rv-reveal flex flex-col items-center gap-6 lg:items-start" style={{ "--i": 2 } as React.CSSProperties}>
                <div className="flex items-end justify-center gap-6">
                  <PhoneFrame src={c.screen.src} alt={c.screen.alt} className={c.screen.aspect} />
                </div>
                <figcaption className="max-w-xs text-center text-sm leading-relaxed text-muted lg:text-left">
                  {c.screen.caption}
                </figcaption>
              </figure>
            ) : null}
          </div>
        </section>

        {/* 3. Á staðnum án merkis (engin símamynd: skjámyndirnar sýna NZ-efni) */}
        <section className="rv-blueprint-light px-6 py-20 md:py-28" aria-labelledby={`${id}-site-title`}>
          <div className="mx-auto max-w-[1180px]">
            <SectionHeading id={`${id}-site-title`} eyebrow="On site">
              {c.offline.heading}
            </SectionHeading>
            <p className="rv-reveal mt-6 max-w-xl text-lg leading-relaxed text-muted" style={{ "--i": 1 } as React.CSSProperties}>
              {c.offline.body}
            </p>
          </div>
        </section>

        {/* 4. Hvar gervigreindin stoppar (sameiginlegur kafli) */}
        <WhereAiStops />

        {/* 5. Verð í mynt landsins (App Store-verð; ekkert verð á skýrslu) */}
        <section aria-labelledby={`${id}-pricing-title`} className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <SectionHeading id={`${id}-pricing-title`} eyebrow={`Pricing ${c.inName}`}>
              Priced in {c.currencyName}, charged by Apple.
            </SectionHeading>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {plans.map((p, i) => (
                <div
                  key={p.name}
                  className="rv-reveal rounded-card border border-line bg-surface p-7"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <p className="rv-eyebrow">{p.name}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{p.price}</p>
                  <p className="mt-3 leading-relaxed text-muted">{p.body}</p>
                </div>
              ))}
            </div>
            <div className="rv-reveal mt-8 max-w-2xl" style={{ "--i": 1 } as React.CSSProperties}>
              <p className="leading-relaxed text-muted">
                {c.taxLine} {RONDVA_OFFER_LINE} {RONDVA_INCLUDED[1]}.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                <AppStoreBadge />
                <Link href="/#pricing" className={rvBtn("secondary", "md")}>
                  All plans and the offer
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Spurningar (sami texti og í FAQPage JSON-LD) */}
        <section className="px-6 pb-24 md:pb-32" aria-labelledby={`${id}-faq-title`}>
          <div className="mx-auto max-w-[1180px]">
            <SectionHeading id={`${id}-faq-title`} eyebrow="Questions">
              Short answers.
            </SectionHeading>
            <dl className="mt-12 grid gap-x-14 gap-y-10 md:grid-cols-2">
              {c.faq.map((f, i) => (
                <div key={f.id} className="rv-reveal border-t border-line pt-6" style={{ "--i": i % 2 } as React.CSSProperties}>
                  <dt className="font-serif text-[22px] font-semibold tracking-tight text-ink">{f.q}</dt>
                  <dd className="mt-2 leading-relaxed text-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
            <p className="rv-reveal mt-12 text-sm text-muted">
              More answers on the{" "}
              <Link href="/support" className="underline underline-offset-4">support page</Link>. Not on iPhone? Email{" "}
              <a href={`mailto:${BRANDS.rondva.contactEmail}`} className="underline underline-offset-4">
                {BRANDS.rondva.contactEmail}
              </a>
              .
            </p>
          </div>
        </section>
      </main>
      <RondvaFooter />
      <RevealObserver />
    </>
  );
}
