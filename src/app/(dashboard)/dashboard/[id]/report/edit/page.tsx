import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { snapshotToken } from "@/lib/report/snapshot-token";
import {
  ReportTextEditor,
  type EditorReport,
} from "@/components/dashboard/ReportTextEditor";

// Ritill fyrir skýrslutextann (samantekt + tillögur). Aðeins cookie-auth
// (admin.beton.is) — hvorki worker-token né Bearer eins og skýrslusíðan sjálf,
// enda skrifar þessi síða í grunninn.
export default async function ReportEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: inspection } = await supabase
    .from("inspections")
    .select("id, address, ai_report_data")
    .eq("id", id)
    .maybeSingle();

  if (!inspection?.ai_report_data) {
    notFound();
  }

  return (
    <ReportTextEditor
      inspectionId={inspection.id}
      address={inspection.address}
      report={inspection.ai_report_data as EditorReport}
      initialToken={snapshotToken(inspection.ai_report_data)}
    />
  );
}
