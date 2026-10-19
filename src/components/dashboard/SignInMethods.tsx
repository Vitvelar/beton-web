"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BRANDS } from "@/lib/brand";
import { dashboardCopy, fill, type DashboardCopy, type DashboardLocale } from "@/lib/i18n/dashboard";
import { btn, spinner } from "@/lib/ui";
import {
  isAppleRelayEmail,
  toLinkErrorCode,
  type LinkErrorCode,
  type LinkedIdentity,
} from "@/lib/sign-in-methods";

// Innskráningarleiðir í Stillingum á app.rondva.com
// (plan/rondva/INNSKRANINGARLEIDIR-HONNUN.md D1, D4).
//
// Aðeins „tengja", engin „aftengja": aftenging getur fært aðalnetfang
// aðgangsins yfir á Apple-dulnefni, og meðan aðgangur byggir á netfangi gæti
// það læst notanda úti. Ekkert unlinkIdentity-kall er því til í viðmótinu.
//
// Tenging fer um OAuth (PKCE): linkIdentity sendir vafrann til Google/Apple,
// sem skilar honum á /dashboard/auth/link, og sú leið vísar alltaf hingað aftur
// með ?linked=1 eða ?link_error=<þekktur kóði> og #sign-in-methods (skrunar
// að þessu spjaldi).

type LinkProvider = "google" | "apple";

interface Props {
  locale: DashboardLocale;
  identities: LinkedIdentity[];
  /** RONDVA_APPLE_SIGNIN=1 (sama rofi og á innskráningarsíðunni). */
  appleEnabled: boolean;
}

function errorText(t: DashboardCopy["signInMethods"], code: LinkErrorCode): string {
  if (code === "identity_already_exists") return t.identityAlreadyExists;
  if (code === "manual_linking_disabled") return t.manualLinkingDisabled;
  return t.linkFailed;
}

export function SignInMethods({ locale, identities, appleEnabled }: Props) {
  const t = dashboardCopy(locale).signInMethods;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState<LinkProvider | null>(null);
  // Villa úr linkIdentity sjálfu (t.d. manual_linking_disabled) gengur fyrir
  // skilaboðum úr slóðinni.
  const [clientError, setClientError] = useState<LinkErrorCode | null>(null);

  // Niðurstaða tengingar kemur í slóðinni (?linked=1 / ?link_error=…). Hún er lesin EINU sinni
  // í state og slóðin svo hreinsuð, svo skilaboðin birtist ekki aftur við endurhleðslu.
  const [flash] = useState<{ kind: "ok" } | { kind: "error"; code: LinkErrorCode } | null>(() => {
    const queryError = searchParams.get("link_error");
    if (queryError !== null) return { kind: "error", code: toLinkErrorCode(queryError) };
    return searchParams.get("linked") === "1" ? { kind: "ok" } : null;
  });
  useEffect(() => {
    if (searchParams.get("linked") === null && searchParams.get("link_error") === null) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("linked");
    next.delete("link_error");
    const query = next.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}#sign-in-methods`, { scroll: false });
  }, [searchParams, pathname, router]);

  const errorCode = clientError ?? (flash?.kind === "error" ? flash.code : null);
  const message = errorCode
    ? { kind: "error" as const, text: errorText(t, errorCode) }
    : flash?.kind === "ok"
      ? { kind: "ok" as const, text: t.linked }
      : null;

  const hasGoogle = identities.some((i) => i.provider === "google");
  const hasApple = identities.some((i) => i.provider === "apple");

  async function link(provider: LinkProvider) {
    setLoading(provider);
    setClientError(null);
    try {
      const { error } = await createClient().auth.linkIdentity({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard/auth/link`,
          // Leyfir að velja hvaða Google-reikning á að tengja.
          ...(provider === "google" ? { queryParams: { prompt: "select_account" } } : {}),
        },
      });
      // Tókst → auth-js sendir vafrann áfram (window.location.assign).
      if (error) {
        setClientError(toLinkErrorCode(error.code));
        setLoading(null);
      }
    } catch {
      setClientError("oauth");
      setLoading(null);
    }
  }

  const busy = loading !== null;
  const buttonClass = btn("secondary");

  return (
    <section
      id="sign-in-methods"
      className="mt-6 scroll-mt-6 space-y-4 rounded-xl border border-concrete bg-surface p-6"
    >
      <div>
        <h2 className="text-lg font-semibold text-ink">{t.title}</h2>
        <p className="mt-1.5 text-sm text-fog">{t.intro}</p>
      </div>

      {identities.length > 0 ? (
        <ul className="divide-y divide-concrete rounded-lg border border-concrete">
          {identities.map((identity) => (
            <li
              key={identity.identity_id}
              className="flex items-center justify-between gap-4 px-3 py-2.5 text-sm"
            >
              <span className="font-semibold text-ink">
                {t.providers[identity.provider] ?? identity.provider}
              </span>
              <span className="min-w-0 truncate text-fog">
                {isAppleRelayEmail(identity.email) ? t.hiddenEmail : identity.email}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {message ? (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`text-sm ${message.kind === "ok" ? "text-success" : "text-danger"}`}
        >
          {message.text}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => link("google")}
          disabled={busy}
          aria-busy={loading === "google"}
          className={buttonClass}
        >
          {loading === "google" ? <span aria-hidden="true" className={spinner} /> : null}
          {loading === "google"
            ? fill(t.opening, { provider: t.providers.google })
            : hasGoogle
              ? t.linkAnotherGoogle
              : t.linkGoogle}
        </button>
        {appleEnabled ? (
          <button
            type="button"
            onClick={() => link("apple")}
            disabled={busy}
            aria-busy={loading === "apple"}
            className={buttonClass}
          >
            {loading === "apple" ? <span aria-hidden="true" className={spinner} /> : null}
            {loading === "apple"
              ? fill(t.opening, { provider: t.providers.apple })
              : hasApple
                ? t.linkAnotherApple
                : t.linkApple}
          </button>
        ) : null}
      </div>

      <div className="space-y-1 text-xs text-fog">
        <p>{t.linkHint}</p>
        <p>{fill(t.removeNote, { email: BRANDS.rondva.contactEmail })}</p>
      </div>
    </section>
  );
}
