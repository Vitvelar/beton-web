import type { SupabaseClient } from "@supabase/supabase-js";
import { isAllowedEmail } from "@/lib/allowed-users";
import type { Brand } from "@/lib/brand";

// Hver má nota stjórnborðið?
//
// 1. Gamli netfangalistinn (Bragi, Hjalti, Alex) er hraðleið á báðum lénum:
//    engin auka netbeiðni, nákvæmlega sama hegðun og áður.
// 2. admin.beton.is (og óþekktir hýslar) hleypa AÐEINS listanum inn — Beton
//    hegðar sér eins og fyrir fyrirtækjaaðganga.
// 3. app.rondva.com spyr gagnagrunninn: my_access().allowed = is_allowed_user()
//    = listinn OR virk aðild að fyrirtæki (companies.status = 'active').
//    „Virkt fyrirtæki" er það sem greiðir (eða er undanþegið) — sjá
//    beton-app/docs/release/COMPANY_ACCOUNTS_DESIGN.md §7.5.
//
// Lokast ef eitthvað bregst (RPC-villa → enginn aðgangur). RLS er samt
// raunverulega hliðið að gögnunum; þetta ræður aðeins hvort viðmótið opnast.
//
// Nýskráning fyrirtækis (app.rondva.com/dashboard/onboarding, src/lib/onboarding.ts)
// er AÐEINS boðin þegar my_access() svaraði og notandinn á ekkert fyrirtæki
// (`canRegister`). Villa eða óljóst svar er „no_account" án `canRegister`, eins og
// áður — þá sést innskráningarsíðan, aldrei nýskráningarformið.

export type AccessDenial = "pending" | "suspended" | "no_account";

/** Fyrirtæki notandans eins og my_access() skilar því — aðeins til birtingar. */
export interface AccessCompany {
  name: string;
  country: string;
}

export type DashboardAccess =
  | { allowed: true }
  | {
      allowed: false;
      reason: AccessDenial;
      /** my_access() svaraði og notandinn á EKKERT fyrirtæki (aldrei við villu). */
      canRegister?: true;
      /** Fyrirtæki sem bíður samþykkis eða er stöðvað (birtist á biðsíðunni). */
      company?: AccessCompany;
    };

interface MyAccessPayload {
  allowed?: boolean;
  company?: { status?: string; name?: unknown; country?: unknown } | null;
}

function companySummary(company: { name?: unknown; country?: unknown }): AccessCompany | undefined {
  const name = typeof company.name === "string" ? company.name.trim() : "";
  const country = typeof company.country === "string" ? company.country.trim() : "";
  return name ? { name, country } : undefined;
}

export async function checkDashboardAccess(
  supabase: SupabaseClient,
  email: string | null | undefined,
  brand: Brand
): Promise<DashboardAccess> {
  if (isAllowedEmail(email)) return { allowed: true };
  if (brand !== "rondva") return { allowed: false, reason: "no_account" };

  try {
    const { data, error } = await supabase.rpc("my_access");
    if (error || !data) return { allowed: false, reason: "no_account" };

    const payload = data as MyAccessPayload;
    if (payload.allowed === true) return { allowed: true };

    // Skýrt svar um að ekkert fyrirtæki sé til (my_access skilar company: null).
    if (payload.company === null) return { allowed: false, reason: "no_account", canRegister: true };

    const status = payload.company?.status;
    const company = payload.company ? companySummary(payload.company) : undefined;
    if (status === "pending") return { allowed: false, reason: "pending", ...(company ? { company } : {}) };
    if (status === "suspended") return { allowed: false, reason: "suspended", ...(company ? { company } : {}) };
    return { allowed: false, reason: "no_account" };
  } catch {
    return { allowed: false, reason: "no_account" };
  }
}

/** Gildi `?error=` á innskráningarsíðunni fyrir hverja höfnun. */
export function loginErrorFor(access: DashboardAccess): string {
  if (access.allowed) return "";
  return access.reason === "no_account" ? "unauthorized" : access.reason;
}
