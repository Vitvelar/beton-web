"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { shellCopy } from "@/lib/i18n/dashboard-shell";
import { btn, spinner } from "@/lib/ui";

// Aðeins Google. Tölvupóstskóðinn var fjarlægður 2026-09-26: hann virkaði
// aldrei (póstsniðmátið sendi engan kóða, Supabase-pósturinn nær aðeins til
// teymisins og kóðinn var 8 stafir en reiturinn tók 6) og enginn notaði hann.

export function BetonLogin() {
  const searchParams = useSearchParams();
  const t = shellCopy("is").betonLogin;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryError =
    new Map([
      ["unauthorized", t.errorUnauthorized],
      ["oauth", t.errorOauth],
    ]).get(searchParams.get("error") ?? "") ?? null;

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard/auth/callback`,
        },
      });

      if (error) {
        // Hrá villan (á ensku) fer í stjórnborðsskrána, ekki til notandans.
        console.error("BetonLogin: signInWithOAuth failed:", error.message);
        setError(t.errorOauth);
        setLoading(false);
      }
    } catch (caught) {
      console.error("BetonLogin: sign-in threw:", caught);
      setError(t.errorOauth);
      setLoading(false);
    }
  }

  const message = error ?? queryError;

  return (
    <main id="content" className="flex min-h-dvh items-center justify-center bg-paper px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-surface p-8 shadow-sm ring-1 ring-concrete">
          <div className="mb-8 text-center">
            <Image
              src="/images/beton-logo.webp"
              alt={t.logoAlt}
              width={44}
              height={44}
              priority
              className="mx-auto mb-4"
            />
            <h1 className="text-xl font-semibold text-ink">{t.heading}</h1>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            aria-busy={loading}
            aria-describedby={message ? "login-error" : undefined}
            className={btn("secondary", "lg", "w-full gap-3 bg-surface")}
          >
            {loading ? (
              <span className={spinner} aria-hidden="true" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {loading ? t.googleOpening : t.googleSignIn}
          </button>

          {/* Villan stendur beint undir hnappnum sem olli henni. */}
          {message ? (
            <p id="login-error" role="alert" className="mt-4 text-center text-sm text-danger">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
