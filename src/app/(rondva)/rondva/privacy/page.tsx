import type { Metadata } from "next";
import Link from "next/link";
import { BRANDS } from "@/lib/brand";
import { RondvaHeader } from "@/components/rondva/RondvaHeader";
import { RondvaFooter } from "@/components/rondva/RondvaFooter";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Vitvélar ehf. handles the personal data you leave on the Rondva waitlist, and what changes when the app itself launches.",
  alternates: { canonical: `${BRANDS.rondva.marketingUrl}/privacy` },
};

const R = BRANDS.rondva;

type Section = { title: string; body: React.ReactNode };

const sections: Section[] = [
  {
    title: "Who is responsible",
    body: (
      <>
        <p>
          Rondva is built and operated by <strong>{R.company}</strong> (company
          registration no. {R.companyId}), {R.companyAddress}. Vitvélar is the data
          controller for the information described on this page.
        </p>
        <p>
          Questions about privacy go to{" "}
          <a href={`mailto:${R.contactEmail}`} className="underline underline-offset-4">
            {R.contactEmail}
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "What this page covers",
    body: (
      <>
        <p>
          Right now rondva.com is a pre-launch site with a waitlist. The only
          personal data we collect here is what you type into the waitlist form.
          The Rondva app is not yet available to the public; before it is, a
          separate privacy policy for the app will be published at this address
          and linked from the app.
        </p>
      </>
    ),
  },
  {
    title: "What we collect on the waitlist and why",
    body: (
      <>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Email address</strong> — so we can write to you when Rondva is
            ready for you to try.
          </li>
          <li>
            <strong>Country you inspect in</strong> — so we know which markets to
            open first and which to contact first.
          </li>
          <li>
            <strong>Technical details of the submission</strong> — the time, your
            browser&apos;s user-agent string, and a one-way hash of your IP address.
            We use these only to detect abuse and duplicate submissions. The hash
            cannot be turned back into your IP address.
          </li>
        </ul>
        <p>
          The legal basis is our legitimate interest in building a product with
          the people who asked to hear about it (GDPR art. 6(1)(f)), and, for the
          email we send you, your request to be contacted. We do not use the list
          for a newsletter, a drip campaign, advertising, or profiling, and we do
          not sell or share it.
        </p>
      </>
    ),
  },
  {
    title: "Where the data is stored and who processes it",
    body: (
      <>
        <p>We keep the list small and the processors few:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Supabase</strong> — database hosting in the European Union
            (AWS, Ireland). This is where the waitlist entries live.
          </li>
          <li>
            <strong>Vercel</strong> — hosts this website and the form endpoint.
            Vercel processes the request that carries your submission.
          </li>
          <li>
            <strong>Resend</strong> — sends a one-line internal notification to
            us when someone joins, and later the email telling you Rondva is ready.
          </li>
        </ul>
        <p>
          Each of these acts as a processor under a data-processing agreement.
          Where a processor is outside the EEA, transfers rest on the EU Standard
          Contractual Clauses.
        </p>
      </>
    ),
  },
  {
    title: "How long we keep it",
    body: (
      <>
        <p>
          Until Rondva launches and we have written to you, or until you ask us to
          remove you — whichever comes first. If Rondva does not launch, the list
          is deleted. Entries that never lead to an account are deleted no later
          than 24 months after they were submitted.
        </p>
      </>
    ),
  },
  {
    title: "Your rights",
    body: (
      <>
        <p>
          You can ask to see what we hold about you, have it corrected or deleted,
          restrict or object to its use, or receive a copy in a portable format.
          To leave the list, reply to any email from us or write to{" "}
          <a href={`mailto:${R.contactEmail}`} className="underline underline-offset-4">
            {R.contactEmail}
          </a>
          ; we remove you within a few days and confirm.
        </p>
        <p>
          If you think we have handled your data incorrectly you can complain to
          the Icelandic Data Protection Authority (Persónuvernd,{" "}
          <a
            href="https://www.personuvernd.is"
            className="underline underline-offset-4"
            rel="noopener noreferrer"
            target="_blank"
          >
            personuvernd.is
          </a>
          ) or to the supervisory authority in your own country.
        </p>
      </>
    ),
  },
  {
    title: "Cookies and analytics",
    body: (
      <>
        <p>
          This site sets no cookies and runs no analytics or tracking scripts.
          If that changes we will update this page first.
        </p>
      </>
    ),
  },
  {
    title: "Changes",
    body: (
      <>
        <p>
          We will update this page when the app launches or when our processors
          change. The date below is the last revision.
        </p>
      </>
    ),
  },
];

export default function RondvaPrivacyPage() {
  return (
    <>
      <RondvaHeader />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <p className="rv-eyebrow">Privacy</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight rv-balance">
            How we handle your data on the Rondva waitlist
          </h1>
          <p className="mt-6 text-lg text-muted leading-relaxed">
            Short version: we store your email and country, we use them only to
            tell you when Rondva is ready, and you can leave in one message.
          </p>

          <div className="mt-14 space-y-12">
            {sections.map((s) => (
              <section key={s.title}>
                <h2 className="text-xl font-semibold tracking-tight">{s.title}</h2>
                <div className="mt-3 space-y-3 text-muted leading-relaxed">{s.body}</div>
              </section>
            ))}
          </div>

          <p className="mt-16 text-sm text-muted">
            Last revised 21 September 2026.{" "}
            <Link href="/" className="underline underline-offset-4">
              Back to the front page
            </Link>
          </p>
        </article>
      </main>
      <RondvaFooter />
    </>
  );
}
