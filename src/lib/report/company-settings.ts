import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveReportSettings, type ReportSettings } from "./settings";

// Skýrslustillingar fyrirtækis innskráða notandans (stillingasíðan og merki í
// stjórnborðinu). companies.report_standard kemur með NZS 4306-flutningi beton-app; þar til
// hann er keyrður í framleiðslu bregst uppfletting á dálkinum, og þá er flett upp án hans
// (nákvæmlega eins og áður) og `standardSupported` = false svo viðmótið feli sniðvalið og
// NZ-matsorðin. Vefurinn má því fara út á undan gagnagrunnsbreytingunni.

const BASE_COLUMNS = "report_locale, rating_scheme, country_code";

export interface CompanyReportSettings {
  settings: ReportSettings;
  /** Satt þegar companies.report_standard er til (NZS 4306-flutningurinn keyrður). */
  standardSupported: boolean;
}

export async function fetchCompanyReportSettings(
  supabase: SupabaseClient,
  { ownerOnly }: { ownerOnly: boolean },
): Promise<CompanyReportSettings | null> {
  const run = (columns: string) =>
    ownerOnly
      ? supabase.from("company_members").select(`role, companies ( ${columns} )`).eq("role", "owner").maybeSingle()
      : supabase.from("company_members").select(`companies ( ${columns} )`).limit(1).maybeSingle();
  let standardSupported = true;
  let { data, error } = await run(`${BASE_COLUMNS}, report_standard`);
  if (error) {
    standardSupported = false;
    ({ data, error } = await run(BASE_COLUMNS));
  }
  if (error || !data) return null;
  const companies = (data as { companies?: unknown }).companies;
  const company = (Array.isArray(companies) ? companies[0] : companies) as Parameters<typeof resolveReportSettings>[0];
  if (!company) return null;
  return { settings: resolveReportSettings(company), standardSupported };
}
