import { RondvaHeader } from "@/components/rondva/RondvaHeader";
import { RondvaFooter } from "@/components/rondva/RondvaFooter";
import { WaitlistForm } from "@/components/rondva/WaitlistForm";

const steps = [
  {
    n: "1",
    title: "Set up the property",
    body: "Address, building, and the rooms you’ll walk. Reusable between jobs of the same type.",
  },
  {
    n: "2",
    title: "Walk and record",
    body: "Photos, thermal images, and a note per observation. You pick the severity — always.",
  },
  {
    n: "3",
    title: "Rondva drafts",
    body: "It turns your notes into readable report text and an overall summary, in your structure.",
  },
  {
    n: "4",
    title: "Review, adjust, export",
    body: "Read it. Change anything. Export the PDF with the cost estimate.",
  },
];

const whatYouGet = [
  {
    title: "A PDF your client can actually read",
    body: "photos, thermal images and observations laid out per room.",
  },
  {
    title: "A cost estimate",
    body: "built from the findings you recorded.",
  },
  {
    title: "Your wording, not a template’s",
    body: "the draft follows your notes and your severity ratings.",
  },
  {
    title: "Edits stay free",
    body: "rewrite any text by hand and re-export as often as you want. No charge, no quota.",
  },
  {
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

export default function RondvaLandingPage() {
  return (
    <>
      <RondvaHeader />
      <main className="flex-1">
        {/* 1. Hero */}
        <section className="px-6 py-24 md:py-32">
          <div className="mx-auto max-w-[1120px] text-center">
            <p className="rv-eyebrow">Pre-launch</p>
            <h1 className="rv-balance mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-ink md:text-6xl">
              Walk the property. Rondva drafts the report.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Rondva is a field app for independent property inspectors. You record the
              rooms, the photos, the thermal images and the severity. Rondva drafts the
              wording and the summary — you stay the author of every judgement in it.
            </p>
            <div className="mt-10">
              <a
                href="#waitlist"
                className="inline-flex items-center rounded-full bg-blue px-7 py-3.5 text-sm font-semibold text-paper transition-colors hover:bg-blue-deep"
              >
                Join the waitlist
              </a>
            </div>
            <p className="mx-auto mt-6 max-w-xl text-sm italic text-muted">
              In development. We&apos;re building with working inspectors before we open
              sales.
            </p>
          </div>
        </section>

        {/* 2. Who it's for */}
        <section className="bg-paper-alt px-6 py-20 md:py-28">
          <div className="mx-auto max-w-[1120px]">
            <h2 className="rv-balance text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              Who it&apos;s for
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Rondva is being built for{" "}
              <strong className="font-semibold text-ink">
                independent inspectors and small inspection firms
              </strong>{" "}
              — the one-person operation and the three-person team, not the enterprise.
            </p>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
              If you spend the evening after an inspection retyping notes into a
              document, that evening is the problem we&apos;re working on.
            </p>
          </div>
        </section>

        {/* 3. How it works */}
        <section className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-[1120px]">
            <h2 className="rv-balance text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              How it works
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <div key={step.n}>
                  <span className="text-sm font-semibold text-blue">{step.n}</span>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-muted">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. What you get */}
        <section className="bg-paper-alt px-6 py-20 md:py-28">
          <div className="mx-auto max-w-[1120px]">
            <h2 className="rv-balance text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              What you get
            </h2>
            <ul className="mt-10 grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
              {whatYouGet.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" aria-hidden="true" />
                  <p className="text-base leading-relaxed text-muted">
                    <strong className="font-semibold text-ink">{item.title}</strong>
                    {item.body ? ` — ${item.body}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. Where the AI stops */}
        <section className="bg-ink px-6 py-24 text-paper md:py-32">
          <div className="mx-auto max-w-[1120px]">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue">
              Where the AI stops
            </h2>
            <p className="rv-balance mt-5 max-w-2xl text-2xl font-semibold tracking-tight md:text-3xl">
              This matters more than any feature, so we&apos;ll be direct about it.
            </p>
            <ul className="mt-12 grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
              {whereAiStops.map((item) => (
                <li key={item.title} className="border-t border-paper/20 pt-6">
                  <p className="text-lg leading-relaxed text-paper">
                    <strong className="font-semibold text-paper">{item.title}</strong>{" "}
                    <span className="text-paper/75">{item.body}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. Planned pricing */}
        <section className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-[1120px]">
            <h2 className="rv-balance text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              Planned pricing
            </h2>
            <div className="mt-10 max-w-xl rounded-card border border-line p-8">
              <p className="text-sm text-muted">
                Pricing below is what we&apos;re planning, not a live offer. Nothing is for
                sale yet.
              </p>
              <p className="mt-5 text-4xl font-semibold tracking-tight text-ink">
                $99.99 <span className="text-lg font-medium text-muted">/ month</span>
              </p>
              <ul className="mt-6 space-y-2.5">
                <li className="flex gap-3 text-base text-muted">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" aria-hidden="true" />
                  20 AI-drafted reports per month
                </li>
                <li className="flex gap-3 text-base text-muted">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" aria-hidden="true" />
                  2 AI revisions included with every report
                </li>
                <li className="flex gap-3 text-base text-muted">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" aria-hidden="true" />
                  Unlimited manual editing and re-export — free
                </li>
              </ul>

              <div className="mt-8 border-t border-line pt-6">
                <p className="text-base font-semibold text-ink">
                  Additional reports — $39.99
                </p>
                <p className="mt-2 text-base text-muted">10 extra AI-drafted reports</p>
              </div>
            </div>
            <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted">
              Manual text edits and re-exporting a PDF never count against your quota and
              never cost extra. When Rondva opens, purchases will run through the App
              Store and the price you see in the app will be your local App Store price.
            </p>
          </div>
        </section>

        {/* 7. Waitlist */}
        <section id="waitlist" className="bg-paper-alt px-6 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="rv-balance text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              We&apos;re opening a small number of places first.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Leave your email and the country you inspect in. We&apos;ll write when
              Rondva is ready for you to try — no newsletter, no drip campaign.
            </p>
            <div className="mt-10 text-left">
              <WaitlistForm />
            </div>
          </div>
        </section>
      </main>
      <RondvaFooter />
    </>
  );
}
