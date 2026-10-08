import type { Metadata } from "next";
import { BRANDS } from "@/lib/brand";
import { RONDVA_TRIAL } from "@/lib/rondva-pricing";
import { LegalLink, LegalPage, type LegalSection } from "@/components/rondva/LegalPage";

// rondva.com/terms — notkunarskilmálar Rondva (Terms of Use-tengill sem App Store
// krefst fyrir áskriftir, 3.1.2). Appleyfið sjálft fer eftir Standard EULA Apple;
// þessir skilmálar ná yfir þjónustuna. Skrifað úr kóða og vöruákvörðunum, ekki af
// lögfræðingi — sjá OPS-14 í plan/rondva/OPIN-ATRIDI.
// 2026-10-07 (appið 1.3.0 í App Review): „Terms of Use (EULA)“ á kaupaskjá appsins (app/billing.tsx,
// BRAND.termsUrl) opnar þessa síðu, svo hún segir berum orðum að Standard EULA Apple gildi um
// appið sjálft og þessir skilmálar um þjónustuna. Áskriftaratriði 3.1.2 (endurnýjun, afpöntun,
// Apple ID-gjald), röð notkunar (tilboð → áskrift → pakkar), endurgreiðsla og að eyðing
// reiknings segir ekki upp áskrift eru úr docs/release/IN_APP_PURCHASES.md og ACCOUNT_DELETION.md
// í beton-app. Orðalagið „When paid plans are offered in the app“ er haldið (verify-rondva-pricing).

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "The terms of use for Rondva, the inspection app and dashboard from Vitvélar ehf.: accounts, AI-drafted reports you must review, your content, data processing, free reports, App Store subscriptions and auto-renewal, and liability.",
  alternates: { canonical: `${BRANDS.rondva.marketingUrl}/terms` },
};

const R = BRANDS.rondva;
const mail = `mailto:${R.contactEmail}`;
const APPLE_EULA = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

const list = "list-disc pl-5 space-y-2";

