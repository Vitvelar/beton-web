import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { BRANDS } from "@/lib/brand";
import { HAS_SAMPLE, SAMPLE_REPORT_URL } from "@/lib/rondva-links";
import {
  RONDVA_INCLUDED,
  RONDVA_OFFER,
  RONDVA_OFFER_LINE,
  RONDVA_PACK,
  RONDVA_PLANS,
  RONDVA_PRICE_NOTE,
  usd,
} from "@/lib/rondva-pricing";
import { organizationLd, softwareApplicationLd } from "@/lib/rondva-seo";
import { RondvaHeader } from "@/components/rondva/RondvaHeader";
import { RondvaFooter } from "@/components/rondva/RondvaFooter";
import { AppStoreBadge, AppStoreQr } from "@/components/rondva/AppStoreBadge";
import { JsonLd } from "@/components/rondva/JsonLd";
import { SectionHeading } from "@/components/rondva/SectionHeading";
import { WhereAiStops } from "@/components/rondva/WhereAiStops";
import { HeroFilm } from "@/components/rondva/HeroFilm";
import { PhoneFrame } from "@/components/rondva/PhoneFrame";
import { RevealObserver } from "@/components/rondva/Reveal";
import {
  IconProperty,
  IconCamera,
  IconDraft,
  IconReview,
  IconExport,
  IconLogo,
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

const whatYouGet = [
  {
    Icon: IconDraft,
    title: "A PDF your client can actually read",
    body: "Photos, thermal images and observations laid out per room.",
  },
  {
    Icon: IconReview,
    title: "Your wording, not a template’s",
    body: "The draft follows your notes and your severity ratings.",
  },
  {
    Icon: IconExport,
    title: "Edits stay free",
    body: "Rewrite any text by hand and re-export as often as you want. No charge, no quota.",
  },
  {
    Icon: IconLogo,
    title: "Your logo on every report",
    body: "Your company name and mark on the cover and every page. It’s your report, not ours.",
  },
  {
    Icon: IconCamera,
    title: "Everything on the phone you already carry.",
    body: "",
  },
];

export default function RondvaLandingPage() {
  return (
    <>
      {/* Án JavaScript: allt efni sést strax (rv-reveal bíður annars eftir RevealObserver). */}
      <noscript>
        <style>{`.rv-reveal{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <JsonLd nodes={[organizationLd(), softwareApplicationLd()]} />
      <RondvaHeader />
      <main className="flex-1">
        {/* 1. Hetjuhlutinn — dökkt teikniblað: fyrirsögn, lína og hnappar fyrst, kynningarmyndin
            VIÐ HLIÐINA á breiðum skjá (16:9) og UNDIR textanum á síma (4:5, spilar þegar skrunað
            er að henni). Aldrei texti yfir myndinni og aldrei inni í snúnum ramma (merkið má
            ekki hallast). */}
        <section aria-labelledby="hero-title" className="rv-hero rv-blueprint rv-grain relative overflow-hidden text-paper">
          <div className="pointer-events-none absolute -right-64 -top-72 h-[560px] w-[560px] rounded-full bg-blue/25 blur-[140px]" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-12 px-6 pb-16 pt-12 sm:pt-16 md:pb-24 md:pt-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:pb-24 lg:pt-20 xl:grid-cols-[0.85fr_1.15fr] xl:pb-28 xl:pt-24">
            <div className="relative z-20">
              <p className="rv-reveal rv-eyebrow !text-paper/60" style={{ "--i": 0 } as React.CSSProperties}>
                Inspection app for iPhone · On the App Store
              </p>
              <h1
                id="hero-title"
                className="rv-reveal rv-display rv-balance mt-6 text-[44px] sm:text-[60px] md:text-[68px] lg:text-[52px] xl:text-[60px] 2xl:text-[68px]"
                style={{ "--i": 1 } as React.CSSProperties}
              >
                Walk the property.
                <br />
                <em>Rondva drafts the report.</em>
              </h1>
              <p
                className="rv-reveal mt-7 max-w-xl text-lg leading-relaxed text-paper/75 md:text-xl"
                style={{ "--i": 2 } as React.CSSProperties}
              >
                Rondva is a field app for independent property inspectors. You record the rooms,
                the photos, the thermal images and the severity. Rondva drafts the wording and the
                summary — you stay the author of every judgement in it.
              </p>
              <div
                className="rv-reveal mt-9 flex flex-wrap items-center gap-x-5 gap-y-4"
                style={{ "--i": 3 } as React.CSSProperties}
              >
                <AppStoreBadge />
                {HAS_SAMPLE ? (
                  <a
                    href={SAMPLE_REPORT_URL}
                    className="inline-flex items-center rounded-full border border-paper/25 px-6 py-3.5 text-sm font-semibold text-paper/90 transition-colors hover:border-paper/60"
                  >
                    See a sample report
                  </a>
                ) : null}
                <a
                  href="#how"
                  className="inline-flex items-center rounded-full border border-paper/25 px-6 py-3.5 text-sm font-semibold text-paper/90 transition-colors hover:border-paper/60"
                >
                  See how it works
                </a>
              </div>
              <AppStoreQr className="rv-reveal mt-8" />
              <p
                className="rv-reveal mt-6 text-sm text-paper/55"
                style={{ "--i": 4 } as React.CSSProperties}
              >
                {RONDVA_OFFER_LINE}
              </p>
              <p
                className="rv-reveal mt-2 text-sm text-paper/55"
                style={{ "--i": 4 } as React.CSSProperties}
              >
                In New Zealand?{" "}
                <Link href="/nz" className="font-semibold text-paper/85 underline underline-offset-4 hover:text-paper">
                  See the NZS 4306 page →
                </Link>
              </p>
            </div>

            {/* Kynningarmyndin. Báðar útgáfur eru í DOM; CSS (.rv-film-wide/.rv-film-mobile) og
                matchMedia í HeroFilm sjá til þess að aðeins sú sem passar birtist og sækir gögn. */}
            <div className="rv-reveal relative z-10 w-full" style={{ "--i": 2 } as React.CSSProperties}>
              <HeroFilm variant="wide" />
              <HeroFilm variant="mobile" />
            </div>
          </div>
        </section>

        {/* 2. Who it's for — kvöldið eftir skoðun */}
        <section className="px-6 py-20 md:py-28">
          <div className="mx-auto grid max-w-[1180px] gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
            <SectionHeading eyebrow="Who it’s for">Built for the one-person operation, not the enterprise.</SectionHeading>
            <div className="rv-reveal space-y-5 text-lg leading-relaxed text-muted md:pt-14" style={{ "--i": 1 } as React.CSSProperties}>
              <p>
                Rondva is built for{" "}
                <strong className="font-semibold text-ink">independent inspectors and small inspection firms</strong>{" "}
                — built around the inspector on site. Two or three of you? We&apos;ll link your colleagues to one
                company account.
              </p>
              <p className="rv-display text-[26px] text-ink sm:text-[30px]">
                If you spend the evening after an inspection retyping notes into a document,{" "}
                <em>that evening is the problem we&apos;re working on.</em>
              </p>
            </div>
          </div>
        </section>

        {/* 3. How it works — fjögur skref á teikniblaði með síma */}
        <section id="how" className="rv-blueprint-light px-6 py-20 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <SectionHeading eyebrow="How it works">Four steps. The fourth one is the short one.</SectionHeading>
            <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_auto] lg:gap-16">
              <ol className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
                {steps.map((s, i) => (
                  <li key={s.n} className="rv-reveal" style={{ "--i": i } as React.CSSProperties}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-paper text-ink">
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

        {/* 4. What you get */}
        <section className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <SectionHeading eyebrow="What you get">A report that reads like you wrote it. Because you did.</SectionHeading>
            <ul className="mt-14 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {whatYouGet.map((item, i) => (
                <li
                  key={item.title}
                  className={`rv-reveal bg-paper p-7 ${i === whatYouGet.length - 1 ? "sm:col-span-2" : ""}`}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <item.Icon className="h-7 w-7 text-blue" />
                  <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-ink">{item.title}</h3>
                  {item.body ? <p className="mt-2 leading-relaxed text-muted">{item.body}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. Where the AI stops — þyngsti kaflinn (sameiginlegur með /nz). */}
        <WhereAiStops />

        {/* 6a. Who builds Rondva — andlit, heimilisfang og tryggingar fyrir ofan verð. Tölurnar eru
            með leyfi viðskiptavinar (9.10.2026, nafnlaust). Ekkert svarloforð: Hjalti ákveður það. */}
        <section id="who" aria-labelledby="who-title" className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <SectionHeading id="who-title" eyebrow="Who builds Rondva">
              A person you can write to.
            </SectionHeading>
            <div className="mt-12 grid gap-10 md:grid-cols-[auto_1fr] md:gap-14">
              <div className="rv-reveal flex items-center gap-5 md:flex-col md:items-start" style={{ "--i": 0 } as React.CSSProperties}>
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
                    <>Every report says it was AI-drafted and reviewed by you.</>,
                    <>
                      Billed by Apple in your currency. Cancel any time in Settings, no contract.{" "}
                      <Link href="/terms#availability" className="underline underline-offset-4 hover:text-blue">
                        60 days&apos; notice and a full export if we ever shut down
                      </Link>
                    </>,
                  ].map((line, i) => (
                    <li key={i} className="flex gap-3 rounded-card border border-line bg-paper p-5 text-[15px] leading-snug text-ink">
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
              Manual text edits and re-exporting a PDF never use up your reports and never cost
              extra. Plans and report packs are bought in the iPhone app, through the App Store.
            </p>

            {/* Stofnmannatilboðið — í gildi núna */}
            <div
              className="rv-reveal rv-blueprint-light mt-12 rounded-card border border-line-strong p-7 sm:p-10"
              style={{ "--i": 1 } as React.CSSProperties}
            >
              <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-14">
                <div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue px-3 py-1 text-xs font-semibold text-paper">
                      <span className="h-1.5 w-1.5 rounded-full bg-paper" aria-hidden="true" />
                      Live now
                    </span>
                    <p className="rv-eyebrow">Founding offer</p>
                  </div>
                  <h3 className="rv-display rv-balance mt-5 text-[30px] text-ink sm:text-[40px]">
                    {RONDVA_OFFER.freeReportsPerMonth} free <span className="whitespace-nowrap">AI-drafted</span> reports <em>every month.</em>
                  </h3>
                  <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
                    Until {RONDVA_OFFER.endsOn}. No card needed. Manual edits and re-exports stay
                    free, as always.
                  </p>
                </div>
                <div>
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                    <AppStoreBadge />
                    <a
                      href={BRANDS.rondva.appUrl}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-line-strong bg-paper px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
                    >
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
                    className={`rv-reveal relative flex flex-col rounded-card border p-7 sm:p-8 ${
                      dark
                        ? "border-ink bg-ink text-paper shadow-[0_30px_70px_-30px_rgba(16,20,24,0.55)]"
                        : "border-line bg-paper shadow-[0_24px_60px_-34px_rgba(16,20,24,0.22)]"
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
                    <p className={`mt-1 text-sm ${dark ? "text-paper/70" : "text-muted"}`}>{plan.blurb}</p>
                    <p className="rv-tnum mt-7 font-serif text-[46px] font-semibold leading-none tracking-tight sm:text-[52px]">
                      {usd(plan.price)}{" "}
                      <span className={`whitespace-nowrap font-sans text-base font-medium tracking-normal ${dark ? "text-paper/70" : "text-muted"}`}>
                        / month
                      </span>
                    </p>
                    <div className={`mt-7 border-t pt-6 ${dark ? "border-paper/15" : "border-line"}`}>
                      <p className="flex items-baseline gap-3">
                        <span className="rv-tnum font-serif text-[36px] font-semibold leading-none">{plan.reports}</span>
                        <span className="text-[15px] leading-snug">AI-drafted reports per month</span>
                      </p>
                    </div>
                  </li>
                );
              })}
              <li
                className="rv-reveal relative flex flex-col rounded-card border border-line bg-paper p-7 shadow-[0_24px_60px_-34px_rgba(16,20,24,0.22)] sm:p-8"
                style={{ "--i": RONDVA_PLANS.length } as React.CSSProperties}
              >
                <h3 className="font-serif text-[26px] font-semibold tracking-tight">{RONDVA_PACK.name}</h3>
                <p className="mt-1 text-sm text-muted">{RONDVA_PACK.blurb}</p>
                <p className="rv-tnum mt-7 font-serif text-[46px] font-semibold leading-none tracking-tight sm:text-[52px]">
                  {usd(RONDVA_PACK.price)}{" "}
                  <span className="whitespace-nowrap font-sans text-base font-medium tracking-normal text-muted">one-time</span>
                </p>
                <div className="mt-7 border-t border-line pt-6">
                  <p className="flex items-baseline gap-3">
                    <span className="rv-tnum font-serif text-[36px] font-semibold leading-none">{RONDVA_PACK.reports}</span>
                    <span className="text-[15px] leading-snug">extra AI-drafted reports</span>
                  </p>
                  <p className="mt-3 text-[15px] text-muted">They never expire.</p>
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
              {RONDVA_PRICE_NOTE}{" "}
              Plans and report packs are bought in the iPhone app, through the App Store. Nothing can
              be bought on this page.
            </p>
          </div>
        </section>

        {/* 7. Fyrir þá sem eru ekki á iPhone (kom í stað biðlistans). */}
        <section className="rv-blueprint-light px-6 py-14 md:py-16">
          <p className="rv-reveal mx-auto max-w-2xl text-center text-lg leading-relaxed text-ink">
            Not on iPhone? Email{" "}
            <a href={`mailto:${BRANDS.rondva.contactEmail}`} className="font-semibold underline underline-offset-4 hover:text-blue">
              {BRANDS.rondva.contactEmail}
            </a>
            .
          </p>
          <p className="rv-reveal mx-auto mt-3 max-w-2xl text-center text-sm text-muted" style={{ "--i": 1 } as React.CSSProperties}>
            Questions first?{" "}
            <Link href="/privacy" className="underline underline-offset-4">How we handle your data</Link>
          </p>
        </section>
      </main>
      <RondvaFooter />
      <RevealObserver />
    </>
  );
}
