import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

  // Marketing routes: no auth required
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|documents).*)",
  ],
};
