import type { Metadata } from "next";
import { BRANDS } from "@/lib/brand";
import { breadcrumbLd, organizationLd } from "@/lib/rondva-seo";
import { RONDVA_NZ_SOLO, RONDVA_OFFER_LINE, RONDVA_PLANS } from "@/lib/rondva-pricing";
import { JsonLd } from "@/components/rondva/JsonLd";
import { LegalLink, LegalPage, type LegalSection } from "@/components/rondva/LegalPage";

// rondva.com/compare/inspectpro: dagsett staðreyndatafla, engir gildisdómar (PROMPT-EFTIR-SAMTHYKKI §E lið 9).
// Staðreyndir um InspectPro eru lesnar af inspectpro.co.nz og inspectpro.co.nz/pricing 2026-10-20; það sem
// síðurnar segja ekki stendur sem „not stated“. Línur sem eru óvissar eru sleppt. Rondva-verð úr
// rondva-pricing.ts (NZ$ Solo er það sem Apple sýnir).

const PATH = "/compare/inspectpro";
const PAGE_URL = `${BRANDS.rondva.marketingUrl}${PATH}`;
const TITLE = "Rondva and InspectPro compared: a dated fact sheet";
const DESCRIPTION =
  "A factual, dated comparison of two inspection apps used for New Zealand building inspection reports: NZS 4306 wording, AI drafting, platforms and price, each with its source. Last checked 20 October 2026.";
const CHECKED = "20 October 2026";
const IP_HOME = "https://www.inspectpro.co.nz";
const IP_PRICING = "https://www.inspectpro.co.nz/pricing";

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

const soloReports = RONDVA_PLANS.find((p) => p.id === "solo")?.reports ?? 0;
const soloPrice = `${RONDVA_NZ_SOLO.currency}${RONDVA_NZ_SOLO.price}`;

type Row = { label: string; rondva: React.ReactNode; other: React.ReactNode };

const ROWS: Row[] = [
  {
    label: "NZS 4306",
    rondva: "Drafts reports in NZS 4306:2005 order.",
    other: (
      <>
        Describes itself as &quot;NZS 4306 and AS 4349 ready&quot; (<LegalLink href={IP_HOME}>homepage</LegalLink>).
      </>
    ),
  },
  {
    label: "AI drafting of report text",
    rondva: "Yes. The AI drafts the text; the inspector reviews it and the ratings stay as the inspector set them.",
    other: (
      <>
        Not mentioned on the homepage or the pricing page. The homepage describes preset comments for common
        findings.
      </>
    ),
  },
  {
    label: "Platforms",
    rondva: (
      <>
        iPhone app. A web dashboard at app.rondva.com for reviewing and exporting reports. No Android app.
      </>
    ),
    other: <>iOS and Android apps (<LegalLink href={IP_HOME}>homepage</LegalLink>).</>,
  },
  {
    label: "Price in New Zealand",
    rondva: (
      <>
        Solo {soloPrice} a month for {soloReports} AI-drafted reports, charged by Apple in NZ$ including GST. Pro and the Report
        pack are priced in the App Store. {RONDVA_OFFER_LINE} (<LegalLink href="/nz">rondva.com/nz</LegalLink>)
      </>
    ),
    other: (
      <>
        NZD $79 + GST per month, billed monthly; the page also describes a 10-day free trial (
        <LegalLink href={IP_PRICING}>inspectpro.co.nz/pricing</LegalLink>).
      </>
    ),
  },
  {
    label: "How you pay",
    rondva: "In the app, through the App Store.",
    other: <>Billed monthly through Stripe (<LegalLink href={IP_PRICING}>pricing page</LegalLink>).</>,
  },
];

const sections: LegalSection[] = [
  {
    id: "table",
    title: "Fact sheet",
    body: (
      <>
        <p>
          Last checked {CHECKED}. Rondva details are from rondva.com on that date; InspectPro details are from
          inspectpro.co.nz on that date. Prices and features change, so check the linked pages before you decide. A
          row is left out where we could not confirm the facts.
        </p>
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <caption className="sr-only">Rondva and InspectPro compared, last checked {CHECKED}</caption>
            <thead className="bg-paper-alt text-ink">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold" />
                <th scope="col" className="px-4 py-3 font-semibold">
                  Rondva
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  InspectPro
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-t border-line align-top">
                  <th scope="row" className="px-4 py-3 font-semibold text-ink">
                    {row.label}
                  </th>
                  <td className="px-4 py-3">{row.rondva}</td>
                  <td className="px-4 py-3">{row.other}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "notes",
    title: "Notes",
    body: (
      <ul className="list-disc space-y-1.5 pl-6">
        <li>
          Prices are not like for like: InspectPro&apos;s price excludes GST, Rondva&apos;s App Store price in New
          Zealand includes it, and the two products bill differently.
        </li>
        <li>
          Neither company&apos;s wording about NZS 4306 is a statement by Standards New Zealand. Read the standard and
          each product&apos;s own terms.
        </li>
        <li>
          This page describes differences in what each company publishes. It does not rate either product.
        </li>
      </ul>
    ),
  },
  {
    id: "sources",
    title: "Sources",
    body: (
      <ul className="list-disc space-y-1.5 pl-6">
        <li>
          <LegalLink href={IP_HOME}>inspectpro.co.nz</LegalLink> (read {CHECKED})
        </li>
        <li>
          <LegalLink href={IP_PRICING}>inspectpro.co.nz/pricing</LegalLink> (read {CHECKED})
        </li>
        <li>
          <LegalLink href="/nz">rondva.com/nz</LegalLink> (read {CHECKED})
        </li>
        <li>
          <LegalLink href="/guides/nzs-4306-pre-purchase-report">
            What an NZS 4306:2005 pre-purchase inspection report covers
          </LegalLink>
        </li>
      </ul>
    ),
  },
];

export default function CompareInspectProPage() {
  return (
    <>
      <JsonLd
        nodes={[
          organizationLd(),
          breadcrumbLd([
            { name: "Rondva", path: "/" },
            { name: "Rondva and InspectPro compared", path: PATH },
          ]),
        ]}
      />
      <LegalPage
        eyebrow={`Comparison · Last checked ${CHECKED}`}
        title={TITLE}
        intro={
          <p>
            Rondva and InspectPro are both phone apps for building inspectors in New Zealand. This page lists what
            each company publishes about itself, with the date it was read and a link to the source.
          </p>
        }
        sections={sections}
        revised={CHECKED}
      />
    </>
  );
}
