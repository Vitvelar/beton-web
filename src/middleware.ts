import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { verifyAuthToken } from "@/lib/auth";

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // admin.beton.is root → redirect to /dashboard
  if (host.startsWith("admin.") && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // --- Dashboard routes: Supabase auth ---
  if (pathname.startsWith("/dashboard")) {
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

    return response;
  }

  // --- Marketing routes: SITE_PASSWORD auth ---
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword) {
    return NextResponse.next();
  }

  if (
    pathname === "/login" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/documents/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("beton-auth");
  if (await verifyAuthToken(authCookie?.value, sitePassword)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|documents).*)",
  ],
};
