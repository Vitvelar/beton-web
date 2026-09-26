import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkDashboardAccess, loginErrorFor } from "@/lib/access";

function loginRedirect(origin: string, error?: string) {
  const loginUrl = new URL("/dashboard/login", origin);
  if (error) loginUrl.searchParams.set("error", error);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Supabase sendir villu hingað í stað kóða þegar innskráning mistekst, t.d.
  // „Signups not allowed for this instance" þegar Google/Apple-reikningur á
  // engan notanda (nýskráning er lokuð). Sýnum þá skýr skilaboð.
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
  if (!code && oauthError) {
    const signupClosed = /signup/i.test(oauthError);
    return loginRedirect(origin, signupClosed ? "unauthorized" : "oauth");
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const access = await checkDashboardAccess(supabase, user?.email);
      if (access.allowed) {
        return NextResponse.redirect(new URL("/dashboard", origin));
      }

      await supabase.auth.signOut({ scope: "local" });
      return loginRedirect(origin, loginErrorFor(access));
    }
    return loginRedirect(origin, "oauth");
  }

  return loginRedirect(origin);
}
