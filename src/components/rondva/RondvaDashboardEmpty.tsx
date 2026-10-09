import Link from "next/link";
import { RONDVA_OFFER_LINE } from "@/lib/rondva-pricing";
import { AppStoreBadge, AppStoreQr } from "@/components/rondva/AppStoreBadge";

// Tómt ástand stjórnborðsins á app.rondva.com (aðeins Rondva, ensku): þrjú skref í stað dauðs enda.
// Birtist úr src/app/(dashboard)/dashboard/page.tsx; Beton sér áfram gamla textann óbreyttan.
export function RondvaDashboardEmpty() {
  const steps: { title: string; body: React.ReactNode }[] = [
    {
      title: "Get Rondva on your iPhone",
      body: (
        <>
          <p>Sign in with the same account you used here.</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4">
            <AppStoreBadge />
            <AppStoreQr tone="light" />
          </div>
        </>
      ),
    },
    {
      title: "Add your logo and report terms",
      body: (
        <p>
          They go on the cover and the last page of every report.{" "}
          <Link href="/dashboard/settings" className="font-semibold text-ink underline underline-offset-4 hover:text-navy">
            Open settings
          </Link>
        </p>
      ),
    },
    {
      title: "Start your first inspection",
      body: <p>{RONDVA_OFFER_LINE}</p>,
    },
  ];

  return (
    <div className="mx-auto max-w-2xl py-12 sm:py-16">
      <h2 className="text-xl font-semibold text-ink">No inspections yet</h2>
      <p className="mt-2 text-fog">Inspections synced from the app appear here. Three steps to get going:</p>
      <ol className="mt-8 space-y-4">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4 rounded-xl border border-concrete bg-white p-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
              {i + 1}
            </span>
            <div className="text-fog">
              <h3 className="font-semibold text-ink">{step.title}</h3>
              <div className="mt-1 text-[15px] leading-relaxed">{step.body}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
