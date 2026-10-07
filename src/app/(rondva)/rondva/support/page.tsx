import type { Metadata } from "next";
import { BRANDS } from "@/lib/brand";
import {
  RONDVA_OFFER,
  RONDVA_PACK,
  RONDVA_PLANS,
  RONDVA_PRICE_NOTE,
  usd,
} from "@/lib/rondva-pricing";
import { LegalLink, LegalPage, type LegalSection } from "@/components/rondva/LegalPage";

// rondva.com/support — support-slóð Rondva-appsins (App Store Connect og
// lib/brand.ts í beton-app vísa hingað). Akkerin (#delete-account o.fl.) eru
// hluti af samningnum við appið: ekki endurnefna þau.

export const metadata: Metadata = {
  title: "Support",
  description:
    "Help with the Rondva app and dashboard: signing in, company access, AI-drafted reports, free reports and pricing, deleting your account, and how to reach us.",
  alternates: { canonical: `${BRANDS.rondva.marketingUrl}/support` },
};

const R = BRANDS.rondva;
const mail = `mailto:${R.contactEmail}`;

const sections: LegalSection[] = [
  {
    id: "getting-started",
    title: "Getting started",
    body: (
      <>
        <p>
          Rondva is an iPhone app for recording property inspections, with a web dashboard at{" "}
          <LegalLink href={R.appUrl}>app.rondva.com</LegalLink>. You sign in to both with the
          same Apple or Google account.
        </p>
        <p>
          To look around before you have an account, tap <strong>View demo</strong> on the
          sign-in screen. It opens a complete sample inspection with photos and a finished
          report. The demo stays on your phone, and nothing you do in it is sent anywhere.
        </p>
      </>
    ),
  },
  {
    id: "access",
    title: "Company accounts and access",
    body: (
      <>
        <p>
          Rondva accounts belong to companies, including one-person firms. Until your company
          has been approved, the app tells you that access isn&apos;t active yet. We are
          opening Rondva to a small number of companies first. If you&apos;d like a place,
          join the waitlist on the <LegalLink href="/">front page</LegalLink> or write to us.
        </p>
        <p>
          If the app says <strong>No access with this account</strong> and you have used
          Rondva before, you have probably signed in with a different method than the first
          time. Sign out and try the other one (Apple or Google).
        </p>
        <p>
          If you already use Google and want to sign in with Apple too, choose{" "}
          <strong>Share My Email</strong> when Apple asks, so Apple opens the same account.
          Once signed in, you can connect a second sign-in method under{" "}
          <strong>Settings → Sign-in methods</strong> in the app or on app.rondva.com.
        </p>
      </>
    ),
  },
  {
    id: "inspections",
    title: "Recording an inspection",
    body: (
      <>
        <p>
          Add the property, the rooms you walk, a rating per room and an observation for
          each thing you find, with photos and a severity that you choose. Thermal images
          can be imported from your photo library, for example from a thermal camera&apos;s
          own app.
        </p>
        <p>
          Everything is saved on your phone first, so you can keep working without a
          signal. It syncs to your account when you&apos;re back online and then appears on
          app.rondva.com.
        </p>
      </>
    ),
  },
  {
    id: "reports",
    title: "AI-drafted reports",
    body: (
      <>
        <p>
          When you create a report, Rondva asks you each time before anything is sent to the
          AI service, and shows exactly what will be sent. The AI drafts the report text and
          a summary from your notes, ratings and photos. The severities stay the ones you
          set. You can also choose to create the report without AI.
        </p>
        <p>
          Read the draft and change anything you like, on the phone or on app.rondva.com, and
          export it as a PDF (or a Word file from the app). Nothing is sent to your client
          automatically.
        </p>
        <p>
          A Rondva report is your professional inspection, written up. It is not a certified
          engineering conclusion, and you are responsible for its content before you issue it.
        </p>
      </>
    ),
  },
  {
    id: "pricing",
    title: "Free reports, pricing and credits",
    body: (
      <>
        <p>
          <strong>Founding offer:</strong> until {RONDVA_OFFER.endsOn}, every company gets{" "}
          <strong>{RONDVA_OFFER.freeReportsPerMonth} AI-drafted reports free every month</strong>.
          No card is needed. One report covers the first AI draft for an inspection plus up to 2
          AI revisions of it. Editing text by hand, exporting again, and creating a report
          without AI never use up a report.
        </p>
        <p>
          Paid plans will be sold inside the iPhone app through the App Store once it is
          available:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          {RONDVA_PLANS.map((plan) => (
            <li key={plan.id}>
              <strong>{plan.name}</strong>: {usd(plan.price)} per month, {plan.reports} AI-drafted
              reports per month
            </li>
          ))}
          <li>
            <strong>{RONDVA_PACK.name}</strong>: {usd(RONDVA_PACK.price)} for {RONDVA_PACK.reports}{" "}
            extra reports that never expire
          </li>
        </ul>
        <p>
          Every plan includes 2 AI revisions per report, unlimited manual editing and
          re-exports, and your company branding. {RONDVA_PRICE_NOTE} Until paid plans are
          available, if you run out of free reports, write to us.
        </p>
        <p>
          Once subscriptions are available, you manage or cancel them in the iPhone{" "}
          <strong>Settings</strong> app: tap your name, then <strong>Subscriptions</strong>.
          Apple handles payment and refunds. To ask for a refund, go to{" "}
          <LegalLink href="https://reportaproblem.apple.com">reportaproblem.apple.com</LegalLink>.
        </p>
      </>
    ),
  },
  {
    id: "language",
    title: "Languages",
    body: (
      <>
        <p>
          The app is in English and Icelandic. Change it under{" "}
          <strong>Settings → Language</strong>. The language your reports are written in is a
          company setting, which you&apos;ll find under <strong>Settings</strong> on
          app.rondva.com.
        </p>
      </>
    ),
  },
  {
    id: "delete-account",
    title: "Deleting your account and data",
    body: (
      <>
        <p>
          To delete your whole Rondva account, write to{" "}
          <LegalLink href={mail}>{R.contactEmail}</LegalLink> from the email address you sign
          in with. If you use Apple&apos;s Hide My Email, tell us that you signed in with Apple
          and the date you started. We then delete your account, along with the inspections,
          photos and reports stored with it, and confirm when it is done. Copies can remain
          in our encrypted backups until those expire on the normal backup cycle.
        </p>
        <p>
          If you signed in with Apple, you can also stop using Apple sign-in for Rondva on your
          iPhone under <strong>Settings → your name → Sign in with Apple</strong>. That alone
          doesn&apos;t delete the data in your Rondva account.
        </p>
      </>
    ),
  },
  {
    id: "privacy",
    title: "Privacy and security",
    body: (
      <>
        <p>
          What we collect, why, who processes it and for how long is in the{" "}
          <LegalLink href="/privacy">privacy policy</LegalLink>. The rules for using Rondva are
          in the <LegalLink href="/terms">terms of use</LegalLink>.
        </p>
        <p>
          If you think someone else has access to your account, or you have found a security
          problem, write to us straight away.
        </p>
      </>
    ),
  },
];

export default function RondvaSupportPage() {
  return (
    <LegalPage
      eyebrow="Support"
      title="Help with Rondva"
      intro={
        <p>
          Answers to the questions we get most. If yours isn&apos;t here, or something isn&apos;t
          working, write to us. A person at Vitvélar reads every message.
        </p>
      }
      sections={sections}
      revised="7 October 2026"
    >
      <div className="mt-10 rounded-card border border-line bg-paper p-6 shadow-[0_24px_60px_-40px_rgba(16,20,24,0.25)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Contact</p>
        <p className="mt-3 text-lg font-semibold">
          <a href={mail} className="underline underline-offset-4 hover:text-blue">
            {R.contactEmail}
          </a>
        </p>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          When you report a problem, tell us your iPhone model, the app version (shown in
          Settings), what you did and what happened. A screenshot helps. Please
          don&apos;t send inspection photos or client details unless we ask for them.
        </p>
        <p className="mt-4 text-sm text-muted">
          {R.company} · reg. no. {R.companyId} · {R.companyAddress}
        </p>
      </div>
    </LegalPage>
  );
}
