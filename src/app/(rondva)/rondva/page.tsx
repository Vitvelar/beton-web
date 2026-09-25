import Link from "next/link";
import { RondvaHeader } from "@/components/rondva/RondvaHeader";
import { RondvaFooter } from "@/components/rondva/RondvaFooter";
import { WaitlistForm } from "@/components/rondva/WaitlistForm";
import { HeroFilm } from "@/components/rondva/HeroFilm";
import { PhoneFrame } from "@/components/rondva/PhoneFrame";
import { RevealObserver } from "@/components/rondva/Reveal";
import {
  IconProperty,
  IconCamera,
  IconDraft,
  IconReview,
  IconThermal,
  IconExport,
  IconLogo,
  IconShield,
} from "@/components/rondva/RondvaIcons";

// Skjámyndir úr ensku útgáfunni fara í public/rondva/screens/. Þar til þær
// eru til birtist ramminn tómur — aldrei íslensk skjámynd (birtingarregla 4).
const SCREENS: { src?: string; alt: string }[] = [
  { src: "/rondva/screens/overview.webp", alt: "Rondva — inspection overview with property details and severity counts" },
  { src: "/rondva/screens/room.webp", alt: "Rondva — room screen with ratings and observations" },
];
const HAS_SCREENS = SCREENS.every((s) => !!s.src);

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
    body: "Read it. Change anything. Export the PDF with the cost estimate.",
  },
];

