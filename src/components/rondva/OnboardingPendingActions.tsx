"use client";

import { useState, useTransition } from "react";
import { checkCompanyStatus } from "@/app/(dashboard)/dashboard/onboarding/actions";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import type { DashboardLocale } from "@/lib/i18n/dashboard";
import { format, shellCopy } from "@/lib/i18n/dashboard-shell";
import { btn, spinner } from "@/lib/ui";

// Hnappar biðsíðunnar: „Athuga aftur“ (hnappur með biðstöðu og svari. Samþykkt → heil síðuhleðsla á
// stjórnborðið; enn í yfirferð → „athugað kl. …“ (role=status); villa → role=alert) og „Skrá út“.
export function OnboardingPendingActions({
  locale,
  checkLabel,
  signOutLabel,
}: {
  locale: DashboardLocale;
  checkLabel: string;
  signOutLabel: string;
}) {
  const t = shellCopy(locale).onboarding;
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "status" | "error"; text: string } | null>(null);
  // Eftir að `next` er komið fer vafrinn burt; hnappurinn helst óvirkur á meðan.
  const [leaving, setLeaving] = useState(false);

  function check() {
    setMessage(null);
    startTransition(async () => {
      let result: Awaited<ReturnType<typeof checkCompanyStatus>>;
      try {
        result = await checkCompanyStatus();
      } catch {
        setMessage({ kind: "error", text: t.checkFailed });
        return;
      }
      if (result.next) {
        setLeaving(true);
        window.location.assign(result.next);
      } else if (result.reviewing) {
        const time = new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
        setMessage({ kind: "status", text: format(t.stillReviewing, { time }) });
      } else {
        setMessage({ kind: "error", text: result.error ?? t.checkFailed });
      }
    });
  }

  const busy = pending || leaving;

  return (
    <>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={check}
          disabled={busy}
          aria-busy={busy}
          className={btn("primary", "lg", "w-full")}
        >
          {busy ? <span className={spinner} aria-hidden="true" /> : null}
          {busy ? t.checkingAgain : checkLabel}
        </button>
        <SignOutButton
          label={signOutLabel}
          pendingLabel={t.signingOut}
          withSpinner
          formClassName="w-full"
          className={btn("secondary", "lg", "w-full bg-surface")}
        />
      </div>
      {/* Svæðið er alltaf í DOM-inu svo skjálesari tilkynni breytinguna. */}
      <p
        role={message?.kind === "error" ? "alert" : "status"}
        className={`mt-3 text-sm ${message?.kind === "error" ? "text-danger" : "text-fog"}`}
      >
        {message?.text}
      </p>
    </>
  );
}
