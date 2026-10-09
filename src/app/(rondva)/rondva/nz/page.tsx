import type { Metadata } from "next";
import Link from "next/link";
import { BRANDS } from "@/lib/brand";
import { HAS_SAMPLE, SAMPLE_REPORT_URL } from "@/lib/rondva-links";
import { RONDVA_NZ_SOLO, RONDVA_OFFER_LINE, RONDVA_PLANS, nzSoloPerReport } from "@/lib/rondva-pricing";
import { breadcrumbLd, faqPageLd, organizationLd, softwareApplicationLd } from "@/lib/rondva-seo";
import { RondvaHeader } from "@/components/rondva/RondvaHeader";
import { RondvaFooter } from "@/components/rondva/RondvaFooter";
import { AppStoreBadge, AppStoreQr } from "@/components/rondva/AppStoreBadge";
import { JsonLd } from "@/components/rondva/JsonLd";
import { PhoneFrame } from "@/components/rondva/PhoneFrame";
import { RevealObserver } from "@/components/rondva/Reveal";
import { SectionHeading } from "@/components/rondva/SectionHeading";
import { WhereAiStops } from "@/components/rondva/WhereAiStops";

// rondva.com/nz — kanónísk „NZS 4306 report app“-síða. Hún á að svara spurningunni í fyrstu
// málsgrein (fyrir leitar- og svarvélar), telja aðeins upp það sem Nzs4306Report.tsx raunverulega
// birtir, og nota NZ$-verð aðeins þar sem þau eru staðfest (Solo). Engar fullyrðingar um
// „compliant/certified/approved“.

const PATH = "/nz";
const PAGE_URL = `${BRANDS.rondva.marketingUrl}${PATH}`;
const TITLE = "NZS 4306 building inspection reports, drafted on your iPhone | Rondva";
const DESCRIPTION =
  `Rondva is an iPhone app that drafts NZS 4306:2005 pre-purchase building inspection reports from your photos, notes, moisture readings and ratings, even with no signal under the house. You review every word and the PDF goes out under your company name. Solo is ${RONDVA_NZ_SOLO.currency}${RONDVA_NZ_SOLO.price} a month.`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "en_NZ",
    siteName: "Rondva",
    url: PAGE_URL,
    images: [{ url: "/rondva/og-1200x630.png", width: 1200, height: 630, alt: "Rondva" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/rondva/og-1200x630.png"],
  },
};

const DEFINITION =
  "Rondva is an iPhone app that drafts NZS 4306:2005 pre-purchase inspection reports from the inspector's photos, notes and ratings. The inspector reviews and issues the report.";

const soloPerReport = `${RONDVA_NZ_SOLO.currency}${nzSoloPerReport()}`;
const soloPrice = `${RONDVA_NZ_SOLO.currency}${RONDVA_NZ_SOLO.price}`;
const soloReports = RONDVA_PLANS.find((p) => p.id === "solo")?.reports ?? 0;

// Aðeins það sem Nzs4306Report.tsx birtir (sannreynt 2026-10-09).
const REPORT_CONTENTS: { title: string; body: string }[] = [
  {
    title: "Executive summary",
    body: "An introduction and conclusion, and a count of your findings by the severity you set: minor, serious and very serious.",
  },
  {
    title: "Summary of significant defects",
    body: "The findings you rated very serious, in a table with location and recommended action.",
  },
  {
    title: "Certificate of Inspection",
    body: "Client, site address, inspector, qualifications, company and date, the areas inspected, and a signature block for you.",
  },
  {
    title: "Findings by part of the building",
    body: "Site, exterior, roof, roof space, subfloor, interior, services and ancillary buildings, with your photos, your ratings for each item and a recommendation for each finding.",
  },
  {
    title: "Gradual deterioration and maintenance",
    body: "The maintenance items you recorded, with a recommended action for each.",
  },
  {
    title: "Moisture readings",
    body: "A table of the readings as you recorded them, with the meter you used.",
  },
  {
    title: "Limitations and areas not inspected",
    body: "Which areas were inspected, which were not or had limited access, the limitations you recorded, and the scope of the inspection.",
  },
  {
    title: "Use of AI in this report",
    body: "A fixed statement that the report text was drafted with AI assistance, with your name and your company's.",
  },
];

