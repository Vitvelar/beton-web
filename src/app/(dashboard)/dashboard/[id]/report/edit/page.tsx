import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { snapshotToken } from "@/lib/report/snapshot-token";
import { getDashboardLocale } from "@/lib/request-brand";
import { ratingSchemeOf } from "@/lib/report/settings";
import { dashboardCopy, format } from "@/lib/i18n/dashboard";
import {
  ReportTextEditor,
  type EditorReport,
} from "@/components/dashboard/ReportTextEditor";

// PGRST116 = engin lína, 22P02 = ógilt uuid í slóðinni: bæði eru „finnst ekki“.
// Allt annað (bilun í gagnagrunni, netvilla) er villa → error.tsx, ekki 404.
function isMissingRow(error: { code?: string } | null): boolean {
  return error?.code === "PGRST116" || error?.code === "22P02";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("inspections").select("address").eq("id", id).maybeSingle();
    if (data?.address) {
      const t = dashboardCopy(await getDashboardLocale()).reportEditor;
      return { title: format(t.metaTitle, { address: data.address }) };
    }
  } catch {
    // Síðan sjálf sýnir villuna; titillinn fellur aftur á sjálfgefinn.
  }
  return {};
}

// Ritill fyrir skýrslutextann (samantekt + tillögur). Aðeins cookie-auth
// (admin.beton.is) — hvorki worker-token né Bearer eins og skýrslusíðan sjálf,
// enda skrifar þessi síða í grunninn.
export default async function ReportEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getDashboardLocale();
  const supabase = await createClient();

  const { data: inspection, error } = await supabase
    .from("inspections")
    .select("id, address, ai_report_data")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isMissingRow(error)) notFound();
    throw new Error(`report editor load failed: ${error.message}`);
  }
  if (!inspection?.ai_report_data) {
    notFound();
  }

  return (
    <ReportTextEditor
      inspectionId={inspection.id}
      address={inspection.address}
      report={inspection.ai_report_data as EditorReport}
      initialToken={snapshotToken(inspection.ai_report_data)}
      locale={locale}
      scheme={ratingSchemeOf(inspection.ai_report_data as { rating_scheme?: unknown })}
    />
  );
}
