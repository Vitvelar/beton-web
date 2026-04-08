import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const sitePassword = process.env.SITE_PASSWORD;

  // If no password is set, allow access (production mode)
  if (!sitePassword) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Allow access to login page, API routes, static files, and images
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

  // Check for auth cookie
  const authCookie = request.cookies.get("beton-auth");
  if (authCookie?.value === sitePassword) {
    return NextResponse.next();
  }

  // Redirect to login
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|documents).*)",
  ],
};
