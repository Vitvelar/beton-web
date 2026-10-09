import type { Metadata } from "next";
import { BRANDS } from "@/lib/brand";
import {
  RONDVA_OFFER,
  RONDVA_PACK,
  RONDVA_PLANS,
  RONDVA_PRICE_NOTE,
  usd,
} from "@/lib/rondva-pricing";
import { faqPageLd } from "@/lib/rondva-seo";
import { LegalLink, LegalPage, type LegalSection } from "@/components/rondva/LegalPage";
import { JsonLd } from "@/components/rondva/JsonLd";

// rondva.com/support — support-slóð Rondva-appsins (App Store Connect og
// lib/brand.ts í beton-app vísa hingað). Akkerin (#delete-account o.fl.) eru
// hluti af samningnum við appið: ekki endurnefna þau.
// 2026-10-07 (appið 1.3.0 í App Review): kaup í appi eru seld (Stillingar → Plan & billing),
// eyðing reiknings er í appinu (Stillingar → Delete account; delete-account í beton-app,
// docs/release/ACCOUNT_DELETION.md §8), og veðurútfylling er í Rondva-byggingunni. Engin
// eyðublöð: samband er tölvupóstur (rondva@rondva.com). Heiti hnappa eru úr lib/i18n/catalog.ts.

export const metadata: Metadata = {
  title: "Support and FAQ",
  description:
    "Answers about Rondva: NZS 4306 reports, working with no signal, what the AI does, where your photos are stored, pricing and tax invoices, adding a colleague, subscriptions and refunds, what happens if Rondva shuts down, and deleting your account.",
  alternates: { canonical: `${BRANDS.rondva.marketingUrl}/support` },
};

const R = BRANDS.rondva;
const mail = `mailto:${R.contactEmail}`;

// Hver kafli er spurning og byrjar á beinu svari (fyrsta setning). Sami texti fer í FAQPage JSON-LD,
// svo svarið sem vélarnar lesa er það sem notandinn sér. Akkerin (id) eru óbreytt og hluti af
// samningnum við appið.
const [solo, pro] = RONDVA_PLANS;
const ANSWERS: Record<string, string> = {
  "getting-started":
    "Download Rondva from the App Store, sign in with Apple or Google and register your company. The same account opens the web dashboard at app.rondva.com.",
  nzs4306:
    "Yes. For New Zealand pre-purchase inspections, Rondva drafts the report in NZS 4306:2005 order from your photos, notes, moisture readings and ratings. You review it, and the PDF goes out under your company name.",
  access:
    "Rondva accounts belong to companies, including one-person firms. The first time you sign in, the app asks you to register yours.",
  team:
    "Yes. We link your colleagues to one company account, usually within one working day of them emailing rondva@rondva.com.",
  inspections:
    "Add the property, the rooms you walk, a rating for each area and an observation for each finding, with photos and a severity that you choose.",
  offline:
    "Yes. Everything you record is saved on your phone first, so you can keep inspecting with no signal, for example under the house or in the roof space. It syncs when you are back online.",
  weather:
    "Yes. If the weather field is empty on the day of the inspection, Rondva fills it in with a short forecast for the property, which you can check and change.",
  reports:
    "The AI drafts the report text and a summary from your notes, ratings and photos. The severities stay the ones you set, and Rondva asks you each time before anything is sent to the AI service.",
  pricing: `Solo is ${usd(solo.price)} a month for ${solo.reports} AI-drafted reports and Pro is ${usd(pro.price)} a month for ${pro.reports}; a report pack adds ${RONDVA_PACK.reports} reports for ${usd(RONDVA_PACK.price)}. You buy in the app, through the App Store.`,
  "tax-invoice":
    "Apple is the seller of record, so your receipt comes from Apple: you find it in your Apple purchase history and in the receipt email Apple sends after each charge. Need a GST/VAT invoice addressed to your company? Email rondva@rondva.com.",
  subscriptions:
    "In the app, open Settings, then Plan & billing, then Manage subscription, or open Subscriptions in your iPhone's Settings. Apple handles payments, cancellations and refunds.",
  language:
    "The app is in English and Icelandic, and the language your reports are written in is a company setting.",
  "delete-account":
    "Yes, in the app: Settings, then Delete account. It permanently deletes your account and everything in it.",
  "data-location":
    "In the European Union (Ireland). Our database and file storage, which hold your photos and reports, are there.",
  shutdown:
    "We would tell you at least 60 days in advance, so you can export your reports.",
};

// Svarið sem fyrsta málsgrein kaflans; netfangið verður tengill (textinn er óbreyttur).
function Lead({ id }: { id: string }) {
  const parts = ANSWERS[id].split(R.contactEmail);
  return (
    <p className="font-medium text-ink">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 ? <LegalLink href={mail}>{R.contactEmail}</LegalLink> : null}
        </span>
      ))}
    </p>
  );
}

