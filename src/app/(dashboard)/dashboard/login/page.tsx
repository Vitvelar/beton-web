"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isAllowedEmail } from "@/lib/allowed-users";

export default function DashboardLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [oauthLoading, setOauthLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoading = oauthLoading || otpLoading;
  const queryError =
    searchParams.get("error") === "unauthorized"
      ? "Þetta netfang hefur ekki aðgang að Beton stjórnborðinu."
      : null;

  async function handleGoogleSignIn() {
    setOauthLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setOauthLoading(false);
    }
  }

  async function handleSendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setError(null);

    if (!isAllowedEmail(normalizedEmail)) {
      setError("Þetta netfang hefur ekki aðgang að Beton stjórnborðinu.");
      return;
    }

    setOtpLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
      },
    });

    setOtpLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setEmail(normalizedEmail);
    setCodeSent(true);
  }

  async function handleVerifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const token = code.trim();
    setError(null);

    if (!isAllowedEmail(normalizedEmail)) {
      setError("Þetta netfang hefur ekki aðgang að Beton stjórnborðinu.");
      return;
    }

    if (token.length !== 6) {
      setError("Sláðu inn 6-stafa kóðann úr tölvupóstinum.");
      return;
    }

    setOtpLoading(true);

    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token,
      type: "email",
    });

    if (error) {
      setError(error.message);
      setOtpLoading(false);
      return;
    }

    if (!isAllowedEmail(user?.email)) {
      await supabase.auth.signOut();
      setError("Þetta netfang hefur ekki aðgang að Beton stjórnborðinu.");
      setOtpLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-paper">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-concrete p-8">
          <div className="text-center mb-8">
            <Image
              src="/images/beton-logo.webp"
              alt="Beton ehf."
              width={44}
              height={44}
              priority
              className="mx-auto mb-4"
            />
            <p className="text-sm text-fog">Stjórnborð — innskráning</p>
          </div>

          <div className="space-y-5">
            <form
              className="space-y-3 rounded-xl border border-concrete bg-paper-alt p-4"
              onSubmit={codeSent ? handleVerifyCode : handleSendCode}
            >
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-ink">
                  Netfang
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={codeSent || isLoading}
                  placeholder="beton@beton.is"
                  className="mt-1 w-full rounded-lg border border-concrete bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none focus:border-ink disabled:bg-paper"
                  required
                />
              </div>

              {codeSent && (
                <div>
                  <label htmlFor="code" className="block text-sm font-semibold text-ink">
                    Kóði
                  </label>
                  <input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="mt-1 w-full rounded-lg border border-concrete bg-white px-3 py-2 text-center text-lg font-semibold tracking-[0.35em] text-ink shadow-sm outline-none focus:border-ink"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ink/90 disabled:opacity-50"
              >
                {otpLoading
                  ? "Hleð..."
                  : codeSent
                    ? "Staðfesta kóða"
                    : "Senda innskráningarkóða"}
              </button>

              {codeSent && (
                <button
                  type="button"
                  onClick={() => {
                    setCodeSent(false);
                    setCode("");
                    setError(null);
                  }}
                  className="w-full text-sm font-semibold text-fog hover:text-ink"
                >
                  Breyta netfangi
                </button>
              )}
            </form>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-concrete" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-fog">
                eða
              </span>
              <div className="h-px flex-1 bg-concrete" />
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-concrete bg-white px-6 py-3 text-sm font-semibold text-ink shadow-sm hover:bg-paper-alt transition-colors disabled:opacity-50"
            >
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
              {oauthLoading ? "Hleð..." : "Innskrá með Google"}
            </button>
          </div>

          {(error || queryError) && (
            <p className="mt-4 text-sm text-center text-sev-danger">
              {error ?? queryError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
