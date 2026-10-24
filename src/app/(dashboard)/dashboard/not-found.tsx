import Link from "next/link";
import { getDashboardLocale } from "@/lib/request-brand";
import { dashboardCopy } from "@/lib/i18n/dashboard";
import { btn } from "@/lib/ui";

// „Finnst ekki“ í stjórnborðinu: notFound() úr síðum þess og óþekktar slóðir undir /dashboard
// ([...rest]/page.tsx). Haus og leiðsögn haldast; tungumál og litir fylgja vörumerkinu.
export default async function DashboardNotFound() {
  const copy = dashboardCopy(await getDashboardLocale());
  return (
    <div className="max-w-xl py-6">
      <h1 className="text-2xl font-semibold text-ink">{copy.notFoundPage.title}</h1>
      <p className="mt-2 text-sm text-fog">{copy.notFoundPage.body}</p>
      <div className="mt-6">
        <Link href="/dashboard" className={btn("secondary")}>
          {copy.common.backToInspections}
        </Link>
      </div>
    </div>
  );
}