const sections: LegalSection[] = [
  {
    id: "getting-started",
    title: "How do I get started with Rondva?",
    body: (
      <>
        <Lead id="getting-started" />
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
    id: "nzs4306",
    title: "Does Rondva write NZS 4306 reports?",
    body: (
      <>
        <Lead id="nzs4306" />
        <p>
          The NZS 4306 report has a Certificate of Inspection for you to sign, the areas
          inspected and not inspected, your limitations, a table of moisture readings, a note
          on gradual deterioration and maintenance, and a note that AI was used. You pick the
          rating for each area, and the AI cannot change it. You are responsible for the
          content before you issue the report; see{" "}
          <a href="#reports" className="underline underline-offset-4">what the AI does</a>.
        </p>
        <p>
          Read more on the{" "}
          <LegalLink href="/nz">New Zealand NZS 4306 page</LegalLink>.
        </p>
      </>
    ),
  },
  {
    id: "access",
    title: "How do company accounts and access work?",
    body: (
      <>
        <Lead id="access" />
        <p>
          You register your company&apos;s name, its country and, if you like, a website. Some new companies are reviewed before access opens. Until
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
    id: "team",
    title: "More than one inspector?",
    body: (
      <>
        <Lead id="team" />
        <ol className="list-decimal space-y-1 pl-5">
          <li>Each inspector installs Rondva and signs in with Apple or Google.</li>
          <li>
            Each one <strong>stops at the company screen</strong> and emails the address they
            signed in with to{" "}
            <LegalLink href={mail}>{R.contactEmail}</LegalLink>.
          </li>
          <li>We link everyone to one company account, usually within one working day.</li>
        </ol>
        <p>
          You share the plan, the report credits, your logo and your terms. Each inspector sees
          only their own inspections. Self-serve team invites are coming.
        </p>
      </>
    ),
  },
  {
    id: "inspections",
    title: "How do I record an inspection?",
    body: (
      <>
        <Lead id="inspections" />
        <p>
          Thermal images can be imported from your photo library, for example from a thermal
          camera&apos;s own app.
        </p>
      </>
    ),
  },
  {
    id: "offline",
    title: "Does it work with no signal?",
    body: (
      <>
        <Lead id="offline" />
        <p>
          Once you are back online it syncs to your account and appears on app.rondva.com.
          Recording never needs a connection; creating an AI draft does.
        </p>
      </>
    ),
  },
  {
    id: "weather",
    title: "Does Rondva fill in the weather?",
    body: (
      <>
        <Lead id="weather" />
        <p>
          The forecast reads like &ldquo;Fair, 12 °C, light wind&rdquo;. You can also tap the
          weather button yourself. It needs a suburb or town
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
    title: "What does the AI do in a report?",
    body: (
      <>
        <Lead id="reports" />
        <p>
          Rondva shows exactly what will be sent before you confirm. You can also choose to
          create the report without AI.
        </p>
        <p>
          Read the draft and change anything you like, on app.rondva.com, in any browser,
          including your phone&apos;s, and export it as a PDF (or a Word file from the app). Nothing is sent to your client
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
    title: "How much does Rondva cost?",
    body: (
      <>
        <Lead id="pricing" />
        <p>
          <strong>Founding offer:</strong> until {RONDVA_OFFER.endsOn}, every company gets{" "}
          <strong>{RONDVA_OFFER.freeReportsPerMonth} AI-drafted reports free every month</strong>.
          No card is needed. One report covers the first AI draft for an inspection plus up to 2
          AI revisions of it. Editing text by hand, exporting again, and creating a report
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
          order: free reports first, then your plan&apos;s reports for the month (they don&apos;t
          carry over), then report packs. When you run out, the app offers plans and packs.
          Your existing reports stay available to view, edit and export. If something looks
          wrong with your reports or a purchase, write to us.
        </p>
      </>
    ),
  },
  {
    id: "tax-invoice",
    title: "Do I get a tax invoice?",
    body: (
      <>
        <Lead id="tax-invoice" />
      </>
    ),
  },
  {
    id: "subscriptions",
    title: "How do I cancel, restore purchases or get a refund?",
    body: (
      <>
        <Lead id="subscriptions" />
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
    title: "Which languages does Rondva support?",
    body: (
      <>
        <Lead id="language" />
        <p>
          Change the app language under <strong>Settings → Language</strong>. The report
          language is a company setting, which you&apos;ll find under <strong>Settings</strong>{" "}
          on app.rondva.com.
        </p>
      </>
    ),
  },
  {
    id: "delete-account",
    title: "Can I delete my account and data?",
    body: (
      <>
        <Lead id="delete-account" />
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
          removed. Anything you sent us by email is separate: ask us to remove it.
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
    id: "data-location",
    title: "Where are my photos stored?",
    body: (
      <>
        <Lead id="data-location" />
        <p>
          When you create a report with AI and confirm it, the inspection&apos;s notes,
          ratings and photos go to Anthropic in the United States to draft the text; photos are
          shared as links that stop working after 10 minutes, and we don&apos;t use your content
          to train AI models. If you create the report without AI, nothing is sent to Anthropic.
          The details are in the <LegalLink href="/privacy#ai">privacy policy</LegalLink>.
        </p>
      </>
    ),
  },
  {
    id: "shutdown",
    title: "What happens if Rondva shuts down?",
    body: (
      <>
        <Lead id="shutdown" />
        <p>
          See <LegalLink href="/terms#availability">Availability in the terms</LegalLink>.
          Because the app saves your work on the phone first, you can usually keep recording
          while our servers are down.
        </p>
      </>
    ),
  },
  {
    id: "privacy",
    title: "How is my data handled, and how do I report a security problem?",
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

// FAQPage: spurning (heiti kaflans) + sami svartexti og sést í kaflanum. Kaflar án svars (privacy) fylgja ekki með.
const FAQ = sections.filter((s) => ANSWERS[s.id] && s.id !== "privacy").map((s) => ({ q: s.title, a: ANSWERS[s.id] }));

export default function RondvaSupportPage() {
  return (
    <>
    <JsonLd nodes={[faqPageLd(FAQ)]} />
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
      revised="9 October 2026"
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
    </>
  );
}