const FAQ_ANSWERS = {
  what: DEFINITION,
  nzs4306:
    "Yes. Rondva drafts the report in NZS 4306:2005 order from your photos, notes, moisture readings and ratings. You review it, and the PDF goes out under your company name.",
  ratings:
    "No. Your ratings are locked: the AI cannot change the severity you set on any finding. On NZS 4306 reports, any figure in a finding's write-up, and every moisture reading, must match a number you entered, or Rondva falls back to your own words.",
  offline:
    "Yes. Everything you record is saved on your phone first, so you can keep inspecting with no signal, for example under the house or in the roof space. It syncs when you are back online.",
  responsible:
    "You are. Rondva drafts the report text from your photos, notes and ratings, you review every word, and you issue the PDF under your company name.",
  price: `Solo is ${soloPrice} a month for ${soloReports} AI-drafted reports, about ${soloPerReport} a report. Pro and the Report Pack are priced in NZ$ in the App Store. ${RONDVA_OFFER_LINE}`,
} as const;

const FAQ: { id: keyof typeof FAQ_ANSWERS; q: string }[] = [
  { id: "what", q: "What is Rondva?" },
  { id: "nzs4306", q: "Does Rondva write NZS 4306 reports?" },
  { id: "ratings", q: "Can the AI change my ratings?" },
  { id: "offline", q: "Does it work with no signal?" },
  { id: "responsible", q: "Who is responsible for the report?" },
  { id: "price", q: "How much does Rondva cost in New Zealand?" },
];

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

