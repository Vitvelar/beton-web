"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BRANDS } from "@/lib/brand";

// Innskráning á app.rondva.com. Aðeins Google og Apple (þegar kveikt er á
// Apple): viðskiptavinir skrá sig inn með reikningnum sem fyrirtækið þeirra
// var samþykkt með. Nýskráning er lokuð í Supabase, svo óþekktur reikningur
// endar aftur hér með ?error=unauthorized.
//
// Litir koma úr Beton-táknunum sem html[data-brand="rondva"] endurskilgreinir
// (globals.css): ink = #101418, navy = Rondva Blue, paper, concrete = line,
// fog = muted.

type Provider = "google" | "apple";

const R = BRANDS.rondva;

// Villur sem þýða „innskráður en án aðgangs" (sjá src/lib/access.ts).
const DENIALS = new Set(["unauthorized", "pending", "suspended"]);

const ERRORS: Record<string, { title: string; body: React.ReactNode }> = {
  unauthorized: {
    title: "No Rondva account for that sign-in",
    body: (
      <>
        Rondva is invite-only while we build it with working inspectors. Try the account your
        company was approved with, or{" "}
        <a href={`${R.marketingUrl}/#waitlist`} className="font-semibold text-ink underline underline-offset-4">
          join the waitlist
        </a>
        .
      </>
    ),
  },
  pending: {
    title: "Your company is awaiting approval",
    body: "We review every new company before opening access. You'll get an email as soon as your account is active.",
  },
  suspended: {
    title: "This company account is paused",
    body: (
      <>
        Access has been paused. Write to{" "}
        <a href={`mailto:${R.contactEmail}`} className="font-semibold text-ink underline underline-offset-4">
          {R.contactEmail}
        </a>{" "}
        and we&apos;ll sort it out.
      </>
    ),
  },
  oauth: {
    title: "Sign-in didn't finish",
    body: "The sign-in window was closed or timed out. Please try again.",
  },
};

export function RondvaLogin({ appleEnabled }: { appleEnabled: boolean }) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const errorKey = searchParams.get("error");
  const queryError = errorKey ? (ERRORS[errorKey] ?? ERRORS.oauth) : null;

  // Innskráður notandi án aðgangs lendir hér með ?error=… — hreinsum þá
  // staðbundnu lotuna svo hann geti valið annan reikning.
  useEffect(() => {
    if (errorKey && DENIALS.has(errorKey)) {
      void createClient().auth.signOut({ scope: "local" });
    }
  }, [errorKey]);

  async function signIn(provider: Provider) {
    setLoading(provider);
    setError(null);

    const { error } = await createClient().auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard/auth/callback`,
        // Leyfir að velja annan Google-reikning, t.d. eftir höfnun.
        ...(provider === "google" ? { queryParams: { prompt: "select_account" } } : {}),
      },
    });

    if (error) {
      setError(error.message);
      setLoading(null);
    }
  }

  const busy = loading !== null;

  return (
    <div className="flex min-h-screen flex-col bg-paper lg:flex-row">
      {/* Vinstri: dökkt teikniblað með fyrirsögn kynningarsíðunnar (aðeins á stórum skjám). */}
      <aside
        className="relative hidden overflow-hidden text-white lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:p-14 xl:p-16"
        style={{
          backgroundColor: "#101418",
          backgroundImage:
            "linear-gradient(to right, rgba(250,251,252,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(250,251,252,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      >
        <div
          className="pointer-events-none absolute -left-40 -top-48 h-[520px] w-[520px] rounded-full blur-[140px]"
          style={{ backgroundColor: "rgba(27,79,216,0.28)" }}
          aria-hidden="true"
        />
        <a href={R.marketingUrl} className="relative inline-flex w-fit" aria-label="Rondva home">
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG lockup */}
          <img src="/rondva/logo-white.svg" alt="Rondva" width={137} height={39} className="h-auto w-[137px]" />
        </a>

        <div className="relative max-w-[34rem]">
          <p className="rv-serif text-[38px] leading-[1.06] xl:text-[46px]">
            Walk the property.
            <br />
            <em className="font-normal italic text-navy">Rondva drafts the report.</em>
          </p>
          <p className="mt-6 text-base leading-relaxed text-white/65">
            Your inspections, photos and report drafts, synced from the field app.
          </p>
        </div>

        <p className="relative text-xs text-white/40">
          &copy; 2026 {R.company}
        </p>
      </aside>

      {/* Hægri: innskráning */}
      <main className="flex flex-1 flex-col px-6 py-10 sm:px-10">
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center">
          <a href={R.marketingUrl} className="mb-12 inline-flex w-fit lg:hidden" aria-label="Rondva home">
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG lockup */}
            <img src="/rondva/logo.svg" alt="Rondva" width={137} height={39} className="h-auto w-[120px]" />
          </a>

          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy">Dashboard</p>
          <h1 className="rv-serif mt-3 text-[34px] leading-tight text-ink">Sign in to Rondva</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-fog">
            Use the Google or Apple account your company was approved with.
          </p>

          {queryError && !error && (
            <div
              role="alert"
              className="mt-8 rounded-xl border border-concrete bg-white px-4 py-3.5 text-sm leading-relaxed text-fog"
            >
              <p className="font-semibold text-ink">{queryError.title}</p>
              <p className="mt-1">{queryError.body}</p>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-8 rounded-xl border border-sev-danger/30 bg-white px-4 py-3.5 text-sm text-sev-danger">
              {error}
            </p>
          )}

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => signIn("google")}
              disabled={busy}
              aria-busy={loading === "google"}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-concrete-dk bg-white px-6 text-[15px] font-semibold text-ink shadow-[0_1px_2px_rgba(16,20,24,0.06)] transition-colors hover:border-ink/40 hover:bg-paper-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleMark />
              {loading === "google" ? "Opening Google…" : "Continue with Google"}
            </button>

            {appleEnabled && (
              <button
                type="button"
                onClick={() => signIn("apple")}
                disabled={busy}
                aria-busy={loading === "apple"}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-black px-6 text-[15px] font-semibold text-white transition-colors hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60"
              >
                <AppleMark />
                {loading === "apple" ? "Opening Apple…" : "Continue with Apple"}
              </button>
            )}
          </div>

          <div className="mt-10 border-t border-concrete pt-6 text-sm leading-relaxed text-fog">
            New to Rondva? We&apos;re onboarding inspectors in small groups.{" "}
            <a
              href={`${R.marketingUrl}/#waitlist`}
              className="font-semibold text-ink underline decoration-concrete-dk underline-offset-4 transition-colors hover:decoration-ink"
            >
              Join the waitlist
            </a>
          </div>
        </div>

        <p className="mx-auto mt-10 w-full max-w-[400px] text-xs leading-relaxed text-fog/80">
          By signing in you agree to how we handle your data in the{" "}
          <a href={`${R.marketingUrl}/privacy`} className="underline underline-offset-2 hover:text-ink">
            privacy policy
          </a>
          .
        </p>
      </main>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
  );
}

function AppleMark() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0 -translate-y-px" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  );
}
