import type { Metadata } from "next";
import { BRANDS } from "@/lib/brand";
import { breadcrumbLd, organizationLd } from "@/lib/rondva-seo";
import { JsonLd } from "@/components/rondva/JsonLd";
import { LegalLink, LegalPage, type LegalSection } from "@/components/rondva/LegalPage";

// rondva.com/guides/nzs-4306-pre-purchase-report: hlutlaus, vitnanleg grein (PROMPT-EFTIR-SAMTHYKKI §E lið 8).
// Staðreyndir eru úr opinberum lýsingum og neytendasíðum stjórnvalda (tenglar neðst); staðallinn sjálfur er
// ekki afritaður. Rondva er nefnt í einni stuttri málsgrein neðst. Aldrei „compliant/certified“.

const PATH = "/guides/nzs-4306-pre-purchase-report";
const PAGE_URL = `${BRANDS.rondva.marketingUrl}${PATH}`;
const TITLE = "What an NZS 4306:2005 pre-purchase inspection report covers";
const DESCRIPTION =
  "A neutral guide to NZS 4306:2005, the New Zealand standard for residential property inspections: what the standard covers, the sections a pre-purchase report usually has, what a buyer should check, and what the report cannot tell you.";
const PUBLISHED = "2026-10-20";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    locale: "en_NZ",
    siteName: "Rondva",
    url: PAGE_URL,
    images: [{ url: "/rondva/og-1200x630.png", width: 1200, height: 630, alt: "Rondva" }],
  },
};

const articleLd = {
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  inLanguage: "en-NZ",
  datePublished: PUBLISHED,
  dateModified: PUBLISHED,
  mainEntityOfPage: PAGE_URL,
  author: { "@type": "Organization", name: BRANDS.rondva.company },
  publisher: { "@id": `${BRANDS.rondva.marketingUrl}/#organization` },
};

