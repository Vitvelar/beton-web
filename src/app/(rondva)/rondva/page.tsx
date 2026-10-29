import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BRANDS } from "@/lib/brand";
import { rondvaLanguages } from "@/lib/rondva-countries";
import { HAS_SAMPLE, SAMPLE_REPORT_URL } from "@/lib/rondva-links";
import {
  RONDVA_INCLUDED,
  RONDVA_OFFER_LINE,
  RONDVA_TRIAL,
  RONDVA_PACK,
  RONDVA_PLANS,
  RONDVA_PRICE_NOTE,
  perReport,
  usd,
} from "@/lib/rondva-pricing";
import { faqPageLd, organizationLd, softwareApplicationLd } from "@/lib/rondva-seo";
import { OFFLINE_ANSWER, RESPONSIBLE_ANSWER } from "@/lib/rondva-countries";
import { rvBtn } from "@/components/rondva/ui";
import { RondvaHeader } from "@/components/rondva/RondvaHeader";
import { RondvaFooter } from "@/components/rondva/RondvaFooter";
import { AppStoreBadge, AppStoreQr } from "@/components/rondva/AppStoreBadge";
import { JsonLd } from "@/components/rondva/JsonLd";
import { SectionHeading } from "@/components/rondva/SectionHeading";
import { WhereAiStops } from "@/components/rondva/WhereAiStops";
import { NoteToReport } from "@/components/rondva/NoteToReport";
import { HeroFilm } from "@/components/rondva/HeroFilm";
import { PhoneFrame } from "@/components/rondva/PhoneFrame";
import { RevealObserver } from "@/components/rondva/Reveal";
import {
  IconProperty,
  IconCamera,
  IconDraft,
  IconReview,
} from "@/components/rondva/RondvaIcons";

// Skjámyndir úr ensku NZS 4306-útgáfunni (release-assets/rondva-1.3.0/screenshots, skornar niður í
// skjásvæðið, webp) í public/rondva/screens/. Aldrei íslensk skjámynd (birtingarregla 4).
// `aspect` er hlutfall skorinnar myndar (breidd/hæð) svo ramminn klippi ekkert.
const SCREENS: { src?: string; alt: string; aspect: string }[] = [
  {
    src: "/rondva/screens/offline-nz.webp",
    alt: "Rondva on an iPhone with no signal: the Exterior area of a New Zealand inspection, with a photo and ratings for weatherboards, cladding, ground clearance, joinery, flashings, sealants and paint",
    aspect: "!aspect-[997/1881]",
  },
  {
    src: "/rondva/screens/overview-nz.webp",
    alt: "Rondva inspection overview for a New Zealand property: address, legal description (Lot and DP), year built, customer, inspector and weather, with counts of minor, serious and very serious findings",
    aspect: "!aspect-[997/2010]",
  },
];
const HAS_SCREENS = SCREENS.every((s) => !!s.src);

// „Who builds Rondva“: mynd af stofnanda. Skráin er sett í public/rondva/hjalti.jpg þegar hún er til;
// þar til þá birtast upphafsstafir. Athugað við bygginguna (síðan er kyrrstæð).
const HAS_FOUNDER_PHOTO = fs.existsSync(path.join(process.cwd(), "public", "rondva", "hjalti.jpg"));

const steps = [
  {
    n: "01",
    Icon: IconProperty,
    title: "Set up the property",
    body: "Address, building, and the rooms you’ll walk. Reusable between jobs of the same type.",
  },
  {
    n: "02",
    Icon: IconCamera,
    title: "Walk and record",
    body: "Photos, thermal images, and a note per observation. You pick the severity — always.",
  },
  {
    n: "03",
    Icon: IconDraft,
    title: "Rondva drafts",
    body: "It turns your notes into readable report text and an overall summary, in your structure.",
  },
  {
    n: "04",
    Icon: IconReview,
    title: "Review, adjust, export",
    body: "Read it. Change anything. Export the PDF.",
  },
];

