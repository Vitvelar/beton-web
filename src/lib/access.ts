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

export type AccessDenial = "pending" | "suspended" | "no_account";

export type DashboardAccess =
  | { allowed: true }
  | { allowed: false; reason: AccessDenial };

interface MyAccessPayload {
  allowed?: boolean;
  company?: { status?: string } | null;
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

    const status = payload.company?.status;
    if (status === "pending") return { allowed: false, reason: "pending" };
    if (status === "suspended") return { allowed: false, reason: "suspended" };
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
