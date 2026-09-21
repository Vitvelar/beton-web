import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAllowedEmail } from "@/lib/allowed-users";
import { isWorkerRequest, WORKER_TOKEN_HEADER } from "@/lib/report/shared";
import { resolveHost, RONDVA_ROUTE_PREFIX } from "@/lib/brand";

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

  // Hýsilkortið (src/lib/brand.ts) segir hvaða vörumerki og hlutverk lénið
  // hefur. Óþekktur hýsill (preview, localhost) → null → engar tilvísanir.
  const hostConfig = resolveHost(host);

  // Stjórnborðið býr á app-léni vörumerkisins (admin.beton.is / app.rondva.com).
  // Ef einhver opnar /dashboard á markaðssíðu beinum við yfir á það lén.
  if (
    hostConfig?.role === "marketing" &&
    hostConfig.adminHost &&
    pathname.startsWith("/dashboard")
  ) {
    return NextResponse.redirect(
      `https://${hostConfig.adminHost}${pathname}${search}`
    );
  }

  // app-lén: rót → /dashboard
  if (hostConfig?.role === "app" && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // app.rondva.com þjónar aðeins stjórnborðinu og API. Allt annað (t.d. Beton-
  // markaðssíðurnar /samband, /verdskra) á ekki heima þar — sendum á rondva.com.
  if (
    hostConfig?.brand === "rondva" &&
    hostConfig.role === "app" &&
    !pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/api/")
  ) {
    return NextResponse.redirect(`https://rondva.com${pathname}${search}`);
  }

  // rondva.com kynningarsíðan býr undir /rondva/* í app/ (eigið rótarútlit,
  // enska, eigið letur). Endurskrifum slóðina — notandinn sér hana aldrei.
  if (hostConfig?.brand === "rondva" && hostConfig.role === "marketing") {
    if (pathname.startsWith("/api/")) return NextResponse.next();
    if (pathname.startsWith(RONDVA_ROUTE_PREFIX)) return NextResponse.next();
    const target = pathname === "/" ? RONDVA_ROUTE_PREFIX : `${RONDVA_ROUTE_PREFIX}${pathname}`;
    return NextResponse.rewrite(new URL(`${target}${search}`, request.url));
  }

  // Rondva-síðurnar mega ekki leka út á Beton-lénin (beton.is/rondva). Preview
  // og localhost (hostConfig === null) fá að sjá þær til prófunar.
  if (hostConfig && hostConfig.brand !== "rondva" && pathname.startsWith(RONDVA_ROUTE_PREFIX)) {
    return new NextResponse(null, { status: 404 });
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
    // favicon.ico fer í gegnum proxy svo rondva.com fái eigið tákn; Beton-lénin
    // fá NextResponse.next() eins og áður.
    "/((?!_next/static|_next/image|images|documents).*)",
  ],
};
