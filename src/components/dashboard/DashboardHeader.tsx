"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/(dashboard)/actions";

export function DashboardHeader({ email }: { email: string }) {
  return (
    <header className="border-b border-concrete bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/images/beton-logo.webp"
            alt="Beton"
            width={80}
            height={28}
            className="h-7 w-auto"
          />
          <span className="text-xs font-mono text-fog uppercase tracking-wider">
            Stjórnborð
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-fog hidden sm:block">{email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-fog hover:text-ink transition-colors"
            >
              Útskrá
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
