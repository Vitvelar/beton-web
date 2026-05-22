"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateObservation(
  obsId: string,
  data: {
    title?: string;
    description?: string;
    suggestion?: string;
    severity?: string;
    category?: string;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("observations")
    .update(data)
    .eq("id", obsId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function generateReport(inspectionId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.functions.invoke("generate-report", {
    body: { inspection_id: inspectionId },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/${inspectionId}`);
  return data as {
    status: string;
    report_url?: string;
    ai_summary?: string;
    error?: string;
  };
}

export async function sendToDrive(inspectionId: string) {
  const supabase = await createClient();

  const { data: inspection } = await supabase
    .from("inspections")
    .select("report_url, address")
    .eq("id", inspectionId)
    .single();

  if (!inspection?.report_url) {
    return { error: "Engin skýrsla til. Búðu til skýrslu fyrst." };
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("inspection-reports")
    .download(inspection.report_url);

  if (downloadError || !fileData) {
    return { error: `Gat ekki sótt skýrslu: ${downloadError?.message}` };
  }

  const buffer = await fileData.arrayBuffer();
  const pdfBase64 = Buffer.from(buffer).toString("base64");

  const filename = `Astandsskodun - ${inspection.address}.pdf`;

  const { data, error } = await supabase.functions.invoke("upload-to-drive", {
    body: {
      inspection_id: inspectionId,
      filename,
      pdf_base64: pdfBase64,
      kind: "inspection",
      address: inspection.address,
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/${inspectionId}`);
  return data as {
    status: string;
    drive_file_id?: string;
    drive_view_url?: string;
    error?: string;
  };
}
