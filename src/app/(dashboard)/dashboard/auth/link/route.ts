import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toLinkErrorCode } from "@/lib/sign-in-methods";

// Endastöð fyrir tengingu innskráningarleiðar (linkIdentity í SignInMethods).
// Aðskilin frá auth/callback: vísar ALLTAF á /dashboard/settings á sama hýsli.
// Engin `next`-breyta, svo opin tilvísun er ekki möguleg, og villukóðar eru
// bornir saman við þekktan lista — error_description er aldrei endurvarpað.
//
// Engin aðgangsathugun hér: proxy.ts athugar /dashboard/settings eins og aðrar
// stjórnborðssíður (og sendir á innskráningu ef engin lota er til).

function settingsRedirect(origin: string, param?: { name: string; value: string }) {
  const url = new URL("/dashboard/settings", origin);
  if (param) url.searchParams.set(param.name, param.value);
  // Skrunar beint að spjaldinu (neðst á Stillingum), þar sem skilaboðin og
  // uppfærði listinn eru. Eigið brot í Location kemur líka í veg fyrir að
  // vafrinn beri áfram brot Supabase (#error=…&error_description=…): þá færi
  // hrár villutexti í slóðina og auth-js læsi hann sem innskráningarsvar.
  url.hash = "sign-in-methods";
  return NextResponse.redirect(url);
}

function linkError(origin: string, code: string | null | undefined) {
  return settingsRedirect(origin, { name: "link_error", value: toLinkErrorCode(code) });
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // Supabase sendir villu í stað kóða, t.d. error=server_error&
  // error_code=identity_already_exists þegar reikningurinn er þegar tengdur
  // (þessum notanda eða öðrum). Hætt við hjá Google → error=access_denied.
  if (searchParams.has("error") || searchParams.has("error_code")) {
    return linkError(origin, searchParams.get("error_code"));
  }

  const code = searchParams.get("code");
  if (!code) return settingsRedirect(origin);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return linkError(origin, error.code);

  return settingsRedirect(origin, { name: "linked", value: "1" });
}
