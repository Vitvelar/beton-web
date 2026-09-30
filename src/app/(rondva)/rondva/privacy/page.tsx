import type { Metadata } from "next";
import { BRANDS } from "@/lib/brand";
import { LegalLink, LegalPage, type LegalSection } from "@/components/rondva/LegalPage";

// rondva.com/privacy — persónuverndarstefna Rondva: vefur, biðlisti, stjórnborð og
// iOS-appið. Byggð á beton-app docs/release/PRIVACY_DATA_INVENTORY.md (gagnaflæði
// sannreynt í kóða) og samræmd við App Privacy-svör Rondva. Engar fastar
// geymslutímalengdir nema þær sem eru ákveðnar (biðlisti 24 mán., bókhald 7 ár).
// Akkerin (#processors o.fl.) eru notuð af /terms og appinu: ekki endurnefna.

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Vitvélar ehf. handles personal data in the Rondva app, on the app.rondva.com dashboard, on the waitlist and on rondva.com.",
  alternates: { canonical: `${BRANDS.rondva.marketingUrl}/privacy` },
};

const R = BRANDS.rondva;
const mail = `mailto:${R.contactEmail}`;
const list = "list-disc pl-5 space-y-2";

type Processor = { name: string; role: string; where: string };

const processors: Processor[] = [
  {
    name: "Supabase",
    role: "Database, file storage for photos and reports, and sign-in for the app and dashboard.",
    where: "European Union (AWS, Ireland)",
  },
  {
    name: "Anthropic",
    role: "Drafts report text with its Claude models, only when you confirm it for a report.",
    where: "United States",
  },
  {
    name: "Vercel",
    role: "Hosts rondva.com and app.rondva.com, runs the waitlist form, and renders report PDFs.",
    where: "United States and a global edge network",
  },
  {
    name: "Expo (650 Industries)",
    role: "Delivers updates to the app.",
    where: "United States",
  },
  {
    name: "Resend",
    role: "Sends email: the notice to us when someone joins the waitlist, and emails we send to you.",
    where: "United States (sending from the EU)",
  },
  {
    name: "Apple and Google",
    role: "Sign-in with your Apple or Google account, under their own privacy policies. Apple also takes App Store payments.",
    where: "United States",
  },
  {
    name: "Google Analytics and Meta",
    role: "Website analytics and ad measurement on rondva.com, only if you accept those cookies. Never in the app.",
    where: "United States",
  },
];

