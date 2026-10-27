import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StadaView } from "@/components/dashboard/StadaView";
import { stadaCopy } from "@/lib/i18n/stada";
import { fetchGrowthSnapshot } from "@/lib/ops/growth";
import { isGrowthAdmin } from "@/lib/ops/growth-access";
import { getDashboardLocale, getRequestUser } from "@/lib/request-brand";
import { createServiceClient } from "@/lib/supabase/service";
import { tapLink } from "@/lib/ui";

// Staða Rondva (tekjur, trekt, sendingar, birgðir). Aðeins eigendur (growth-access.ts); aðrir fá 404
// (síðan er ekki til fyrir þá). Gögnin eru lesin með service-role biðlara úr ops_growth_snapshot() — sama
// fall og stöðupósturinn notar.  Hleðsluskjárinn (loading.tsx) er aðeins í þessari möppu — aldrei ofar en /report.

export async function generateMetadata(): Promise<Metadata> {
  return { title: stadaCopy(await getDashboardLocale()).metaTitle };
}

export default async function StadaPage() {
  const user = await getRequestUser();
  if (!isGrowthAdmin(user?.email)) notFound();

  const locale = await getDashboardLocale();
  const t = stadaCopy(locale);

  const result = await fetchGrowthSnapshot(createServiceClient());

  if (!result.ok && result.reason === "error") {
    console.error("stada snapshot failed:", result.message);
    throw new Error(t.loadError);
  }

  return (
    <div>
      <Link href="/dashboard" className={`${tapLink} -ml-1 mb-1 px-1 text-sm text-fog transition-colors hover:text-ink`}>
        {t.backToList}
      </Link>
      {result.ok ? (
        <StadaView snapshot={result.snapshot} locale={locale} />
      ) : (
        <div role="status" className="max-w-xl rounded-xl border border-concrete bg-surface p-6">
          <h1 className="text-lg font-semibold text-ink">{t.migrationPending.title}</h1>
          <p className="mt-2 text-sm text-fog">{t.migrationPending.body}</p>
        </div>
      )}
    </div>
  );
}
