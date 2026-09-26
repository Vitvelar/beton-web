import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { getDashboardLocale } from "@/lib/request-brand";
import { dashboardCopy } from "@/lib/i18n/dashboard";
import type { InspectionStatus } from "@/lib/supabase/types";

export default async function DashboardPage() {
  const locale = await getDashboardLocale();
  const t = dashboardCopy(locale).list;
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
    return (
      <div className="rounded-xl bg-sev-danger/10 p-6 text-sev-danger">
        {t.loadError(error.message)}
      </div>
    );
  }

  if (!inspections || inspections.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-semibold text-ink mb-2">
          {t.emptyTitle}
        </h2>
        <p className="text-fog">
          {t.emptyBody}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink mb-6">{t.title}</h1>

      <div className="overflow-hidden rounded-xl border border-concrete bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-concrete bg-paper-alt">
              <th className="px-4 py-3 font-medium text-fog">{t.address}</th>
              <th className="px-4 py-3 font-medium text-fog hidden sm:table-cell">
                {t.customer}
              </th>
              <th className="px-4 py-3 font-medium text-fog hidden md:table-cell">
                {t.date}
              </th>
              <th className="px-4 py-3 font-medium text-fog text-center">
                {t.rooms}
              </th>
              <th className="px-4 py-3 font-medium text-fog text-center hidden sm:table-cell">
                {t.observations}
              </th>
              <th className="px-4 py-3 font-medium text-fog">{t.status}</th>
            </tr>
          </thead>
          <tbody>
            {inspections.map((inspection) => (
              <tr
                key={inspection.id}
                className="border-b border-concrete/50 last:border-0 hover:bg-paper-alt/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/${inspection.id}`}
                    className="font-medium text-ink hover:text-navy transition-colors"
                  >
                    {inspection.address}
                  </Link>
                  <div className="text-xs text-fog mt-0.5">
                    {inspection.postal_code}
                  </div>
                </td>
                <td className="px-4 py-3 text-fog hidden sm:table-cell">
                  {inspection.customer_name}
                </td>
                <td className="px-4 py-3 text-fog font-mono text-xs hidden md:table-cell">
                  {inspection.inspection_date}
                </td>
                <td className="px-4 py-3 text-center text-fog">
                  {(inspection.rooms as unknown[])?.length ?? 0}
                </td>
                <td className="px-4 py-3 text-center text-fog hidden sm:table-cell">
                  {(inspection.observations as unknown[])?.length ?? 0}
                </td>
                <td className="px-4 py-3">
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
