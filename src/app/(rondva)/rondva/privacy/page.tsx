import type { Metadata } from "next";
import { BRANDS } from "@/lib/brand";
import { LegalLink, LegalPage, type LegalSection } from "@/components/rondva/LegalPage";

// rondva.com/privacy — persónuverndarstefna Rondva: vefur, biðlisti, stjórnborð og
// iOS-appið. Byggð á beton-app docs/release/PRIVACY_DATA_INVENTORY.md (gagnaflæði
// sannreynt í kóða) og samræmd við App Privacy-svör Rondva. Engar fastar
// geymslutímalengdir nema þær sem eru ákveðnar (biðlisti 24 mán., bókhald 7 ár).
// Akkerin (#processors o.fl.) eru notuð af /terms og appinu: ekki endurnefna.
// 2026-10-09: nýr kafli „Business contacts we write to“ (#business-contacts) — GDPR art. 14 fyrir sölupóst á
// skoðunarmenn sem birta vinnunetfang í opinberum skrám (t.d. NZIBI). Texti úr plan/rondva/NZ-SOLUPOSTAR-UTGAFA.md
// §1.4–1.5 (hagsmunamat, 12 mán. geymsla, útilokunarlisti). Póstfóturinn vísar á rondva.com/privacy#business-contacts:
// EKKI endurnefna akkerið. Til yfirferðar lögfræðings (NZ „harvesting“-spurningin) áður en listinn stækkar umfram NZIBI.
// 2026-10-08: staðsetning fyrir veður kemur nú úr eigin töflu (GeoNames, CC BY 4.0) í gagnagrunni okkar í ESB
// í stað OpenStreetMap Nominatim; aðeins hnit námunduð í ~100 m fara til MET Norway (beton-app PR #45).
// 2026-10-07 (OPS-14, til yfirferðar lögfræðings): veðurþjónusta (MET Norway; áður einnig Nominatim),
// Apple-kaup og skráning fyrirtækis. Heimildir: beton-app supabase/functions/weather-lookup
// (README + weather.ts), supabase/migrations/20261007120000_apple_in_app_purchases.sql,
// src/lib/onboarding.ts (vefsíða fyrirtækis er geymd á notandanum, aðeins til yfirferðar).
// 2026-10-07 (appið 1.3.0 í App Review): bætt við lagagrunnum, eyðingu reiknings í appinu
// (ACCOUNT_DELETION.md §2/§8: hvað er eytt og hvað helst), alþjóðlegum flutningi, börnum,
// NZ Privacy Act 2020 og tölvupósti til aðstoðar. Heimildir: beton-app origin/main
// (docs/release/ACCOUNT_DELETION.md, IN_APP_PURCHASES.md, PRIVACY_DATA_INVENTORY.md;
// supabase/functions/delete-account, apple-purchase, weather-lookup). Appið notar enga
// staðsetningarheimild (app.json/app.config.ts: aðeins myndavél og myndasafn).

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
    name: "MET Norway (Norwegian Meteorological Institute)",
    role: "Gives the weather forecast for the inspection's location. Receives only coordinates rounded to about 100 metres.",
    where: "Norway",
  },
  {
    name: "Resend",
    role: "Sends email: the notice to us when someone joins the waitlist, and emails we send to you.",
    where: "United States (sending from the EU)",
  },
  {
    name: "Apple and Google",
    role: "Sign-in with your Apple or Google account, under their own privacy policies. Apple also takes App Store payments and sends us signed records of in-app purchases. Google also hosts our email, so messages you send to us pass through Google Workspace.",
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
            For your Rondva account, the waitlist, this website and the{" "}
            <LegalLink href="#business-contacts">business contacts we write to</LegalLink>,
            Vitvélar is the <strong>controller</strong>.
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
          When you register a company in the dashboard, we ask for the company name, the
          country and, if you want to give it, a website. The name and country create the
          company and set its defaults, such as the report language and rating scheme. The
          website is optional; we save it with your account and may use it to check that the
          company is genuine when we review a new registration. It never changes what you can
          access.
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
    id: "weather",
    title: "Weather auto-fill",
    body: (
      <>
        <p>
          In the Rondva app the weather field of an inspection can fill itself in. This happens
          when you create the inspection, or open its details, on the day of the inspection and
          the weather field is still empty, or when you tap the weather button. You can always
          change the text or type the weather yourself.
        </p>
        <p>To work out the weather, the app asks our server, and our server then:</p>
        <ul className={list}>
          <li>
            looks up the place in our own database, in the European Union, using only the town or
            suburb, the postcode and your company&apos;s country. The database is built from the
            open data of <strong>GeoNames</strong>. The street address is not used for this and
            is not sent anywhere. The lookup gives the coordinates of the postcode area or
            suburb, not of the building;
          </li>
          <li>
            sends those coordinates, rounded to about 100 metres, to <strong>MET Norway</strong>{" "}
            (the Norwegian Meteorological Institute), which returns its forecast. We pick the
            hour that matches the inspection and turn it into a short text such as &ldquo;Fair,
            12 °C, light wind&rdquo;.
          </li>
        </ul>
        <p>
          Nothing else is sent: not the street address, not your name, email address or account
          details, not the client&apos;s name, and no notes or photos. The request comes from our
          server, so MET Norway sees our server&apos;s IP address and not your phone&apos;s. The
          app does not use your phone&apos;s location for this, only the town or suburb and
          postcode you entered.
        </p>
        <p>
          The only thing saved is the short weather text, in the inspection&apos;s weather field.
          The coordinates are not saved with the inspection, and the address and the place
          looked up are not written to our logs. The place table holds only public geographic
          data and no personal data.
        </p>
        <p>
          Weather data from MET Norway, licensed under{" "}
          <LegalLink href="https://api.met.no/doc/License">CC BY 4.0</LegalLink>. Location data:
          GeoNames (<LegalLink href="https://www.geonames.org">geonames.org</LegalLink>). This work
          includes data from GeoNames, licensed under{" "}
          <LegalLink href="https://creativecommons.org/licenses/by/4.0/">
            Creative Commons Attribution 4.0
          </LegalLink>
          . The data is provided as is, without a guarantee of accuracy.
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
          Rondva does not send your reports to Google Drive or any other storage service. When
          you export or share a report, it goes where you send it, and what happens to it
          after that is up to you and your company.
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
          processes the payment under its own terms; we never see your card details or Apple
          ID.
        </p>
        <p>
          For each purchase Apple gives us a digitally signed record, through the app and as
          notices from Apple&apos;s servers about renewals and refunds, and our server checks
          Apple&apos;s signature before using it. The record contains the product, the purchase
          and expiry dates, transaction identifiers, the store country and price, and whether
          the purchase renewed, expired or was refunded. The app gives Apple a random purchase
          identifier, not your account ID, so the record can be matched to your account.
        </p>
        <p>
          We link the record to the account that made the purchase and to its company, and use
          it to give the company its report credits, and to take back unused credits if Apple
          refunds the purchase. We keep these records as accounting records for as long as
          accounting law requires (seven years in Iceland), even if the account is later
          deleted. If the account is deleted, these records stay but are no longer linked to
          your account or company. The legal basis is the agreement with your company (GDPR
          art. 6(1)(b)) and our legal duty to keep accounting records (art. 6(1)(c)).
        </p>
        <p>
          When you tap <strong>Restore purchases</strong>, the app asks Apple for your current
          subscription and sends the signed record to us in the same way. Deleting your account
          does not cancel an App Store subscription: cancel it first in your Apple account
          settings, or Apple keeps charging you.
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
    id: "business-contacts",
    title: "Business contacts we write to",
    body: (
      <>
        <p>
          <strong>Who we are.</strong> {R.company} (company registration no. {R.companyId}),{" "}
          {R.companyAddress}, makes Rondva and is the controller for this section. Contact:{" "}
          <LegalLink href={mail}>{R.contactEmail}</LegalLink>.
        </p>
        <p>
          <strong>Who we write to.</strong> Building inspectors who publish a work email address
          in a public register or on their company&apos;s own website, for example the New
          Zealand Institute of Building Inspectors directory (nzibi.co.nz). We write to them
          about Rondva, because it is a tool for exactly their job. This is a short series of
          up to three emails, not a newsletter. The emails carry no tracking pixels and no
          tracked links.
        </p>
        <p>
          <strong>What we hold.</strong> Your name, your work email address, your company&apos;s
          name and website as published, where we found them, and a note of when we wrote and
          whether you replied or asked us to stop. Nothing else. We use it only to write to you
          about Rondva, we don&apos;t sell or share it, and we don&apos;t build a profile of
          you. We send and store the emails with Google Workspace (see{" "}
          <LegalLink href="#processors">Who processes the data</LegalLink>).
        </p>
        <p>
          <strong>Why we may do this.</strong> Our legitimate interest in telling professionals
          about a product made for their work (GDPR art. 6(1)(f)). We weighed it against your
          interests: we write to a work address that is published for business contact,
          the intrusion is small, you can stop it with one reply, and an inspector can
          reasonably expect an email about tools for inspections. You can object at any time
          (see below).
        </p>
        <p>
          <strong>How long we keep it.</strong> For 12 months after our last email to you, unless
          we start talking, and then we handle it as described under{" "}
          <LegalLink href="#contacting-us">When you write to us</LegalLink>. If you ask us to
          stop, we keep your email address and nothing else on a do-not-contact list so that we
          never write to you again. That is the one thing we keep beyond 12 months, and only
          to respect your request.
        </p>
        <p>
          <strong>Stop, object or ask what we hold.</strong> Reply &ldquo;unsubscribe&rdquo; to any of our
          emails, or write to <LegalLink href={mail}>{R.contactEmail}</LegalLink>, and we remove
          you straight away and don&apos;t write again. You can also ask us what we hold about
          you, have it corrected or deleted, or object to our using it. Objecting to direct
          marketing always succeeds. We reply within one month.
        </p>
        <p>
          <strong>Complaints.</strong> You can complain to the Icelandic Data Protection Authority
          (Persónuvernd,{" "}
          <LegalLink href="https://www.personuvernd.is">personuvernd.is</LegalLink>), which
          supervises us, or to the supervisory authority in your own country. If you are in New
          Zealand, you can also contact the{" "}
          <LegalLink href="https://www.privacy.org.nz">
            Office of the Privacy Commissioner
          </LegalLink>
          .
        </p>
      </>
    ),
  },
  {
    id: "contacting-us",
    title: "When you write to us",
    body: (
      <>
        <p>
          If you email <LegalLink href={mail}>{R.contactEmail}</LegalLink> we keep your message,
          your email address and our replies so we can help you and follow up. We keep them for
          as long as we need to resolve the matter and handle any follow-up. Please don&apos;t
          send inspection photos or client details unless we ask for them. The legal basis is
          our legitimate interest in answering you (GDPR art. 6(1)(f)), or the agreement with
          you or your company when your message is about your account.
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
    id: "legal-bases",
    title: "Why we may use your data",
    body: (
      <>
        <p>Under the GDPR we need a legal basis for each purpose. In plain terms:</p>
        <ul className={list}>
          <li>
            <strong>Your account, your company&apos;s details and signing in:</strong> the
            agreement with you or your company (art. 6(1)(b)). Sign-in security records: our
            legitimate interest in keeping accounts safe (art. 6(1)(f)).
          </li>
          <li>
            <strong>Inspections, photos, reports, AI drafting and the weather auto-fill:</strong>{" "}
            for these we act for your inspection company as its processor. The company decides
            why it records the data and on what basis, usually its agreement with its own
            client. Sending anything to the AI service also needs your explicit confirmation
            in the app each time.
          </li>
          <li>
            <strong>Purchases:</strong> the agreement with your company (art. 6(1)(b)) and our
            legal duty to keep accounting records (art. 6(1)(c)).
          </li>
          <li>
            <strong>The waitlist and your emails to us:</strong> our legitimate interest
            (art. 6(1)(f)), as described in those sections.
          </li>
          <li>
            <strong>Business contacts we write to:</strong> our legitimate interest in telling
            inspectors about a tool for their work (art. 6(1)(f)), as described in{" "}
            <LegalLink href="#business-contacts">that section</LegalLink>. You can object at any
            time.
          </li>
          <li>
            <strong>Hosting logs and abuse prevention:</strong> our legitimate interest in
            running and protecting the service (art. 6(1)(f)).
          </li>
          <li>
            <strong>Analytics and marketing cookies on rondva.com:</strong> your consent
            (art. 6(1)(a)), which you can withdraw at any time.
          </li>
        </ul>
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
          and Google for sign-in and payment, and MET Norway for the weather auto-fill, which is
          a public service that acts under its own terms of use. We don&apos;t sell personal data and don&apos;t share it with anyone else,
          unless the law requires us to.
        </p>
      </>
    ),
  },
  {
    id: "transfers",
    title: "Data moving between countries",
    body: (
      <>
        <p>
          Our database and file storage are in the European Union (Ireland). Some providers
          process data elsewhere, mainly in the United States (see the table). Where personal
          data goes to a country outside the EEA that the European Commission has not found to
          offer adequate protection, the transfer rests on the EU Standard Contractual Clauses.
          Norway is in the EEA, and the European Commission has found the United Kingdom
          adequate.
        </p>
        <p>
          The weather service is the exception: MET Norway is a public service we have no
          contract with. It receives only coordinates rounded to about 100 metres, never an
          address, a name or account details, and it is bound only by its own terms of use.
        </p>
        <p>
          <strong>If you are in New Zealand:</strong> your information is held by Vitvélar in
          Iceland and in our providers&apos; systems in Ireland and the United States. We send
          it abroad to providers that are bound by a contract with us to protect it, and to
          Apple and Google for the sign-in and payments you choose to use with them. The
          exception is the weather auto-fill above: the public weather service (MET Norway)
          may not be required to protect location data in a way that is comparable to the New
          Zealand Privacy Act 2020. It receives only coordinates rounded to about 100 metres,
          not the property&apos;s address, and only on the day of the inspection while the
          weather field is empty or when you tap the weather button.
        </p>
      </>
    ),
  },
  {
    id: "deletion",
    title: "Deleting your account",
    body: (
      <>
        <p>
          You can delete your account in the app: <strong>Settings &rarr; Delete account</strong>{" "}
          (or, if your company has not been approved yet, <strong>Delete account</strong> at the
          bottom of the screen you see after signing in). The app asks you to confirm twice. It
          can&apos;t be undone, so save or share any reports you want to keep first.
        </p>
        <p>
          <strong>What is deleted</strong> from our servers: your sign-in account and its link
          to your Apple or Google sign-in; your inspections with their rooms, observations,
          photos and reports; the report PDFs and your company logo in our storage; and, if you
          are the only member of your company, the company profile and its report credits. On
          the phone you delete from, the app also removes its local copy. If you signed in with
          Apple, we also ask Apple to revoke Rondva&apos;s access to your Apple ID.
        </p>
        <p>
          <strong>What stays:</strong>
        </p>
        <ul className={list}>
          <li>
            Apple purchase records, as accounting records, no longer linked to your account or
            company (see Purchases).
          </li>
          <li>
            A usage record for each AI draft (date, AI model, cost). It contains no inspection
            content and, after deletion, no longer points to your account or company.
          </li>
          <li>
            If your company has other members, the company and its data stay; only your own
            membership is removed.
          </li>
          <li>Encrypted backups, until they expire on the normal backup cycle.</li>
          <li>
            Copies on other devices where you were signed in, until you remove the app from
            them, and reports you already exported or sent to clients.
          </li>
          <li>
            Text and photos already sent to Anthropic for a draft, which follow Anthropic&apos;s
            own retention policy.
          </li>
        </ul>
        <p>
          Accounts that are managed by a partner company, and accounts with purchase records
          made outside the App Store, can&apos;t be closed in the app; write to{" "}
          <LegalLink href={mail}>{R.contactEmail}</LegalLink> and we will close them. The
          waitlist is separate; ask us to remove you. Deleting your account does not cancel an
          App Store subscription. More on the{" "}
          <LegalLink href="/support#delete-account">support page</LegalLink>.
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
            you delete your account in the app, or ask us to close it, we delete it along with
            the inspections, photos and reports stored with it (see Deleting your account for
            what stays). Copies can remain in our encrypted backups until those expire on the
            normal backup cycle.
          </li>
          <li>
            <strong>Purchase records:</strong> as long as accounting law requires (seven years in
            Iceland), even if the account is deleted. They are then no longer linked to it.
          </li>
          <li>
            <strong>AI usage records</strong> (date, model, cost, whether a credit was used):
            kept as a usage history without inspection content.
          </li>
          <li>
            <strong>Weather lookups:</strong> the address and the coordinates are not stored.
            Only the short weather text stays in the inspection.
          </li>
          <li>
            <strong>Emails to us:</strong> as long as needed to resolve the matter and follow up.
          </li>
          <li>
            <strong>Business contacts we write to:</strong> 12 months after our last email, unless
            we start talking. If you ask us to stop, only your email address is kept, on a
            do-not-contact list, so we never write to you again.
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
          <strong>If you are in New Zealand,</strong> you can ask us for the personal
          information we hold about you and ask us to correct it, as the Privacy Act 2020
          allows (information privacy principles 6 and 7). Write to the same address. If we
          can&apos;t resolve a concern, you can complain to the{" "}
          <LegalLink href="https://www.privacy.org.nz">
            Office of the Privacy Commissioner
          </LegalLink>
          .
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
    id: "children",
    title: "Children",
    body: (
      <>
        <p>
          Rondva is a tool for professionals and their companies. It is not intended for anyone
          under 18, and we don&apos;t knowingly collect personal data from children. An
          inspection can still include photos or details of people who happen to be at a
          property, children among them; the inspection company is responsible for having the
          right to record that. If you think a child has given us personal data, or you want
          such data removed from an inspection, write to{" "}
          <LegalLink href={mail}>{R.contactEmail}</LegalLink> and we will help delete it.
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
          for that report. The weather field can fill itself in from the town and postcode you entered,
          and only coordinates rounded to about 100 metres go to a public weather service. Payments go
          through Apple. The app has no advertising or tracking, we don&apos;t sell data, and
          you can delete your account in the app.
        </p>
      }
      sections={sections}
      revised="9 October 2026"
      toc
    />
  );
}
