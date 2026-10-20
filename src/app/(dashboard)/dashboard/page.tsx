import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { getDashboardLocale, getRequestBrand } from "@/lib/request-brand";
import { RondvaDashboardEmpty } from "@/components/rondva/RondvaDashboardEmpty";
import { dashboardCopy } from "@/lib/i18n/dashboard";
import { shellCopy } from "@/lib/i18n/dashboard-shell";
import type { InspectionStatus } from "@/lib/supabase/types";

export async function generateMetadata(): Promise<Metadata> {
  return { title: dashboardCopy(await getDashboardLocale()).list.title };
}

export default async function DashboardPage() {
  const locale = await getDashboardLocale();
  const t = dashboardCopy(locale).list;
  const shell = shellCopy(locale);
  const supabase = await createClient();

  const { data: inspections, error } = await supabase
    .from("inspections")
    .select(
      `
      id,
      address,
      postal_code,
      customer_name,
      inspection_date,
      status,
      report_url,
      created_at,
      rooms (id),
      observations:observations (id)
    `
    )
    .order("inspection_date", { ascending: false });

  if (error) {
    // Hrá villa úr gagnagrunni birtist aldrei notanda; hún fer í loggann og síðan sýnir
    // villuskjá stjórnborðsins (dashboard/error.tsx) með „Reyna aftur“.
    console.error("dashboard list load failed:", error.message);
    throw new Error(t.loadError);
  }

  if (!inspections || inspections.length === 0) {
    // Rondva: þrjú skref í stað dauðs enda (is/en eftir vali notandans). Beton fær
    // sama texta og áður, nú með fyrirsögn (H1) og einu næsta skrefi.
    if ((await getRequestBrand()) === "rondva") {
      return <RondvaDashboardEmpty locale={locale} />;
    }
    return (
      <div>
        <h1 className="mb-6 text-2xl font-semibold text-ink">{t.title}</h1>
        <div className="rounded-xl border border-concrete bg-surface px-6 py-16 text-center">
          <h2 className="mb-2 text-lg font-semibold text-ink">{t.emptyTitle}</h2>
          <p className="text-fog">{t.emptyBody}</p>
          <p className="mx-auto mt-3 max-w-md text-fog">{shell.list.emptyNext}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ink">{t.title}</h1>

      {/* overflow-x-auto (ekki hidden): breið tafla skrunast í stað þess að klippast. */}
      <div className="overflow-x-auto rounded-xl border border-concrete bg-surface">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{t.title}</caption>
          <thead>
            <tr className="border-b border-concrete bg-paper-alt">
              <th scope="col" className="px-4 py-3 font-medium text-fog">{t.address}</th>
              <th scope="col" className="hidden px-4 py-3 font-medium text-fog sm:table-cell">
                {t.customer}
              </th>
              <th scope="col" className="hidden px-4 py-3 font-medium text-fog md:table-cell">
                {t.date}
              </th>
              <th scope="col" className="hidden px-4 py-3 text-center font-medium text-fog sm:table-cell">
                {t.rooms}
              </th>
              <th scope="col" className="hidden px-4 py-3 text-center font-medium text-fog sm:table-cell">
                {t.observations}
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-fog">{t.status}</th>
            </tr>
          </thead>
          <tbody>
            {inspections.map((inspection) => (
              <tr
                key={inspection.id}
                className="relative border-b border-concrete transition-colors last:border-0 hover:bg-paper-alt active:bg-paper-alt"
              >
                <td className="px-4 py-3">
                  {/* Allur raðarinn er smellanlegur: tengillinn teygist yfir hann (::after),
                      einn fókusstaður á hverja röð. */}
                  <Link
                    href={`/dashboard/${inspection.id}`}
                    className="font-medium text-ink wrap-break-word transition-colors hover:text-navy focus-visible:outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-navy"
                  >
                    {inspection.address}
                  </Link>
                  <div className="mt-0.5 text-xs text-fog">
                    {inspection.postal_code}
                    {/* Á símum kemur dagsetningin hér undir heimilisfangið (dálkurinn er falinn). */}
                    {inspection.inspection_date ? (
                      <span className="md:hidden">
                        {inspection.postal_code ? " · " : ""}
                        {inspection.inspection_date}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-fog sm:table-cell">
                  {inspection.customer_name}
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 font-mono text-xs text-fog md:table-cell">
                  {inspection.inspection_date}
                </td>
                <td className="hidden px-4 py-3 text-center text-fog sm:table-cell">
                  {(inspection.rooms as unknown[])?.length ?? 0}
                </td>
                <td className="hidden px-4 py-3 text-center text-fog sm:table-cell">
                  {(inspection.observations as unknown[])?.length ?? 0}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge
                    status={inspection.status as InspectionStatus}
                    locale={locale}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
