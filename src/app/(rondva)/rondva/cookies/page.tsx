import type { Metadata } from "next";
import Link from "next/link";
import { BRANDS } from "@/lib/brand";
import { RondvaHeader } from "@/components/rondva/RondvaHeader";
import { RondvaFooter } from "@/components/rondva/RondvaFooter";
import { CookieChoicesButton } from "@/components/rondva/CookieChoicesButton";
import { rondvaPageMetadata } from "@/components/rondva/page-meta";
import { rvTapLink } from "@/components/rondva/ui";

export const metadata: Metadata = rondvaPageMetadata({
  title: "Cookies",
  description: "Which cookies rondva.com sets, what each one is for, and how to change your choice.",
  path: "/cookies",
});

type Row = { name: string; provider: string; purpose: string; expiry: string };

const essential: Row[] = [
  {
    name: "rv_consent",
    provider: "Rondva (first party)",
    purpose: "Remembers whether you accepted or declined optional cookies, so we don't ask again.",
    expiry: "180 days",
  },
];

const analytics: Row[] = [
  {
    name: "_ga, _ga_*",
    provider: "Google Analytics 4",
    purpose:
      "Distinguishes visitors and sessions so we can see which pages are read and where visitors come from. Data is aggregated; IP addresses are not stored by Google Analytics 4.",
    expiry: "Up to 2 years",
  },
];

const marketing: Row[] = [
  {
    name: "_fbp",
    provider: "Meta (Facebook / Instagram ads)",
    purpose:
      "Lets us measure whether a Meta ad led to a waitlist signup and build audiences for our own ads. Set only if you accept marketing cookies.",
    expiry: "90 days",
  },
  {
    name: "_gcl_au",
    provider: "Google Ads",
    purpose: "Attributes a waitlist signup to a Google ad click. Set only if you accept marketing cookies.",
    expiry: "90 days",
  },
];

// Símar: hver kaka er eigin blokk (nafn, veitandi, tilgangur, gildistími); frá sm og upp er það tafla.
function Table({ rows }: { rows: Row[] }) {
  return (
    <>
      <ul className="mt-4 space-y-3 sm:hidden">
        {rows.map((r) => (
          <li key={r.name} className="rounded-card border border-line bg-surface p-4 text-sm">
            <p className="font-mono text-xs text-ink">{r.name}</p>
            <dl className="mt-3 space-y-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Provider</dt>
                <dd className="text-ink">{r.provider}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Purpose</dt>
                <dd className="text-muted">{r.purpose}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Expires</dt>
                <dd className="text-muted">{r.expiry}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      <div className="mt-4 hidden overflow-x-auto rounded-card border border-line bg-surface sm:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper-alt text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Cookie</th>
              <th className="px-4 py-3 font-semibold">Provider</th>
              <th className="px-4 py-3 font-semibold">Purpose</th>
              <th className="px-4 py-3 font-semibold">Expires</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-line align-top">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-ink">{r.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{r.provider}</td>
                <td className="px-4 py-3 text-muted">{r.purpose}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{r.expiry}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function RondvaCookiesPage() {
  return (
    <>
      <RondvaHeader />
      <main id="content" className="flex-1">
        <div className="px-6">
          <article id="top" className="mx-auto max-w-[1180px] py-16 md:py-24">
            <div className="max-w-3xl">
              <p className="rv-eyebrow">Cookies</p>
              <h1 className="rv-display rv-balance mt-4 text-[40px] sm:text-[48px] md:text-[56px]">Cookies on rondva.com</h1>
              <p className="mt-6 text-lg text-muted leading-relaxed">
                One essential cookie, and nothing else unless you say yes. You can change your mind at any time with the button
                below.
              </p>

              <div className="mt-8">
                <CookieChoicesButton />
              </div>

              <section className="mt-14">
                <h2 className="text-xl font-semibold tracking-tight">Essential — always on</h2>
                <p className="mt-2 text-muted">Needed for the site to respect your choice. No consent is required for this.</p>
                <Table rows={essential} />
              </section>

              <section className="mt-12">
                <h2 className="text-xl font-semibold tracking-tight">Analytics — only with your consent</h2>
                <p className="mt-2 text-muted">
                  Helps us understand what on this site is useful. We also use Vercel Web Analytics, which sets no cookies and
                  stores no identifier about you, so it is not listed here.
                </p>
                <Table rows={analytics} />
              </section>

              <section className="mt-12">
                <h2 className="text-xl font-semibold tracking-tight">Marketing — only with your consent</h2>
                <p className="mt-2 text-muted">
                  Used to measure our own advertising. We do not sell data and we do not let ad networks use it for anything
                  except reporting on our campaigns.
                </p>
                <Table rows={marketing} />
              </section>

              <section className="mt-12 space-y-3 text-muted leading-relaxed">
                <h2 className="text-xl font-semibold tracking-tight text-ink">Your choice, and how to change it</h2>
                <p>
                  The first time you visit we ask before setting any optional cookie. Declining does not limit anything on the
                  site. To change your choice later, use the button above or clear the site&apos;s cookies in your browser; we
                  will ask again.
                </p>
                <p>
                  How we handle the personal data behind these cookies is in the{" "}
                  <Link href="/privacy" className="underline underline-offset-4">
                    privacy policy
                  </Link>
                  . Questions:{" "}
                  <a href={`mailto:${BRANDS.rondva.contactEmail}`} className="underline underline-offset-4">
                    {BRANDS.rondva.contactEmail}
                  </a>
                  .
                </p>
              </section>

              <div className="mt-16 flex flex-wrap items-center gap-x-6 text-sm text-muted">
                <p className="py-2">Last revised 21 September 2026.</p>
                <Link href="/" className={rvTapLink}>
                  Back to the front page
                </Link>
                <a href="#top" className={rvTapLink}>
                  Back to top{" "}
                  <span aria-hidden="true" className="ml-1">
                    ↑
                  </span>
                </a>
              </div>
            </div>
          </article>
        </div>
      </main>
      <RondvaFooter />
    </>
  );
}