const sections: LegalSection[] = [
  {
    id: "about",
    title: "About these terms",
    body: (
      <>
        <p>
          Rondva is provided by <strong>{R.company}</strong> (registration no. {R.companyId}),{" "}
          {R.companyAddress} (&ldquo;we&rdquo;, &ldquo;us&rdquo;). These terms apply to the
          Rondva iPhone app, the dashboard at app.rondva.com and the related services
          (together, &ldquo;Rondva&rdquo;).
        </p>
        <p>
          Rondva is a tool for businesses. The customer is the company you use Rondva for,
          which can be a one-person firm (&ldquo;your company&rdquo;). By signing in, you
          accept these terms for yourself and confirm that you may accept them on behalf of
          your company. If you can&apos;t or don&apos;t want to, please don&apos;t use Rondva.
          Rondva is not intended for consumers or for anyone under 18.
        </p>
        <p>
          This page is the <strong>Terms of Use</strong> that the Rondva app links to (for
          example from the plans screen) and that the App Store page refers to. The licence for
          the app itself is Apple&apos;s standard terms, as explained in &ldquo;The iPhone
          app&rdquo; below.
        </p>
      </>
    ),
  },
  {
    id: "service",
    title: "What Rondva does",
    body: (
      <>
        <p>
          Rondva lets you record property inspections on your phone (rooms, ratings,
          observations, photos and thermal images), keep them in sync with your account, have
          the report text drafted by an AI service, edit it, and export the report as a PDF
          with your company&apos;s name and logo. The weather field of an inspection can fill
          itself in from a forecast for the address you entered.
        </p>
        <p>
          Rondva is new and still changing. We add, change and sometimes remove features.
          If a change removes something you rely on, we will tell you in advance where we
          reasonably can.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Accounts and company access",
    body: (
      <>
        <ul className={list}>
          <li>
            You sign in with Apple or Google. Keep that account secure. Each login is for one
            person; don&apos;t share it.
          </li>
          <li>
            Access is given to companies we have approved. We decide which companies and
            countries we open Rondva to, and approval can be refused or withdrawn in the
            cases described under &ldquo;Ending your account&rdquo;.
          </li>
          <li>
            Give us accurate information about yourself and your company, and keep it up to
            date.
          </li>
          <li>
            You are responsible for what happens under your login, and your company is
            responsible for the people it lets use Rondva.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "app-licence",
    title: "The iPhone app",
    body: (
      <>
        <p>
          The Rondva app from the App Store is licensed to you under Apple&apos;s{" "}
          <LegalLink href={APPLE_EULA}>Standard Licensed Application End User License Agreement</LegalLink>.
          These terms cover the Rondva service that the app connects to. If the two ever
          disagree about the licence to the app itself, Apple&apos;s terms win; on everything
          about the Rondva service, these terms apply. The &ldquo;Terms of Use (EULA)&rdquo;
          link in the app opens this page, and Apple&apos;s standard terms are available at the
          link above. Apple is not a party to these terms and is not responsible for Rondva or
          for supporting it; we are.
        </p>
      </>
    ),
  },
  {
    id: "reports",
    title: "AI-drafted reports and your professional responsibility",
    body: (
      <>
        <p>
          Rondva drafts report text from what you recorded. An AI draft can be wrong,
          incomplete or badly worded, and it only knows what you entered and photographed.
          It is a starting point, not a finished report.
        </p>
        <ul className={list}>
          <li>
            You review, correct and approve every report before you issue it. Rondva never
            sends a report to your client for you.
          </li>
          <li>
            The findings, severities and conclusions are yours. Rondva does not inspect
            buildings, and a Rondva report is not a certified engineering conclusion.
          </li>
          <li>
            You are responsible towards your own clients for the reports you issue, including
            meeting any professional or legal requirements that apply to inspections where you
            work.
          </li>
          <li>
            An AI draft can misread a photo or add detail that is not there. Check it against
            what you saw before you issue the report.
          </li>
          <li>
            Weather text that Rondva fills in comes from a forecast for the address, not from a
            measurement at the property. Check it and correct it if conditions differed.
          </li>
          <li>
            You can always create a report without AI.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "content",
    title: "Your content",
    body: (
      <>
        <p>
          Your company owns what you put into Rondva: inspections, notes, photos, logos, terms
          and the reports you create (&ldquo;your content&rdquo;). You give us permission to
          store, copy, process and display your content only as needed to run Rondva for you:
          syncing it, backing it up, drafting reports when you ask, rendering PDFs and
          providing support.
        </p>
        <p>
          We don&apos;t sell your content, and we don&apos;t use it to train AI models. When
          you ask for an AI draft, the content listed in the app at that moment is sent to our
          AI provider to produce the draft, as described in the{" "}
          <LegalLink href="/privacy">privacy policy</LegalLink>.
        </p>
        <p>
          You are responsible for having the right to record and upload your content,
          including photos in which people or their belongings can be identified, and your
          clients&apos; details. Don&apos;t upload anything unlawful.
        </p>
      </>
    ),
  },
  {
    id: "data-processing",
    title: "Personal data you record (data processing terms)",
    body: (
      <>
        <p>
          Inspections often contain personal data about your clients and other people, such
          as names, addresses and photos. For that data your company is the controller and we
          are your processor under the GDPR (as implemented in Iceland by Act no. 90/2018).
          When we act as your processor, we:
        </p>
        <ul className={list}>
          <li>process the data only to provide Rondva under these terms and your instructions in the app;</li>
          <li>make sure the people who can access it are bound by confidentiality;</li>
          <li>
            protect it with appropriate security, including encrypted connections, access
            limited to your own account and encrypted storage at our hosting providers;
          </li>
          <li>
            use only the sub-processors listed in the{" "}
            <LegalLink href="/privacy#processors">privacy policy</LegalLink> (including the
            public weather service used for the weather auto-fill, which receives only rounded
            coordinates), tell you before we add or replace one, and let you stop using
            Rondva if you object;
          </li>
          <li>
            rely on the EU Standard Contractual Clauses or another lawful mechanism where data
            leaves the EEA;
          </li>
          <li>help you respond to requests from the people concerned and with any required impact assessment;</li>
          <li>tell you without undue delay if we become aware of a personal data breach affecting your data;</li>
          <li>delete the data when your account is closed, as described below; and</li>
          <li>give you the information you reasonably need to show that these obligations are met.</li>
        </ul>
        <p>
          For your own account details (your name, email and sign-in), we are the controller.
          The <LegalLink href="/privacy">privacy policy</LegalLink> explains both.
        </p>
      </>
    ),
  },
  {
    id: "pricing",
    title: "Free reports, subscriptions and report credits",
    body: (
      <>
        <p>
          <strong>First month free.</strong> Each new company on Rondva gets{" "}
          {RONDVA_TRIAL.freeReports} AI-drafted reports free for the first {RONDVA_TRIAL.days} days
          after its company account is activated, whichever runs out first, with no card needed.
          Free reports that are not used in those {RONDVA_TRIAL.days} days end, and nothing is
          charged afterwards. The free month is given once per company and once per person: if
          an account that has had it is deleted and registered again with the same Apple or
          Google sign-in or email address, the new company does not get another free month. If
          demand is very high we may limit free reports for a day; you will see a message and
          can try again the next day.
        </p>
        <p>
          One report credit covers the first AI draft for one inspection and up to 2 AI
          revisions of it. Editing text by hand, exporting again and creating a report without
          AI never use a credit. A draft that fails doesn&apos;t use a credit.
        </p>
        <p>When paid plans are offered in the app:</p>
        <ul className={list}>
          <li>
            You buy them in the app, through the App Store. Apple takes the payment under its
            own terms. The price, currency, tax and billing period are the ones shown in the
            app before you confirm, and payment is charged to your Apple ID account at
            confirmation of the purchase. The reports go to the company of the Rondva account
            you are signed in with.
          </li>
          <li>
            Plans are a monthly subscription, Solo or Pro, each with a set number of report
            credits per month, plus a report pack of extra credits. Every plan includes 2 AI
            revisions per report, unlimited manual editing and re-exports, and your company
            branding.
          </li>
          <li>
            <strong>Auto-renewal.</strong> Subscriptions renew automatically every month at the
            price shown, unless you cancel at least 24 hours before the end of the current
            period. Apple charges your account for the renewal within 24 hours before the
            period ends. You manage and cancel in your Apple account settings (on the iPhone:
            Settings, your name, Subscriptions; or <strong>Manage subscription</strong> in the
            app). Cancelling stops the next renewal; the current period runs to its end.
            Deleting your Rondva account does not cancel a subscription, so cancel it first.
          </li>
          <li>
            Report credits included in a subscription period are for use in that period and
            do not carry over. Credits in an extra report pack don&apos;t expire and stay
            usable after a subscription ends.
          </li>
          <li>
            Credits are used in this order: free reports from your first month first, then
            the reports of your subscription period, then report packs.
          </li>
          <li>
            If you move from Solo to Pro in the middle of a period, Pro starts straight away
            with a new period. Apple refunds the unused part of Solo, and the unused Solo
            reports end. Moving from Pro to Solo takes effect when the current period ends.
          </li>
          <li>
            <strong>Restore purchases</strong> in the app checks your current subscription with
            Apple again, for example on a new phone. Report packs belong to your Rondva account
            and are not lost.
          </li>
          <li>
            Refunds are handled by Apple under Apple&apos;s rules. If Apple refunds or revokes
            a purchase, we take back the unused reports from it; reports you have already
            drafted stay yours.
          </li>
          <li>
            If we change a price, it applies from your next billing period, and Apple will ask
            for your consent where its rules require it.
          </li>
        </ul>
        <p>
          When you run out of credits, you can still open, edit and export everything you have
          already made.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>Don&apos;t:</p>
        <ul className={list}>
          <li>use Rondva for anything unlawful, or to store content you have no right to;</li>
          <li>
            try to get around report credits or limits, for example by registering extra
            companies to get more free reports;
          </li>
          <li>
            access other customers&apos; data, probe or overload our systems, or scrape Rondva
            with automated tools;
          </li>
          <li>
            copy, decompile or reverse-engineer Rondva, except where the law allows it
            regardless of these terms;
          </li>
          <li>resell or give access to Rondva to anyone outside your company.</li>
        </ul>
      </>
    ),
  },
  {
    id: "availability",
    title: "Availability",
    body: (
      <>
        <p>
          We work to keep Rondva available and your data safe, but we can&apos;t promise that
          it will always be available or free of errors. Because the app saves your work on
          the phone first, you can usually keep recording while our servers or your connection
          are down.
        </p>
        <p>
          If we decide to shut Rondva down, we will tell you at least 60 days in advance so you
          can export your reports.
        </p>
      </>
    ),
  },
  {
    id: "ending",
    title: "Ending your account",
    body: (
      <>
        <p>
          You can stop using Rondva at any time and delete your account in the app (Settings,
          then Delete account), or ask us to, as described on the{" "}
          <LegalLink href="/support#delete-account">support page</LegalLink>. Export anything
          you want to keep first. Deleting your account does not cancel an App Store
          subscription; cancel that in your Apple account settings.
        </p>
        <p>
          We may suspend or close an account if it breaks these terms, if continuing would put
          other customers or Rondva at risk, or if the law requires it. Unless the situation is
          urgent, we will tell you first and give you a chance to fix the problem and export
          your content.
        </p>
        <p>
          When an account is closed, we delete its content as described in the privacy policy,
          except what we must keep by law, such as accounting records of purchases.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Warranties and liability",
    body: (
      <>
        <p>
          Rondva is provided as it is and as available. To the extent the law allows, we make
          no promises beyond those in these terms, for example that AI drafts will be accurate
          or that Rondva will suit a particular purpose.
        </p>
        <p>
          To the extent the law allows, we are not liable for indirect or consequential loss,
          such as lost profit, lost business or claims from your clients about reports you
          issued, and our total liability to your company for any claim is limited to what your
          company paid for Rondva in the 12 months before the claim arose, or USD 100 if that is
          more.
        </p>
        <p>
          Nothing in these terms limits liability that cannot be limited by law, such as
          liability for intent or gross negligence.
        </p>
      </>
    ),
  },
  {
    id: "law",
    title: "Governing law and disputes",
    body: (
      <>
        <p>
          These terms are governed by Icelandic law. If a dispute can&apos;t be settled by
          talking to us first, it goes to the District Court of Reykjavík (Héraðsdómur
          Reykjavíkur). This does not take away any rights you have under mandatory law where
          your company is based.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <>
        <p>
          We will update these terms as Rondva develops. For changes that matter, we tell you
          by email or in the app at least 30 days before they apply. If you keep using Rondva
          after that, the new terms apply. If you don&apos;t agree, you can stop using Rondva
          and delete your account.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <>
        <p>
          {R.company}, {R.companyAddress}. Registration no. {R.companyId}. Email:{" "}
          <LegalLink href={mail}>{R.contactEmail}</LegalLink>.
        </p>
      </>
    ),
  },
];

export default function RondvaTermsPage() {
  return (
    <LegalPage
      eyebrow="Terms of use"
      title="The terms for using Rondva"
      intro={
        <p>
          Short version: Rondva is a tool for businesses. Your inspections and reports belong
          to your company, and so does the responsibility for what you send to clients. AI
          drafts are a starting point you review. Purchases go through the App Store, and
          subscriptions renew automatically until you cancel them with Apple.
        </p>
      }
      sections={sections}
      revised="8 October 2026"
      toc
    />
  );
}
