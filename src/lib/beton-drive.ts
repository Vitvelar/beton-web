import type { SupabaseClient } from "@supabase/supabase-js";

// „Senda í Google Drive" skrifar í sameiginlega Drive-möppu Beton ehf. Aðeins skoðanir
// Beton (ákvörðun eiganda 2026-09-27). Sama regla og beton-app
// supabase/functions/upload-to-drive/access.ts, sem er raunverulega hliðið; þetta ræður
// aðeins hvort hnappurinn birtist og hvort vefurinn reyni að senda.

/** public.companies.id Beton ehf. í framleiðslu (sama og BETON_COMPANY_ID í access.ts). */
export const BETON_COMPANY_ID = "914be6aa-1e6e-48f6-a106-9efe304926f9";

export async function canUseBetonDrive(
  supabase: SupabaseClient,
  email: string | null | undefined
): Promise<boolean> {
  if (email?.trim().toLowerCase() === "beton@beton.is") return true;
  try {
    const { data, error } = await supabase.rpc("my_access");
    if (error || !data) return false;
    const company = (data as { company?: { id?: unknown; status?: unknown; entitlement?: unknown } | null }).company;
    return !!company && company.id === BETON_COMPANY_ID && company.status === "active" && company.entitlement === "partner";
  } catch {
    return false;
  }
}