export default function RondvaNzPage() {
  return (
    <>
      <noscript>
        <style>{`.rv-reveal{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <JsonLd
        nodes={[
          organizationLd(),
          softwareApplicationLd(),
          breadcrumbLd([
            { name: "Rondva", path: "/" },
            { name: "NZS 4306 reports", path: PATH },
          ]),
          faqPageLd(FAQ.map((f) => ({ q: f.q, a: FAQ_ANSWERS[f.id] }))),
        ]}
      />
      <RondvaHeader />
      <main className="flex-1">
        {/* 1. Hetja */}
        <section aria-labelledby="nz-title" className="rv-hero rv-blueprint rv-grain relative overflow-hidden text-paper">
          <div className="pointer-events-none absolute -right-64 -top-72 h-[560px] w-[560px] rounded-full bg-blue/25 blur-[140px]" aria-hidden="true" />
          <div className="relative mx-auto max-w-[1180px] px-6 pb-16 pt-12 sm:pt-16 md:pb-24 md:pt-20">
            <p className="rv-reveal rv-eyebrow !text-paper/60">
              New Zealand · NZS 4306:2005 · iPhone app on the App Store
            </p>
            <h1
              id="nz-title"
              className="rv-reveal rv-display rv-balance mt-6 max-w-4xl text-[40px] sm:text-[56px] md:text-[64px]"
              style={{ "--i": 1 } as React.CSSProperties}
            >
              Your <span className="whitespace-nowrap">NZS 4306</span> report, <em>drafted from your site notes.</em>
            </h1>
            <p
              className="rv-reveal mt-7 max-w-2xl text-lg leading-relaxed text-paper/80 md:text-xl"
              style={{ "--i": 2 } as React.CSSProperties}
            >
              Photos, notes, moisture readings and your own rating for each area, even under the house with no
              signal. Rondva drafts the report in NZS 4306:2005 order. You review every word, and the PDF goes out
              under your company name.
            </p>
            <p className="rv-reveal mt-5 max-w-2xl text-base leading-relaxed text-paper/65" style={{ "--i": 2 } as React.CSSProperties}>
              {DEFINITION}
            </p>
            <div className="rv-reveal mt-9 flex flex-wrap items-center gap-x-5 gap-y-4" style={{ "--i": 3 } as React.CSSProperties}>
              <AppStoreBadge />
              {HAS_SAMPLE ? (
                <a
                  href={SAMPLE_REPORT_URL}
                  className="inline-flex items-center rounded-full border border-paper/25 px-6 py-3.5 text-sm font-semibold text-paper/90 transition-colors hover:border-paper/60"
                >
                  See a sample NZS 4306 report (PDF)
                </a>
              ) : null}
              <AppStoreQr className="ml-2" />
            </div>
            <p className="rv-reveal mt-6 text-sm text-paper/55" style={{ "--i": 4 } as React.CSSProperties}>
              {RONDVA_OFFER_LINE}
            </p>
          </div>
        </section>

        {/* 2. Hvað er í skýrslunni */}
        <section className="px-6 py-20 md:py-28" aria-labelledby="contents-title">
          <div className="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
            <div>
              <SectionHeading id="contents-title" eyebrow="What's in the report">
                What goes into the report, section by section.
              </SectionHeading>
              <ul className="mt-12 space-y-6">
                {REPORT_CONTENTS.map((item, i) => (
                  <li key={item.title} className="rv-reveal flex gap-4" style={{ "--i": i } as React.CSSProperties}>
                    {check}
                    <div>
                      <h3 className="text-[17px] font-semibold tracking-tight text-ink">{item.title}</h3>
                      <p className="mt-1 leading-relaxed text-muted">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="rv-reveal mt-10 max-w-xl text-sm leading-relaxed text-muted">
                Your company logo and your own terms go on the cover and the last page. A Rondva report is your
                professional inspection, written up; you are responsible for its content before you issue it.
              </p>
            </div>
            <figure className="rv-reveal flex flex-col items-center gap-6 lg:items-start" style={{ "--i": 2 } as React.CSSProperties}>
              <div className="flex items-end justify-center gap-6">
                <PhoneFrame
                  src="/rondva/screens/observation-nz.webp"
                  alt="Rondva observation screen: the severity you choose (very serious selected), category, title, a description with a moisture reading, a recommendation, and photos including a thermal image"
                  className="!aspect-[997/2010]"
                />
              </div>
              <figcaption className="max-w-xs text-center text-sm leading-relaxed text-muted lg:text-left">
                You set the severity, the AI never does.
              </figcaption>
            </figure>
          </div>
        </section>

        {/* 3. Á staðnum án merkis */}
        <section className="rv-blueprint-light px-6 py-20 md:py-28" aria-labelledby="site-title">
          <div className="mx-auto grid max-w-[1180px] items-center gap-12 lg:grid-cols-[auto_1fr] lg:gap-20">
            <figure className="rv-reveal mx-auto lg:mx-0">
              <PhoneFrame
                src="/rondva/screens/offline-nz.webp"
                alt="Rondva on an iPhone with no signal: the Exterior area of a New Zealand inspection, with a photo and ratings for weatherboards, cladding, ground clearance, joinery, flashings, sealants and paint"
                className="!aspect-[997/1881]"
              />
            </figure>
            <div>
              <SectionHeading id="site-title" eyebrow="On site">
                Captures with no signal: under the house, in the roof space.
              </SectionHeading>
              <p className="rv-reveal mt-6 max-w-xl text-lg leading-relaxed text-muted" style={{ "--i": 1 } as React.CSSProperties}>
                Everything is saved on your phone first and syncs when you are back online. Record the areas you
                walk, a rating for each item, photos, thermal images and a note for every finding. Creating the AI
                draft is the one step that needs a connection.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Hvar gervigreindin stoppar (sameiginlegur kafli) */}
        <WhereAiStops />

        {/* 5. Verð í NZ$ — aðeins Solo er staðfest; Pro og pakki ekki gefin upp í NZ$. */}
        <section aria-labelledby="nz-pricing-title" className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <SectionHeading id="nz-pricing-title" eyebrow="Pricing in New Zealand">
              Priced in New Zealand dollars, charged by Apple.
            </SectionHeading>
            <div className="rv-reveal mt-10 max-w-2xl rounded-card border border-line-strong bg-paper p-7 sm:p-9" style={{ "--i": 1 } as React.CSSProperties}>
              <p className="text-xl leading-relaxed text-ink">
                <strong>Solo {soloPrice}/month:</strong> {soloReports} AI reports, about {soloPerReport} a report.
                You charge NZ$500+ for one.
              </p>
              <p className="mt-4 leading-relaxed text-muted">
                Pro and the Report Pack are priced in NZ$ in the App Store. {RONDVA_OFFER_LINE} Charged by Apple
                in NZ$ incl. GST; manual edits and re-exports never use up a report.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                <AppStoreBadge />
                <Link href="/#pricing" className="text-sm font-semibold text-ink underline underline-offset-4 hover:text-blue">
                  All plans and the offer
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Spurningar (sami texti og í FAQPage JSON-LD) */}
        <section className="px-6 pb-24 md:pb-32" aria-labelledby="faq-title">
          <div className="mx-auto max-w-[1180px]">
            <SectionHeading id="faq-title" eyebrow="Questions">
              Short answers.
            </SectionHeading>
            <dl className="mt-12 grid gap-x-14 gap-y-10 md:grid-cols-2">
              {FAQ.map((f, i) => (
                <div key={f.id} className="rv-reveal border-t border-line pt-6" style={{ "--i": i % 2 } as React.CSSProperties}>
                  <dt className="font-serif text-[22px] font-semibold tracking-tight text-ink">{f.q}</dt>
                  <dd className="mt-2 leading-relaxed text-muted">{FAQ_ANSWERS[f.id]}</dd>
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
