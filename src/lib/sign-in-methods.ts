import type { UserIdentity } from "@supabase/supabase-js";

// Innskráningarleiðir notanda eins og Stillingar (server) senda þær til
// SignInMethods (client). Aðeins raðanlegir reitir sem viðmótið þarf — ekki
// identity_data í heild (sub, mynd, custom_claims o.fl.).
export interface LinkedIdentity {
  identity_id: string;
  provider: string;
  email: string | null;
}

export function linkedIdentities(identities: UserIdentity[] | undefined): LinkedIdentity[] {
  return (identities ?? []).map((identity) => {
    const email = identity.identity_data?.email;
    return {
      identity_id: identity.identity_id,
      provider: identity.provider,
      email: typeof email === "string" && email ? email : null,
    };
  });
}

// Villukóðar sem /dashboard/auth/link skilar óbreyttum í ?link_error=. Allt annað
// (hætt við, útrunnið, óþekkt) verður "oauth" — texti úr slóðinni er aldrei birtur.
export const LINK_ERROR_CODES = ["identity_already_exists", "manual_linking_disabled"] as const;
export type LinkErrorCode = (typeof LINK_ERROR_CODES)[number] | "oauth";

export function toLinkErrorCode(code: string | null | undefined): LinkErrorCode {
  const known = LINK_ERROR_CODES.find((c) => c === code);
  return known ?? "oauth";
}

// „Hide My Email": Apple gefur dulnefni á þessu léni í stað raunverulega
// netfangsins. Það er birt sem „falið", ekki sem slembistrengur.
export function isAppleRelayEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase().endsWith("@privaterelay.appleid.com");
}
