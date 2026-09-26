"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/(dashboard)/actions";
import type { Brand } from "@/lib/brand";

const COPY = {
  beton: { section: "Stjórnborð", settings: "Stillingar", signOut: "Útskrá" },
  rondva: { section: "Dashboard", settings: "Settings", signOut: "Sign out" },
} as const;

export function DashboardHeader({ email, brand = "beton" }: { email: string; brand?: Brand }) {
  const t = COPY[brand];

  return (
    <header className="border-b border-concrete bg-white print:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          {brand === "rondva" ? (
            // eslint-disable-next-line @next/next/no-img-element -- static SVG lockup
            <img src="/rondva/logo.svg" alt="Rondva" width={98} height={28} className="h-7 w-auto" />
          ) : (
            <Image
              src="/images/beton-logo.webp"
              alt="Beton"
              width={80}
              height={28}
              className="h-7 w-auto"
            />
          )}
          <span className="text-xs font-mono text-fog uppercase tracking-wider">
            {t.section}
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings" className="text-sm text-fog hover:text-ink transition-colors">
            {t.settings}
          </Link>
          <span className="text-sm text-fog hidden sm:block">{email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-fog hover:text-ink transition-colors"
            >
              {t.signOut}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
