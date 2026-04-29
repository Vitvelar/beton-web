import { cookies } from "next/headers";
import { authCookieMaxAgeSeconds, createAuthToken } from "@/lib/auth";

export async function POST(request: Request) {
  const { password } = await request.json();
  const sitePassword = process.env.SITE_PASSWORD;

  if (!sitePassword || password !== sitePassword) {
    return Response.json({ error: "Rangt lykilorð" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set("beton-auth", await createAuthToken(sitePassword), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: authCookieMaxAgeSeconds(),
  });

  return Response.json({ success: true });
}