const sections: LegalSection[] = [
  {
    id: "what-it-is",
    title: "What the standard is",
    body: (
      <>
        <p>
          NZS 4306:2005, titled Residential Property Inspection, is a New Zealand standard published by Standards New
          Zealand in 2005. It sets out minimum requirements for visual inspections of residential buildings and for
          the reports that follow them. The standard is not itself a law, so a buyer should ask the inspector
          whether the inspection will follow it.
        </p>
        <p>
          The standard describes pre-sale and pre-purchase inspections as visual and non-invasive. The inspector
          looks at what can be seen and reached; there is no opening up of walls, floors or ceilings. The full text is
          sold by{" "}
          <LegalLink href="https://www.standards.govt.nz/shop/nzs-43062005">Standards New Zealand</LegalLink>, and this
          guide describes it in general terms.
        </p>
      </>
    ),
  },
  {
    id: "what-it-covers",
    title: "What it covers",
    body: (
      <>
        <p>
          In summary, a pre-purchase inspection under the standard makes provision for reporting on significant
          defects, particular attributes of the building, gradual deterioration, and significant maintenance that will
          be needed. The standard also deals with the competency expected of the person doing the inspection, an
          outline of what the report should contain, the reference standards that apply, and when the inspector should
          recommend a special-purpose inspection, for example by a specialist.
        </p>
        <p>
          It is a different job from a builder&apos;s quote or a compliance check. The government&apos;s consumer
          guidance describes the inspector as someone who looks for signs of problems such as borer, rot, dampness,
          structural damage, drainage problems and faulty wiring or pipes, photographs problem areas and comments on
          them, including gradual deterioration that is not yet a defect.
        </p>
      </>
    ),
  },
  {
    id: "typical-sections",
    title: "Sections a report typically has",
    body: (
      <>
        <p>
          Reports differ between inspection firms, and the standard describes an outline rather than a template, so
          treat this as a typical pattern and not a checklist you can hold every report to:
        </p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            <strong>Summary and conclusion.</strong> A short overview of the condition of the property and the items
            that matter most.
          </li>
          <li>
            <strong>Inspection details.</strong> Client, site address, date, inspector and qualifications, and a
            statement of what was and was not inspected.
          </li>
          <li>
            <strong>Findings by area.</strong> Typically the site, exterior, roof and roof space, subfloor, interior
            and services, each with observations, photographs and a recommendation.
          </li>
          <li>
            <strong>Significant defects.</strong> The findings the inspector considers serious enough to act on before
            buying.
          </li>
          <li>
            <strong>Gradual deterioration and maintenance.</strong> Age-related wear and upkeep that will be needed
            over time.
          </li>
          <li>
            <strong>Limitations and areas not inspected.</strong> Anything that could not be reached or seen, and the
            scope and exclusions of the inspection.
          </li>
        </ul>
        <p>
          Many reports also include moisture readings, and the terms and conditions of the inspection firm. Inspection
          firms set their own limits, and a firm&apos;s own agreement can narrow what the standard would otherwise
          suggest, so read the scope section of your report.
        </p>
      </>
    ),
  },
  {
    id: "how-it-works",
    title: "How an inspection usually runs",
    body: (
      <>
        <p>
          The inspector walks the property, usually with the buyer invited to attend, and works through the site, the
          outside of the building, the roof and roof space, the subfloor and the interior. Where there is no safe
          access, for example a very low subfloor or a steep roof, the inspector records the area as limited or not
          inspected instead of guessing. Photographs and a moisture meter are common tools.
        </p>
        <p>
          The written report normally arrives within a few days. Read it with the property in mind: a finding that
          says &quot;recommend further investigation&quot; is the inspector telling you that this report cannot settle
          the question, and the next step is a specialist, a quote, or a conversation with the seller about price or
          conditions in the agreement.
        </p>
      </>
    ),
  },
  {
    id: "buyer-checks",
    title: "What a buyer should check",
    body: (
      <>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            <strong>That the inspection follows NZS 4306:2005.</strong> The consumer-protection guidance advises
            checking that the inspector can carry out a pre-purchase inspection to the standard and has up-to-date
            knowledge and skills.
          </li>
          <li>
            <strong>Who the client is.</strong> A report supplied by the seller was written for the seller, so you are
            unlikely to have recourse if it misses something. Both{" "}
            <LegalLink href="https://www.consumerprotection.govt.nz/help-product-service/buying-or-renting-a-house/building-reports-red-flags">
              Consumer Protection
            </LegalLink>{" "}
            and <LegalLink href="https://www.settled.govt.nz/blog/can-i-trust-a-sellers-building-report">Settled</LegalLink>{" "}
            advise against relying on one.
          </li>
          <li>
            <strong>Indemnity insurance.</strong> Ask for proof of it, and check in your contract what it covers. It is
            the cover that applies if the inspector makes a professional error, such as missing a defect they should
            have seen.
          </li>
          <li>
            <strong>A sample report.</strong> Ask to see one before you book, so you know how findings are rated and
            how photographs are used.
          </li>
          <li>
            <strong>The limitations section.</strong> Note every area marked limited or not inspected, because those are
            the places the report says nothing about.
          </li>
          <li>
            <strong>Whether a follow-up is recommended.</strong> If the report suggests a specialist, for example for
            weathertightness, treat the question as open until that report is back.
          </li>
          <li>
            <strong>The age of the house.</strong> Older homes usually have age-related issues. A useful report
            separates minor, age-related matters from significant repairs.
          </li>
        </ul>
        <p>
          For homes that may be at risk of leaking, or that have been damaged by a natural disaster, the{" "}
          <LegalLink href="https://building.govt.nz/getting-started/your-rights-and-obligations/homeowner-rights-and-obligations/buying-a-house/is-a-pre-purchase-building-inspection-advisable">
            Building Performance website
          </LegalLink>{" "}
          says an inspection is essential, and it recommends someone with weathertightness expertise if there are signs
          of leaking.
        </p>
      </>
    ),
  },
  {
    id: "limits",
    title: "What the report cannot tell you",
    body: (
      <>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            It is visual, so it cannot find problems hidden behind finished surfaces, such as plumbing, framing,
            insulation or wiring.
          </li>
          <li>
            It is not an engineering assessment. Where the inspector sees a possible structural or technical issue,
            the usual advice is a specialist inspection.
          </li>
          <li>
            It does not confirm that earlier renovations had building consent. Council records or a LIM report are the
            place to check.
          </li>
          <li>
            It is not a finding that the property meets the Building Act, regulations or bylaws, and it is not a
            warranty against future problems.
          </li>
          <li>
            Moisture readings and thermal images are indicative. They point to places to look further and do not
            confirm the cause.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "if-missed",
    title: "If something is missed",
    body: (
      <p>
        Consumer Protection notes that inspectors are bound by the Consumer Guarantees Act and that disputes can go to
        the Disputes Tribunal or the District Court. That is one reason to keep the signed agreement, the full report
        and your photographs, and to read the scope and limitations wording before you pay. Your lawyer can advise on
        your own position; this guide cannot.
      </p>
    ),
  },
  {
    id: "rondva",
    title: "How Rondva fits",
    body: (
      <p>
        Rondva is an iPhone app that helps inspectors write their reports. It drafts the sections of a pre-purchase
        report in NZS 4306:2005 order from the inspector&apos;s own photos, notes, moisture readings and ratings; the
        inspector reviews every word and issues the report under their own company name. See{" "}
        <LegalLink href="/nz">rondva.com/nz</LegalLink> for what the report contains.
      </p>
    ),
  },
  {
    id: "sources",
    title: "Sources",
    body: (
      <ul className="list-disc space-y-1.5 pl-6">
        <li>
          <LegalLink href="https://www.standards.govt.nz/shop/nzs-43062005">
            Standards New Zealand: NZS 4306:2005 Residential property inspection
          </LegalLink>
        </li>
        <li>
          <LegalLink href="https://www.consumerprotection.govt.nz/help-product-service/buying-or-renting-a-house/building-reports-red-flags">
            Consumer Protection (MBIE): Building reports and red flags
          </LegalLink>
        </li>
        <li>
          <LegalLink href="https://building.govt.nz/getting-started/your-rights-and-obligations/homeowner-rights-and-obligations/buying-a-house/is-a-pre-purchase-building-inspection-advisable">
            Building Performance (MBIE): Is a pre-purchase building inspection advisable?
          </LegalLink>
        </li>
        <li>
          <LegalLink href="https://www.settled.govt.nz/blog/can-i-trust-a-sellers-building-report">
            Settled (Real Estate Authority): Can I trust a seller&apos;s building report?
          </LegalLink>
        </li>
      </ul>
    ),
  },
];

export default function Nzs4306GuidePage() {
  return (
    <>
      <JsonLd
        nodes={[
          organizationLd(),
          articleLd,
          breadcrumbLd([
            { name: "Rondva", path: "/" },
            { name: "NZS 4306:2005 pre-purchase report", path: PATH },
          ]),
        ]}
      />
      <LegalPage
        eyebrow="Guide · New Zealand"
        title={TITLE}
        intro={
          <p>
            An NZS 4306:2005 pre-purchase report is a visual, non-invasive inspection report on a house, written to New
            Zealand&apos;s residential property inspection standard. This guide explains in plain terms what the
            standard covers, what the report usually contains and what a buyer should look for. It is general
            information, not legal or engineering advice.
          </p>
        }
        sections={sections}
        toc
        revised="20 October 2026"
      />
    </>
  );
}