// Stuttar spurningar neðst á forsíðunni (sömu svör og á landasíðunum þar sem þau eiga við).
const FAQ = [
  {
    q: "Which report formats can Rondva write?",
    a: "NZS 4306 reports for New Zealand. For Australia, the UK and Ireland, Rondva writes its general English report; each country page shows what that looks like.",
  },
  { q: "Does it work with no signal?", a: OFFLINE_ANSWER },
  { q: "Who is responsible for the report?", a: RESPONSIBLE_ANSWER },
  {
    q: "Do I need an iPhone?",
    a: "Yes. You record inspections in the iPhone app. You can set up your company account and review reports on the web too.",
  },
] as const;

// hreflang aðeins á forsíðu og landasíðum (ekki /support, /privacy …); canonical er áfram forsíðan.
export const metadata: Metadata = {
  alternates: { canonical: BRANDS.rondva.marketingUrl, languages: rondvaLanguages() },
};

export default function RondvaLandingPage() {
  return (
    <>
      <JsonLd nodes={[organizationLd(), softwareApplicationLd(), faqPageLd(FAQ)]} />
      <RondvaHeader />
      <main id="content" className="flex-1">
        {/* 1. Hetjuhlutinn — dökkt teikniblað: fyrirsögn, lína og hnappar fyrst, kynningarmyndin
            VIÐ HLIÐINA á breiðum skjá (16:9) og UNDIR textanum á síma (4:5, spilar þegar skrunað
            er að henni). Aldrei texti yfir myndinni og aldrei inni í snúnum ramma (merkið má
            ekki hallast). */}
        <section aria-labelledby="hero-title" className="rv-hero rv-blueprint rv-grain relative overflow-hidden px-6 text-paper">
          <div className="relative mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-12 pb-16 pt-12 sm:pt-16 md:pb-24 md:pt-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:pb-24 lg:pt-20 xl:grid-cols-[1fr_1fr] xl:pb-28 xl:pt-24">
            <div className="relative z-20">
              <p className="rv-eyebrow rv-eyebrow-inverse rv-balance">
                Inspection app for iPhone · On the App Store
              </p>
              <h1
                id="hero-title"
                className="rv-display rv-balance mt-6 text-[44px] sm:text-[60px] md:text-[68px] lg:text-[52px] xl:text-[60px]"
              >
                Walk the property.
                <br />
                <em>Rondva drafts the report.</em>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-on-inverse-muted md:text-xl">
                Rondva is a field app for independent property inspectors. You record the rooms,
                the photos, the thermal images and the severity. Rondva drafts the wording and the
                summary — you stay the author of every judgement in it.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-4">
                <AppStoreBadge />
                {HAS_SAMPLE ? (
                  <a href={SAMPLE_REPORT_URL} className={rvBtn("inverse", "md")}>
                    See a sample NZS 4306 report
                  </a>
                ) : (
                  <a href="#how" className={rvBtn("inverse", "md")}>
                    See how it works
                  </a>
                )}
              </div>
              <p className="mt-6 text-base font-medium text-paper">{RONDVA_OFFER_LINE}</p>
              <AppStoreQr className="mt-8" />
              <p className="mt-5 text-sm text-on-inverse-muted">
                In New Zealand?{" "}
                <Link href="/nz" className="inline-flex min-h-11 items-center font-semibold text-paper underline underline-offset-4">
                  See the NZS 4306 page →
                </Link>
              </p>
            </div>

            {/* Kynningarmyndin. Báðar útgáfur eru í DOM; CSS (.rv-film-wide/.rv-film-mobile) og
                matchMedia í HeroFilm sjá til þess að aðeins sú sem passar birtist og sækir gögn. */}
            <div className="relative z-10 w-full">
              <HeroFilm variant="wide" />
              <HeroFilm variant="mobile" />
            </div>
          </div>
        </section>

        {/* 2. Frá glósu til skýrslu — raunveruleg athugasemd úr sýnisskýrslunni, svo kemur
            „Where the AI stops“ strax á eftir (kjarnaloforðið, sameiginlegt með /nz). */}
        <NoteToReport />
        <WhereAiStops />

        {/* 3. How it works — fjögur skref á teikniblaði með síma */}
        <section id="how" className="rv-blueprint-light px-6 py-20 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <SectionHeading eyebrow="How it works">Four steps. The fourth one is the short one.</SectionHeading>
            <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_auto] lg:gap-16">
              <ol className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
                {steps.map((s, i) => (
                  <li key={s.n} className="rv-reveal" style={{ "--i": i } as React.CSSProperties}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink">
                        <s.Icon className="h-6 w-6" />
                      </span>
                      <span className="rv-tnum text-xs font-semibold tracking-[0.14em] text-blue">{s.n}</span>
                    </div>
                    <h3 className="mt-4 font-serif text-[22px] font-semibold tracking-tight text-ink">{s.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
                  </li>
                ))}
              </ol>
              {HAS_SCREENS ? (
                <figure className="rv-reveal relative mx-auto lg:mx-0" style={{ "--i": 2 } as React.CSSProperties}>
                  <div className="flex items-end justify-center gap-6">
                    <PhoneFrame src={SCREENS[0].src} alt={SCREENS[0].alt} className={SCREENS[0].aspect} />
                    <PhoneFrame
                      src={SCREENS[1].src}
                      alt={SCREENS[1].alt}
                      className={`${SCREENS[1].aspect} mb-16 hidden !w-[220px] md:block`}
                    />
                  </div>
                  <figcaption className="mt-5 max-w-[34rem] text-center text-sm leading-relaxed text-muted lg:text-left">
                    Captures with no signal: under the house, in the roof space.
                  </figcaption>
                </figure>
              ) : null}
            </div>
          </div>
        </section>

        {/* 6a. Who builds Rondva — andlit, heimilisfang og tryggingar fyrir ofan verð. Tölurnar eru
            með leyfi viðskiptavinar (9.10.2026, nafnlaust). Ekkert svarloforð: Hjalti ákveður það. */}
        <section id="who" aria-labelledby="who-title" className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <SectionHeading id="who-title" eyebrow="Who builds Rondva">
              A person you can write to.
            </SectionHeading>
            <div className="mt-12 grid gap-10 md:grid-cols-[auto_1fr] md:gap-14">
              <div className="rv-reveal flex flex-wrap items-center gap-5 md:flex-col md:items-start" style={{ "--i": 0 } as React.CSSProperties}>
                {HAS_FOUNDER_PHOTO ? (
                  <Image
                    src="/rondva/hjalti.jpg"
                    alt="Hjalti Sigmundsson"
                    width={112}
                    height={112}
                    className="h-28 w-28 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-ink font-serif text-[34px] font-semibold tracking-tight text-paper"
                  >
                    HS
                  </span>
                )}
                <div>
                  <p className="font-serif text-[22px] font-semibold tracking-tight text-ink">Hjalti Sigmundsson</p>
                  <a
                    href="mailto:hjalti@rondva.com"
                    className="mt-1 inline-block text-[15px] text-muted underline underline-offset-4 hover:text-blue"
                  >
                    hjalti@rondva.com
                  </a>
                </div>
              </div>
              <div className="rv-reveal" style={{ "--i": 1 } as React.CSSProperties}>
                <p className="max-w-2xl text-lg leading-relaxed text-muted">
                  Built in Reykjavík with a pre-purchase inspection firm that writes every one of its reports in
                  Rondva. Writing up a typical report there went from about 3 hours 40 minutes to about 30 minutes.
                </p>
                <p className="mt-5 text-sm text-muted">
                  {BRANDS.rondva.company} · reg. no. {BRANDS.rondva.companyId} · {BRANDS.rondva.companyAddress}
                </p>
                <ul className="mt-8 grid gap-4 sm:grid-cols-3">
                  {[
                    <>
                      <Link href="/privacy" className="underline underline-offset-4 hover:text-blue">
                        Your data is stored in the EU (Ireland)
                      </Link>
                    </>,
                    <>Every report says which text was drafted with AI assistance; you review it and issue it under your name.</>,
                    <>
                      Billed by Apple in your currency. Cancel any time in Settings, no contract.{" "}
                      <Link href="/terms#availability" className="underline underline-offset-4 hover:text-blue">
                        60 days&apos; notice and a full export if we ever shut down
                      </Link>
                    </>,
                  ].map((line, i) => (
                    <li key={i} className="flex gap-3 rounded-card border border-line bg-surface p-5 text-[15px] leading-snug text-ink">
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
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Verð — Solo / Pro / Report pack + stofnmannatilboð (tölur í src/lib/rondva-pricing.ts).
            Ekkert er til sölu á vefnum: kaup eru í iPhone-appinu í gegnum App Store.
            Tilboðið nefnir ekki Ísland (íslensk fyrirtæki: eftir boði). */}
        <section id="pricing" aria-labelledby="pricing-title" className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <SectionHeading id="pricing-title" eyebrow="Pricing">
              Simple plans. Edits and re-exports never count.
            </SectionHeading>
            <p className="rv-reveal mt-6 max-w-2xl text-lg leading-relaxed text-muted" style={{ "--i": 1 } as React.CSSProperties}>
              Start with a free month. After that, a plan or a report pack, bought in the iPhone app.
            </p>

            {/* Fyrsti mánuður frír (prufutími) — í gildi núna */}
            <div
              className="rv-reveal rv-blueprint-light mt-12 rounded-card border border-line p-7 sm:p-10"
              style={{ "--i": 1 } as React.CSSProperties}
            >
              <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-14">
                <div>
                  <p className="rv-eyebrow">First month free</p>
                  <h3 className="rv-display rv-balance mt-5 text-[30px] text-ink sm:text-[40px]">
                    {RONDVA_TRIAL.freeReports} free <span className="whitespace-nowrap">AI-drafted</span> reports <em>in your first month.</em>
                  </h3>
                  <ul className="mt-5 grid max-w-xl gap-2 text-base leading-relaxed text-muted">
                    <li>The {RONDVA_TRIAL.days} days start with your first AI draft, not when you sign up.</li>
                    <li>They end after {RONDVA_TRIAL.days} days or {RONDVA_TRIAL.freeReports} reports, whichever comes first.</li>
                    <li>No card. Nothing renews on its own.</li>
                  </ul>
                </div>
                <div>
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                    <AppStoreBadge />
                    <a href={BRANDS.rondva.appUrl} className={rvBtn("secondary", "md", "whitespace-normal text-center")}>
                      Create your company account
                      <span aria-hidden="true">→</span>
                    </a>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted">
                    Get the iPhone app on the App Store. You can also set up your company account on the
                    web, and sign in with the same Apple or Google account in the app.
                  </p>
                </div>
              </div>
            </div>

            {/* Þrjú spjöld: Solo, Pro (mælt með) og Report pack */}
            <ul className="mt-5 grid gap-5 lg:grid-cols-3">
              {RONDVA_PLANS.map((plan, i) => {
                const dark = plan.recommended;
                return (
                  <li
                    key={plan.id}
                    className={`rv-reveal relative flex flex-col rounded-card border p-6 sm:p-8 ${
                      dark ? "border-ink bg-ink text-paper shadow-raised" : "border-line bg-surface shadow-sm"
                    }`}
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-serif text-[26px] font-semibold tracking-tight">{plan.name}</h3>
                      {dark ? (
                        <span className="rounded-full bg-blue px-3 py-1 text-xs font-semibold text-paper">
                          Recommended
                        </span>
                      ) : null}
                    </div>
                    <p className={`mt-1 min-h-10 text-sm ${dark ? "text-on-inverse-muted" : "text-muted"}`}>{plan.blurb}</p>
                    <p className="rv-tnum mt-5 font-serif text-[40px] font-semibold leading-none tracking-tight sm:mt-7 sm:text-[52px]">
                      {usd(plan.price)}{" "}
                      <span className={`whitespace-nowrap font-sans text-base font-medium tracking-normal ${dark ? "text-on-inverse-muted" : "text-muted"}`}>
                        / month
                      </span>
                    </p>
                    <div className={`mt-5 border-t pt-5 sm:mt-7 sm:pt-6 ${dark ? "border-paper/15" : "border-line"}`}>
                      <p className="flex items-baseline gap-3">
                        <span className="rv-tnum font-serif text-[36px] font-semibold leading-none">{plan.reports}</span>
                        <span className="text-[15px] leading-snug">AI-drafted reports per month</span>
                      </p>
                      <p className={`rv-tnum mt-3 text-[15px] ${dark ? "text-on-inverse-muted" : "text-muted"}`}>
                        {usd(perReport(plan.price, plan.reports))} per report
                      </p>
                    </div>
                  </li>
                );
              })}
              <li
                className="rv-reveal relative flex flex-col rounded-card border border-line bg-surface p-6 shadow-sm sm:p-8"
                style={{ "--i": RONDVA_PLANS.length } as React.CSSProperties}
              >
                <h3 className="font-serif text-[26px] font-semibold tracking-tight">{RONDVA_PACK.name}</h3>
                <p className="mt-1 min-h-10 text-sm text-muted">{RONDVA_PACK.blurb}</p>
                <p className="rv-tnum mt-5 font-serif text-[40px] font-semibold leading-none tracking-tight sm:mt-7 sm:text-[52px]">
                  {usd(RONDVA_PACK.price)}{" "}
                  <span className="whitespace-nowrap font-sans text-base font-medium tracking-normal text-muted">one-time</span>
                </p>
                <div className="mt-5 border-t border-line pt-5 sm:mt-7 sm:pt-6">
                  <p className="flex items-baseline gap-3">
                    <span className="rv-tnum font-serif text-[36px] font-semibold leading-none">{RONDVA_PACK.reports}</span>
                    <span className="text-[15px] leading-snug">extra AI-drafted reports</span>
                  </p>
                  <p className="rv-tnum mt-3 text-[15px] text-muted">
                    {usd(perReport(RONDVA_PACK.price, RONDVA_PACK.reports))} per report. They never expire.
                  </p>
                </div>
              </li>
            </ul>

            {/* Innifalið í öllum áætlunum */}
            <div
              className="rv-reveal mt-5 rounded-card border border-line bg-paper-alt/60 p-6 sm:p-7"
              style={{ "--i": 1 } as React.CSSProperties}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Included in every plan</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-3 sm:gap-6">
                {RONDVA_INCLUDED.map((line) => (
                  <li key={line} className="flex gap-3 text-[15px] leading-snug text-ink">
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
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <p className="rv-reveal mt-6 max-w-3xl text-sm leading-relaxed text-muted" style={{ "--i": 1 } as React.CSSProperties}>
              {RONDVA_PRICE_NOTE} Nothing can be bought on this page.
            </p>
          </div>
        </section>

        {/* 7. Stuttar spurningar */}
        <section aria-labelledby="faq-title" className="px-6 pb-16 md:pb-24">
          <div className="mx-auto max-w-[1180px] border-t border-line pt-16 md:pt-24">
            <SectionHeading id="faq-title" eyebrow="Questions">
              Short answers.
            </SectionHeading>
            <div className="mt-10 grid gap-x-14 border-b border-line md:grid-cols-2 md:border-b-0">
              {FAQ.map((f, i) => (
                <details key={f.q} className="rv-reveal group border-t border-line" style={{ "--i": i % 2 } as React.CSSProperties}>
                  <summary className="flex min-h-11 list-none items-center justify-between gap-4 py-5 font-serif text-xl font-semibold tracking-tight text-ink hover:text-blue [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-blue transition-transform duration-200 group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M10 4v12M4 10h12" />
                    </svg>
                  </summary>
                  <p className="-mt-1 pb-6 leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
            <p className="rv-reveal mt-10 max-w-3xl text-base leading-relaxed text-muted">
              Rondva is built around the inspector on site. Two or three of you? We&apos;ll link your colleagues to
              one company account. More answers on the{" "}
              <Link href="/support" className="underline underline-offset-4 hover:text-blue">support page</Link>.
            </p>
          </div>
        </section>

        {/* 8. Lokahvatning — eitt skref: sækja appið. Fyrir þá sem eru ekki á iPhone: netfang. */}
        <section aria-labelledby="cta-title" className="rv-blueprint-light px-6 py-20 md:py-24">
          <div className="mx-auto flex max-w-[1180px] flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="rv-reveal max-w-2xl">
              <h2 id="cta-title" className="rv-display rv-balance text-4xl text-ink sm:text-5xl">
                Try it on <em>your next inspection.</em>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted">{RONDVA_OFFER_LINE}</p>
            </div>
            <div className="rv-reveal flex flex-col items-start gap-5" style={{ "--i": 1 } as React.CSSProperties}>
              <div className="flex items-center gap-6">
                <AppStoreBadge />
                <AppStoreQr tone="light" />
              </div>
              <p className="text-sm text-muted">
                Not on iPhone? Email{" "}
                <a href={`mailto:${BRANDS.rondva.contactEmail}`} className="font-semibold text-ink underline underline-offset-4 hover:text-blue">
                  {BRANDS.rondva.contactEmail}
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <RondvaFooter />
      <RevealObserver />
    </>
  );
}
