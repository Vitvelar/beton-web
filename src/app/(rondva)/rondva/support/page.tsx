import type { Metadata } from "next";
import { BRANDS } from "@/lib/brand";
import {
  RONDVA_TRIAL,
  RONDVA_PACK,
  RONDVA_PLANS,
  RONDVA_PRICE_NOTE,
  usd,
} from "@/lib/rondva-pricing";
import { LegalLink, LegalPage, type LegalSection } from "@/components/rondva/LegalPage";

// rondva.com/support — support-slóð Rondva-appsins (App Store Connect og
// lib/brand.ts í beton-app vísa hingað). Akkerin (#delete-account o.fl.) eru
// hluti af samningnum við appið: ekki endurnefna þau.
// 2026-10-07 (appið 1.3.0 í App Review): kaup í appi eru seld (Stillingar → Plan & billing),
// eyðing reiknings er í appinu (Stillingar → Delete account; delete-account í beton-app,
// docs/release/ACCOUNT_DELETION.md §8), og veðurútfylling er í Rondva-byggingunni. Engin
// eyðublöð: samband er tölvupóstur (rondva@rondva.com). Heiti hnappa eru úr lib/i18n/catalog.ts.

export const metadata: Metadata = {
  title: "Support",
  description:
    "Help with the Rondva app and dashboard: signing in, company access, AI-drafted reports, weather on the report, free reports and pricing, subscriptions, restoring purchases and refunds, deleting your account, and how to reach us by email.",
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
          Rondva accounts belong to companies, including one-person firms. The first time you
          sign in, the app asks you to register your company: its name, its country and, if
          you like, a website. Some new companies are reviewed before access opens. Until
          your company has been approved, the app tells you that access isn&apos;t active yet,
          and we let you know as soon as it is. Not sure where your company stands? Write to
          us.
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
    id: "weather",
    title: "Weather on the report",
    body: (
      <>
        <p>
          On the day of the inspection, if the weather field is empty, Rondva fills it in with
          a short forecast for the property, such as &ldquo;Fair, 12 °C, light wind&rdquo;. You can
          also tap the weather button yourself. It needs a suburb or town
          or a postcode, and your company&apos;s country (which you chose when you registered).
          If the place can&apos;t be found, add the suburb or city or the postcode, or type
          the weather in.
        </p>
        <p>
          It is a forecast, not a measurement at the property, so check it and change it if
          conditions were different. Only the suburb or town, postcode and country are
          used to find the place; the street address is not sent anywhere. Rondva never asks
          for your phone&apos;s location. What is sent, and to whom, is in the{" "}
          <LegalLink href="/privacy#weather">privacy policy</LegalLink>. Weather data from MET
          Norway (CC BY 4.0). Location data: GeoNames (CC BY 4.0),{" "}
          <LegalLink href="https://www.geonames.org">geonames.org</LegalLink>.
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
          <strong>First month free:</strong> every new company gets{" "}
          <strong>{RONDVA_TRIAL.freeReports} AI-drafted reports free for its first {RONDVA_TRIAL.days} days</strong>,
          counted from the day its company account is activated, whichever runs out first. No
          card is needed and nothing is charged when the month ends. The free month is given once
          per company and per sign-in. One report covers the first AI draft for an inspection plus
          up to 2 AI revisions of it. Editing text by hand, exporting again, and creating a report
          without AI never use up a report.
        </p>
        <p>
          Paid plans are bought inside the Rondva iPhone app (version 1.3.0 and later), through
          the App Store, under <strong>Settings &rarr; Plan &amp; billing</strong>. Nothing can
          be bought on this website, and plans can be bought once your company account is
          active.
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
          re-exports, and your company branding. {RONDVA_PRICE_NOTE} Reports are used in this
          order: reports from your free first month first, then your plan&apos;s reports for the
          month (they don&apos;t carry over), then report packs. When the free month ends or you
          run out, the app offers plans and packs.
          Your existing reports stay available to view, edit and export. If something looks
          wrong with your reports or a purchase, write to us.
        </p>
      </>
    ),
  },
  {
    id: "subscriptions",
    title: "Subscriptions, restoring purchases and refunds",
    body: (
      <>
        <p>
          <strong>Restore purchases.</strong> On a new phone, or after reinstalling the app,
          sign in with the same Rondva account, then go to{" "}
          <strong>Settings &rarr; Plan &amp; billing &rarr; Restore purchases</strong>. This
          checks your subscription with Apple again. Report packs belong to your Rondva
          account and are already there. A purchase can only be used in the Rondva account it
          was bought with: if the app says a purchase belongs to another account, sign in with
          that one.
        </p>
        <p>
          <strong>Manage or cancel a subscription.</strong> In the app, open{" "}
          <strong>Settings &rarr; Plan &amp; billing &rarr; Manage subscription</strong>, or
          on the iPhone go to <strong>Settings</strong>, tap your name, then{" "}
          <strong>Subscriptions</strong>, and choose Rondva. Cancel at least 24 hours before
          the period ends to avoid the next charge. You keep the plan&apos;s reports until the
          period ends, and report packs are not affected. To change plan, use the same
          screen: moving up to Pro starts straight away, and moving down to Solo takes effect
          when the current period ends.
        </p>
        <p>
          <strong>Refunds.</strong> Apple handles payments and refunds. Request a refund at{" "}
          <LegalLink href="https://reportaproblem.apple.com">reportaproblem.apple.com</LegalLink>.
          If Apple refunds a purchase, the unused reports from it are taken back.
        </p>
        <p>
          <strong>Charged, but no reports?</strong> Wait a minute, reopen{" "}
          <strong>Plan &amp; billing</strong> and tap <strong>Restore purchases</strong>. If the
          reports are still missing, write to us with the email address you sign in with, the
          date, and the order number from Apple&apos;s receipt email. Never send card details
          or your Apple ID password.
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
          You can delete your Rondva account in the app:{" "}
          <strong>Settings &rarr; Delete account</strong> (or, if your company hasn&apos;t been
          approved yet, <strong>Delete account</strong> at the bottom of the screen you see
          after signing in). The app asks you to confirm twice. This permanently deletes your
          account and everything in it &mdash; inspections, photos, reports and PDFs, your
          company logo and, if you are the only member, your company profile &mdash; from our
          servers and from the phone you delete it on. It can&apos;t be undone, so save or share
          any reports you want to keep first. If you signed in with Apple, we also ask Apple to
          revoke Rondva&apos;s access to your Apple ID.
        </p>
        <p>
          <strong>Have a subscription?</strong> Deleting your account does not cancel it. Cancel
          it first in <strong>Settings &rarr; Plan &amp; billing &rarr; Manage subscription</strong>{" "}
          or in your iPhone&apos;s Subscriptions settings (see above), or Apple keeps charging
          you.
        </p>
        <p>
          Some accounts can&apos;t be deleted in the app: accounts managed by a partner company,
          and accounts with purchase records that we are required to keep. If that is yours, or
          you can no longer use the app, write to{" "}
          <LegalLink href={mail}>{R.contactEmail}</LegalLink> from the email address you sign in
          with and we will close the account and confirm when it is done. If you use
          Apple&apos;s Hide My Email, tell us that you signed in with Apple and the date you
          started.
        </p>
        <p>
          <strong>What stays:</strong> Apple purchase records, which we keep as accounting
          records but no longer link to you; a usage record for each AI draft (date, model,
          cost), with no inspection content; encrypted backups, which expire on the normal
          backup cycle; copies on other devices where you were signed in, until you remove the
          app there; and reports you already exported or sent to clients. If your company has
          other members, the company and its data stay, and only your own membership is
          removed. The waitlist is separate: ask us to remove you.
        </p>
        <p>
          If you signed in with Apple, you can also stop using Apple sign-in for Rondva on your
          iPhone under <strong>Settings &rarr; your name &rarr; Sign in with Apple</strong>. That
          alone doesn&apos;t delete the data in your Rondva account. The details are in the{" "}
          <LegalLink href="/privacy#deletion">privacy policy</LegalLink>.
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
      revised="8 October 2026"
    >
      <div className="mt-10 rounded-card border border-line bg-paper p-6 shadow-[0_24px_60px_-40px_rgba(16,20,24,0.25)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Contact</p>
        <p className="mt-3 text-lg font-semibold">
          <a href={mail} className="underline underline-offset-4 hover:text-blue">
            {R.contactEmail}
          </a>
        </p>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          This is the way to reach us: there is no form to fill in, just an email. When you
          report a problem, tell us your iPhone model, the app version (shown in Settings),
          what you did and what happened. A screenshot helps. For a purchase, add the order
          number from Apple&apos;s receipt. Please don&apos;t send card numbers or passwords, and
          don&apos;t send inspection photos or client details unless we ask for them.
        </p>
        <p className="mt-4 text-sm text-muted">
          {R.company} · reg. no. {R.companyId} · {R.companyAddress}
        </p>
      </div>
    </LegalPage>
  );
}