const whatYouGet = [
  {
    Icon: IconDraft,
    title: "A PDF your client can actually read",
    body: "Photos, thermal images and observations laid out per room.",
  },
  {
    Icon: IconThermal,
    title: "A cost estimate",
    body: "Built from the findings you recorded.",
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

const whereAiStops = [
  {
    title: "Rondva never changes your assessment.",
    body: "Severity is yours. The AI writes around it, never over it.",
  },
  {
    title: "A Rondva report is not a certified engineering conclusion",
    body: "and doesn’t present itself as one. It’s your professional inspection, written up.",
  },
  {
    title: "Nothing is claimed to be complete.",
    body: "No app can guarantee every defect in a building is found — Rondva documents what you observed and recorded.",
  },
  {
    title: "You review before anything leaves the app.",
    body: "Nothing is sent to a client automatically.",
  },
];

function SectionHeading({
  eyebrow,
  children,
  light,
}: {
  eyebrow: string;
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <div className="rv-reveal max-w-2xl">
      <p className={light ? "rv-eyebrow !text-paper/60" : "rv-eyebrow"}>{eyebrow}</p>
      <h2 className={`rv-display rv-balance mt-4 text-[34px] sm:text-[44px] md:text-[52px] ${light ? "text-paper" : "text-ink"}`}>
        {children}
      </h2>
    </div>
  );
}

export default function RondvaLandingPage() {
  return (
    <>
      <RondvaHeader />
      <main className="flex-1">
        {/* 1. Hero — dökkt teikniblað, serif-fyrirsögn, kynningarmynd */}
        <section className="rv-blueprint rv-grain relative overflow-hidden text-paper">
          <div className="pointer-events-none absolute -right-64 -top-72 h-[560px] w-[560px] rounded-full bg-blue/25 blur-[140px]" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-12 px-6 pb-24 pt-20 md:pb-32 md:pt-28 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <div className="relative z-20">
              <p className="rv-rise rv-eyebrow !text-paper/60" style={{ "--i": 0 } as React.CSSProperties}>
                Field app for property inspectors · In development
              </p>
              <h1
                className="rv-rise rv-display mt-6 text-[44px] sm:text-[60px] md:text-[68px] lg:text-[76px]"
                style={{ "--i": 1 } as React.CSSProperties}
              >
                Walk the property.
                <br />
                <em>Rondva drafts the report.</em>
              </h1>
              <p
                className="rv-rise mt-7 max-w-xl text-lg leading-relaxed text-paper/75 md:text-xl"
                style={{ "--i": 2 } as React.CSSProperties}
              >
                Rondva is a field app for independent property inspectors. You record the rooms,
                the photos, the thermal images and the severity. Rondva drafts the wording and the
                summary — you stay the author of every judgement in it.
              </p>
              <div
                className="rv-rise mt-9 flex flex-wrap items-center gap-4"
                style={{ "--i": 3 } as React.CSSProperties}
              >
                <a
                  href="#waitlist"
                  className="inline-flex items-center gap-2 rounded-full bg-blue px-7 py-3.5 text-sm font-semibold text-paper transition-colors hover:bg-[#2c62ec]"
                >
                  Join the waitlist
                  <span aria-hidden="true">→</span>
                </a>
                <a
                  href="#how"
                  className="inline-flex items-center rounded-full border border-paper/25 px-6 py-3.5 text-sm font-semibold text-paper/90 transition-colors hover:border-paper/60"
                >
                  See how it works
                </a>
              </div>
              <p
                className="rv-rise mt-6 text-sm text-paper/55"
                style={{ "--i": 4 } as React.CSSProperties}
              >
                In development. We&apos;re building with working inspectors before we open sales.
              </p>
            </div>

            {/* Kynningarmyndin: aldrei inni í snúnum ramma (merkið má ekki hallast). */}
            <div className="rv-rise relative z-10 w-full" style={{ "--i": 3 } as React.CSSProperties}>
              <HeroFilm className="w-full" />
            </div>
          </div>
        </section>

        {/* 2. Who it's for — kvöldið eftir skoðun */}
        <section className="px-6 py-20 md:py-28">
          <div className="mx-auto grid max-w-[1180px] gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
            <SectionHeading eyebrow="Who it’s for">Built for the one-person operation, not the enterprise.</SectionHeading>
            <div className="rv-reveal space-y-5 text-lg leading-relaxed text-muted md:pt-14" style={{ "--i": 1 } as React.CSSProperties}>
              <p>
                Rondva is being built for{" "}
                <strong className="font-semibold text-ink">independent inspectors and small inspection firms</strong>{" "}
                — the one-person operation and the three-person team, not the enterprise.
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
                <div className="rv-reveal relative hidden md:block" style={{ "--i": 2 } as React.CSSProperties}>
                  <div className="flex items-end gap-6">
                    <PhoneFrame src={SCREENS[0].src} alt={SCREENS[0].alt} />
                    <PhoneFrame src={SCREENS[1].src} alt={SCREENS[1].alt} className="mb-16 !w-[220px]" />
                  </div>
                </div>
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
                <li key={item.title} className="rv-reveal bg-paper p-7" style={{ "--i": i } as React.CSSProperties}>
                  <item.Icon className="h-7 w-7 text-blue" />
                  <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-ink">{item.title}</h3>
                  {item.body ? <p className="mt-2 leading-relaxed text-muted">{item.body}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. Where the AI stops — þyngsti kaflinn */}
        <section className="rv-blueprint rv-grain relative px-6 py-24 text-paper md:py-32">
          <div className="relative mx-auto max-w-[1180px]">
            <div className="flex items-start gap-5">
              <IconShield className="mt-1 hidden h-9 w-9 shrink-0 text-blue sm:block" />
              <SectionHeading eyebrow="Where the AI stops" light>
                This matters more than any feature, <em className="text-paper/70">so we&apos;ll be direct about it.</em>
              </SectionHeading>
            </div>
            <ol className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
              {whereAiStops.map((item, i) => (
                <li key={item.title} className="rv-reveal border-t border-paper/15 pt-6" style={{ "--i": i } as React.CSSProperties}>
                  <span className="rv-tnum text-xs font-semibold tracking-[0.14em] text-blue">0{i + 1}</span>
                  <p className="mt-3 font-serif text-[24px] font-semibold leading-snug tracking-tight">{item.title}</p>
                  <p className="mt-2 text-lg leading-relaxed text-paper/70">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 6. Planned pricing */}
        <section className="px-6 py-20 md:py-28">
          <div className="mx-auto grid max-w-[1180px] gap-12 md:grid-cols-[1fr_1fr] md:gap-20">
            <div>
              <SectionHeading eyebrow="Planned pricing">One price. Edits and re-exports never count.</SectionHeading>
              <p className="rv-reveal mt-6 max-w-lg leading-relaxed text-muted" style={{ "--i": 1 } as React.CSSProperties}>
                Manual text edits and re-exporting a PDF never count against your quota and never
                cost extra. When Rondva opens, purchases will run through the App Store and the price
                you see in the app will be your local App Store price.
              </p>
            </div>
            <div className="rv-reveal rounded-card border border-line bg-paper p-8 shadow-[0_24px_60px_-30px_rgba(16,20,24,0.25)]" style={{ "--i": 2 } as React.CSSProperties}>
              <p className="inline-flex rounded-full bg-paper-alt px-3 py-1 text-xs font-medium text-muted">
                Pricing below is what we&apos;re planning, not a live offer. Nothing is for sale yet.
              </p>
              <p className="rv-tnum mt-6 font-serif text-[52px] font-semibold leading-none tracking-tight text-ink">
                $99.99 <span className="font-sans text-lg font-medium tracking-normal text-muted">/ month</span>
              </p>
              <ul className="mt-7 space-y-3 text-[15px] text-ink">
                {[
                  "20 AI-drafted reports per month",
                  "2 AI revisions included with every report",
                  "Unlimited manual editing and re-export — free",
                ].map((line) => (
                  <li key={line} className="flex gap-3">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" aria-hidden="true" />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex items-baseline justify-between border-t border-line pt-6">
                <div>
                  <p className="font-semibold text-ink">Additional reports</p>
                  <p className="text-sm text-muted">10 extra AI-drafted reports</p>
                </div>
                <p className="rv-tnum font-serif text-2xl font-semibold text-ink">$39.99</p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Waitlist */}
        <section id="waitlist" className="rv-blueprint-light px-6 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="rv-reveal">
              <p className="rv-eyebrow">Waitlist</p>
              <h2 className="rv-display rv-balance mt-4 text-[34px] text-ink sm:text-[44px]">
                We&apos;re opening a small number of places first.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-muted">
                Leave your email and the country you inspect in. We&apos;ll write when Rondva is
                ready for you to try — no newsletter, no drip campaign.
              </p>
            </div>
            <div className="rv-reveal mt-10 text-left" style={{ "--i": 1 } as React.CSSProperties}>
              <WaitlistForm />
            </div>
            <p className="rv-reveal mt-6 text-sm text-muted" style={{ "--i": 2 } as React.CSSProperties}>
              Questions first?{" "}
              <Link href="/privacy" className="underline underline-offset-4">How we handle your data</Link>
            </p>
          </div>
        </section>
      </main>
      <RondvaFooter />
      <RevealObserver />
    </>
  );
}
