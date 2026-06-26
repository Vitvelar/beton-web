import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAllowedEmail } from "@/lib/allowed-users";
import { isWorkerRequest, WORKER_TOKEN_HEADER } from "@/lib/report/shared";

function createSupabaseProxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  return { supabase, response };
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // Bakgrunns-worker rendar skýrslu Á beton.is með x-report-worker-token. Þá
  // MÁ EKKI redirecta /dashboard yfir á admin.beton.is (þar er hvorki Chromium
  // né service-role env) — hleypum þeirri einu beiðni í gegn svo render keyri hér.
  const isReportPath = /^\/dashboard\/[^/]+\/report(?:\/pdf)?$/.test(pathname);
  if (isReportPath && isWorkerRequest(request.headers.get(WORKER_TOKEN_HEADER))) {
    return NextResponse.next();
  }

  // Stjórnborðið býr á admin.beton.is. Ef einhver opnar /dashboard á
  // markaðssíðunni (beton.is) beinum við yfir á admin-lénið.
  const isMarketingHost = host === "beton.is" || host === "www.beton.is";
  if (isMarketingHost && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(`https://admin.beton.is${pathname}${search}`);
  }

  // admin.beton.is root → redirect to /dashboard
  if (host.startsWith("admin.") && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // --- Dashboard routes: Supabase auth ---
  if (pathname.startsWith("/dashboard")) {
    const hasBearerAuthorization =
      request.headers
        .get("authorization")
        ?.toLowerCase()
        .startsWith("bearer ") ?? false;
    const isBearerReportRequest =
      /^\/dashboard\/[^/]+\/report(?:\/pdf)?$/.test(pathname);

    // Mobile appið sækir server-rendered PDF með Supabase access token í
    // Authorization header. Hleypum aðeins report/report-pdf leiðunum í gegn;
    // þær nota RLS til að staðfesta að notandinn eigi skoðunina.
    if (hasBearerAuthorization && isBearerReportRequest) {
      return NextResponse.next();
    }

    // Allow login page and auth callback without session
    if (
      pathname === "/dashboard/login" ||
      pathname.startsWith("/dashboard/auth/")
    ) {
      return NextResponse.next();
    }

    const { supabase, response } = createSupabaseProxy(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/dashboard/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    if (!isAllowedEmail(user.email)) {
      const loginUrl = new URL("/dashboard/login", request.url);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // Marketing routes: no auth required
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|documents).*)",
  ],
};
