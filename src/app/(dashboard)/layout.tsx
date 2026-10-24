import type { Metadata, Viewport } from "next";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardRealtimeRefresh } from "@/components/dashboard/DashboardRealtimeRefresh";
import { BetonHtml } from "@/components/BetonHtml";
import { RondvaAppHtml } from "@/components/rondva/RondvaAppHtml";
import { betonMetadata } from "@/lib/beton-metadata";
import { shellCopy } from "@/lib/i18n/dashboard-shell";
import { btn } from "@/lib/ui";
import { checkDashboardAccess } from "@/lib/access";
import { getDashboardLocale, getRequestBrand, getRequestUser } from "@/lib/request-brand";
import { BRANDS } from "@/lib/brand";

// Sama stjórnborð þjónar tveimur vörumerkjum eftir hýsli (src/lib/brand.ts):
// admin.beton.is → Beton (íslenska, óbreytt), app.rondva.com → Rondva-útlit.

// admin.beton.is er ekki markaðssíða: engin canonical/OG/Twitter-spjöld frá beton.is
// (þau gerðu stjórnborðið að afriti af forsíðunni) og ekki í leitarvélum. Táknin haldast.
const betonDashboardMetadata: Metadata = {
  metadataBase: new URL(BRANDS.beton.appUrl),
  title: {
    default: "Stjórnborð | Beton ehf.",
    template: "%s | Stjórnborð — Beton ehf.",
  },
  description: shellCopy("is").meta.betonDescription,
  applicationName: "Beton ehf.",
  icons: betonMetadata.icons,
  robots: { index: false, follow: false },
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
  const locale = await getDashboardLocale();
  const html = (content: React.ReactNode) =>
    brand === "rondva" ? (
      <RondvaAppHtml lang={locale}>{content}</RondvaAppHtml>
    ) : (
      <BetonHtml>{content}</BetonHtml>
    );

  // The cookie client uses NEXT_PUBLIC_* which bake in EMPTY on the beton.is
  // Docker image — so getUser() can throw there. The worker-token report render
  // legitimately reaches this layout on beton.is; treat any failure as "no
  // session" and render children bare (the report page uses the service client).
  let user: User | null = null;
  let allowed = false;
  try {
    user = await getRequestUser();
    // Innskráður en án aðgangs (t.d. fyrirtæki bíður samþykkis) sér aðeins
    // innskráningarsíðuna með skilaboðum — ekki stjórnborðshausinn.
    if (user) allowed = (await checkDashboardAccess(await createClient(), user.email, brand)).allowed;
  } catch {
    user = null;
  }

  if (!user || !allowed) {
    return html(children);
  }

  return html(
    <div className="min-h-dvh bg-paper">
      {/* Fyrsti fókusstaður: sleppir haus og valmynd (WCAG 2.4.1). Er utan skjás þar til hann fær fókus. */}
      <a
        href="#content"
        className={btn("primary", "md", "fixed left-4 top-4 z-50 -translate-y-24 focus:translate-y-0 motion-reduce:transition-none")}
      >
        {shellCopy(locale).skipToContent}
      </a>
      <DashboardRealtimeRefresh />
      <DashboardHeader email={user.email ?? ""} brand={brand} locale={locale} />
      <main id="content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 focus:outline-none sm:px-6">
        {children}
      </main>
    </div>
  );
}