function ProcessorTable() {
  return (
    <div className="mt-4 overflow-x-auto rounded-card border border-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-paper-alt text-xs uppercase tracking-wider text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Provider</th>
            <th className="px-4 py-3 font-semibold">What it does for us</th>
            <th className="px-4 py-3 font-semibold">Where</th>
          </tr>
        </thead>
        <tbody>
          {processors.map((p) => (
            <tr key={p.name} className="border-t border-line align-top">
              <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
              <td className="px-4 py-3">{p.role}</td>
              <td className="px-4 py-3">{p.where}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const sections: LegalSection[] = [
  {
    id: "who",
    title: "Who is responsible",
    body: (
      <>
        <p>
          Rondva is built and operated by <strong>{R.company}</strong> (company registration no.{" "}
          {R.companyId}), {R.companyAddress}.
        </p>
        <ul className={list}>
          <li>
            For your Rondva account, the waitlist and this website, Vitvélar is the{" "}
            <strong>controller</strong>.
          </li>
          <li>
            For the inspections recorded in Rondva, the inspection company that uses Rondva is
            the controller, and Vitvélar processes that data on its behalf as a{" "}
            <strong>processor</strong> (see the{" "}
            <LegalLink href="/terms#data-processing">data processing terms</LegalLink>). If an
            inspector used Rondva to inspect your property, that inspector is the first place
            to ask about your data. We will help them answer.
          </li>
        </ul>
        <p>
          Questions about privacy go to <LegalLink href={mail}>{R.contactEmail}</LegalLink>.
        </p>
      </>
    ),
  },
  {
    id: "account",
    title: "Your account",
    body: (
      <>
        <p>
          You sign in to the app and to app.rondva.com with Apple or Google. The provider tells
          us your name, your email address, a stable account identifier and, with Google, a
          link to your profile picture. With Apple you can choose to share a private relay
          address instead of your real one. We never see your Apple or Google password. For
          security, our sign-in service records the time, IP address and browser or device of
          each sign-in.
        </p>
        <p>
          We also keep your company&apos;s details: its name, country, approval status and who
          its members are, and the report settings you choose (logo, company name, terms,
          report language). Your name is used as the inspector name on reports unless you
          change it.
        </p>
        <p>
          We use this to let you in, connect you to your company and put your company&apos;s
          name on its reports. The legal basis is the agreement with you or your company (GDPR
          art. 6(1)(b)) and, for sign-in security records, our legitimate interest in keeping
          accounts safe (art. 6(1)(f)).
        </p>
      </>
    ),
  },
  {
    id: "inspections",
    title: "Inspections in the app",
    body: (
      <>
        <p>An inspection in Rondva can contain:</p>
        <ul className={list}>
          <li>the property&apos;s address, postal code, municipality, property ID and details you enter;</li>
          <li>the client&apos;s name, the people present, the date and the weather;</li>
          <li>rooms, ratings, notes, observations and the severities you set;</li>
          <li>photos and thermal images, which can show people or their belongings;</li>
          <li>the report: AI-drafted text, your edits and the finished PDF.</li>
        </ul>
        <p>
          Everything is saved on your phone first and synced to your account, so it appears on
          app.rondva.com and is not lost with the phone. Other Rondva users can&apos;t read your
          inspections; that is enforced on our servers, not only in the app. The demo in the app stays on the phone and is never synced.
        </p>
        <p>
          The app asks for the camera to take inspection photos, and for your photo library
          only when you pick images to import. It does not use your device&apos;s location,
          contacts or microphone.
        </p>
      </>
    ),
  },
  {
    id: "ai",
    title: "AI-drafted reports",
    body: (
      <>
        <p>
          Nothing is sent to the AI service unless you confirm it. Each time you create a
          report with AI, the app shows what will be sent and asks you first. If you confirm,
          the inspection&apos;s address details, property details, client name, people
          present, date and weather, room ratings and notes, observation text and photos go to{" "}
          <strong>Anthropic</strong> (USA), which drafts the report text with its Claude models.
          Photos are shared as links that stop working after 10 minutes.
        </p>
        <p>
          Anthropic processes the data for us under its commercial terms and keeps it for a
          limited time under its own retention policy. We don&apos;t use your content to train
          AI models. You can always create the report without AI instead, and then nothing is
          sent to Anthropic.
        </p>
        <p>
          For each AI draft we keep a small record (time, which inspection, whether it used a
          report credit) so we can count free and paid reports and prevent abuse. It contains
          none of the inspection content.
        </p>
      </>
    ),
  },
  {
    id: "dashboard",
    title: "The web dashboard",
    body: (
      <>
        <p>
          app.rondva.com shows the inspections synced from your app and lets you edit reports.
          Staying signed in uses a session cookie that is strictly necessary for the dashboard
          to work. Report PDFs are rendered on our servers from the report and its photos and
          stored in your account.
        </p>
        <p>
          If your company has connected its own Google Drive archive, reports you choose to
          send there are stored in that Drive, under your company&apos;s control.
        </p>
      </>
    ),
  },
  {
    id: "purchases",
    title: "Purchases",
    body: (
      <>
        <p>
          When paid plans are offered in the app, you buy them through the App Store. Apple
          handles the payment; we never see your card details. Apple tells us what was bought,
          when, a transaction identifier and whether it is active, refunded or expired, and we
          link that to your company to give it report credits. We keep these records for as
          long as accounting law requires (seven years in Iceland).
        </p>
      </>
    ),
  },
  {
    id: "technical",
    title: "Technical data and app updates",
    body: (
      <>
        <p>
          The app downloads updates from Expo. Each update check sends a random installation
          identifier that the app stores on your phone, your platform and app version and, if
          the app crashed the last time it ran, the error message. Our hosting providers
          process IP addresses and request logs to run and protect the service.
        </p>
        <p>
          The app contains no analytics, advertising or tracking tools, and we don&apos;t track
          you across other companies&apos; apps or websites.
        </p>
      </>
    ),
  },
  {
    id: "waitlist",
    title: "The waitlist",
    body: (
      <>
        <p>When you join the waitlist on rondva.com we store:</p>
        <ul className={list}>
          <li>
            <strong>Email address</strong> — so we can write to you when Rondva is ready for you
            to try.
          </li>
          <li>
            <strong>Country you inspect in</strong> — so we know which markets to open first and
            which to contact first.
          </li>
          <li>
            <strong>Technical details of the submission</strong> — the time, your
            browser&apos;s user-agent string, and a one-way hash of your IP address. We use
            these only to detect abuse and duplicate submissions. The hash cannot be turned
            back into your IP address.
          </li>
        </ul>
        <p>
          The legal basis is our legitimate interest in building a product with the people who
          asked to hear about it (GDPR art. 6(1)(f)), and, for the email we send you, your
          request to be contacted. We do not use the list for a newsletter, a drip campaign,
          advertising, or profiling, and we do not sell or share it.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies on rondva.com",
    body: (
      <>
        <p>
          One essential cookie remembers your cookie choice. Analytics (Google Analytics 4) and
          marketing cookies (Meta and Google ad measurement) are set only if you accept them in
          the banner, and you can withdraw that at any time. We also use Vercel Web Analytics,
          which sets no cookies and stores no identifier about you. Details, names and
          lifetimes are on the <LegalLink href="/cookies">cookie page</LegalLink>.
        </p>
      </>
    ),
  },
  {
    id: "processors",
    title: "Who processes the data",
    body: (
      <>
        <p>We keep the list of providers short:</p>
        <ProcessorTable />
        <p>
          Each of these acts as a processor under a data-processing agreement, except Apple
          and Google for sign-in and payment, which act under their own terms. Where a
          provider is outside the EEA, transfers rest on the EU Standard Contractual Clauses.
          We don&apos;t sell personal data and don&apos;t share it with anyone else, unless the
          law requires us to.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <>
        <ul className={list}>
          <li>
            <strong>Account, company and inspections:</strong> while the account is active. When
            you or your company close the account, we delete it along with the inspections,
            photos and reports stored with it. Copies can remain in our encrypted backups until
            those expire on the normal backup cycle.
          </li>
          <li>
            <strong>Purchase records:</strong> as long as accounting law requires (seven years in
            Iceland).
          </li>
          <li>
            <strong>On your phone:</strong> until you delete the inspection or remove the app.
          </li>
          <li>
            <strong>Waitlist:</strong> until Rondva launches and we have written to you, or until
            you ask us to remove you, whichever comes first. If Rondva does not launch, the list
            is deleted. Entries that never lead to an account are deleted no later than 24
            months after they were submitted.
          </li>
        </ul>
        <p>
          How to close your account is on the{" "}
          <LegalLink href="/support#delete-account">support page</LegalLink>.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>
          You can ask to see what we hold about you, have it corrected or deleted, restrict or
          object to its use, or receive a copy in a portable format. Write to{" "}
          <LegalLink href={mail}>{R.contactEmail}</LegalLink>. To leave the waitlist, you can
          also reply to any email from us. We reply within one month, as the law requires.
        </p>
        <p>
          If your data is in an inspection someone else recorded, we pass your request to the
          inspection company that controls it and help it answer.
        </p>
        <p>
          If you think we have handled your data incorrectly you can complain to the Icelandic
          Data Protection Authority (Persónuvernd,{" "}
          <LegalLink href="https://www.personuvernd.is">personuvernd.is</LegalLink>) or to the
          supervisory authority in your own country.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: (
      <>
        <p>
          We update this page when Rondva or our providers change. For changes that matter, we
          also tell account holders by email or in the app. The date below is the last revision.
        </p>
      </>
    ),
  },
];

export default function RondvaPrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="How we handle your data in Rondva"
      intro={
        <p>
          Short version: you sign in with Apple or Google, and your inspections are stored on
          your phone and in your account. Nothing goes to the AI service unless you confirm it
          for that report. The app has no advertising or tracking, we don&apos;t sell data, and
          you can have your account deleted.
        </p>
      }
      sections={sections}
      revised="30 September 2026"
      toc
    />
  );
}
