import type { Metadata, Viewport } from "next";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardRealtimeRefresh } from "@/components/dashboard/DashboardRealtimeRefresh";
import { BetonHtml } from "@/components/BetonHtml";
import { RondvaAppHtml } from "@/components/rondva/RondvaAppHtml";
import { betonMetadata } from "@/lib/beton-metadata";
import { checkDashboardAccess } from "@/lib/access";
import { getRequestBrand } from "@/lib/request-brand";
import { BRANDS } from "@/lib/brand";

// Sama stjórnborð þjónar tveimur vörumerkjum eftir hýsli (src/lib/brand.ts):
// admin.beton.is → Beton (íslenska, óbreytt), app.rondva.com → Rondva-útlit.

const betonDashboardMetadata: Metadata = {
  ...betonMetadata,
  title: {
    default: "Stjórnborð | Beton ehf.",
    template: "%s | Stjórnborð — Beton ehf.",
  },
};

const rondvaDashboardMetadata: Metadata = {
  metadataBase: new URL(BRANDS.rondva.appUrl),
  title: {
    default: "Rondva",
    template: "%s — Rondva",
  },
  description: "Sign in to Rondva, the field app and report studio for property inspectors.",
  applicationName: "Rondva",
  icons: {
    icon: [
      { url: "/rondva/favicon.ico", sizes: "48x48" },
      { url: "/rondva/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/rondva/favicon-180.png",
  },
  // Stjórnborðið á ekki heima í leitarvélum.
  robots: { index: false, follow: false },
};

export async function generateMetadata(): Promise<Metadata> {
  return (await getRequestBrand()) === "rondva" ? rondvaDashboardMetadata : betonDashboardMetadata;
}

export async function generateViewport(): Promise<Viewport> {
  return (await getRequestBrand()) === "rondva" ? { themeColor: "#101418" } : {};
}

// The dashboard is auth-gated, user-specific content — never prerender it. This
// also keeps /dashboard/login (which uses useSearchParams) out of static export,
// which otherwise fails the build with a missing-suspense error.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const brand = await getRequestBrand();
  const Html = brand === "rondva" ? RondvaAppHtml : BetonHtml;

  // The cookie client uses NEXT_PUBLIC_* which bake in EMPTY on the beton.is
  // Docker image — so getUser() can throw there. The worker-token report render
  // legitimately reaches this layout on beton.is; treat any failure as "no
  // session" and render children bare (the report page uses the service client).
  let user: User | null = null;
  let allowed = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
    // Innskráður en án aðgangs (t.d. fyrirtæki bíður samþykkis) sér aðeins
    // innskráningarsíðuna með skilaboðum — ekki stjórnborðshausinn.
    if (user) allowed = (await checkDashboardAccess(supabase, user.email, brand)).allowed;
  } catch {
    user = null;
  }

  if (!user || !allowed) {
    return <Html>{children}</Html>;
  }

  return (
    <Html>
      <div className="min-h-screen bg-paper">
        <DashboardRealtimeRefresh />
        <DashboardHeader email={user.email ?? ""} brand={brand} />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
    </Html>
  );
}
