"use client";

import { useEffect, useSyncExternalStore } from "react";

// Síðasta varnarlínan: bilun í rótarútliti (t.d. (dashboard)/layout.tsx) fer hingað. Þessi skrá
// kemur í stað rótarútlitsins, þarf eigin <html>/<body> og getur ekki treyst á globals.css né
// letur — því er allt inline. Vörumerkið kemur af hýslinum: rondva.com / app.rondva.com →
// ensk Rondva-útgáfa, annað → íslensk Beton-útgáfa. Á þjóninum er hýsillinn óþekktur og
// Beton-útgáfan birtist; React skiptir yfir í Rondva á biðlaranum.
type Look = "beton" | "rondva";

const noop = () => () => {};
const readLook = (): Look => (/(^|\.)rondva\.com$/i.test(window.location.hostname) ? "rondva" : "beton");
const serverLook = (): Look => "beton";

const COPY = {
  beton: {
    lang: "is",
    title: "Eitthvað fór úrskeiðis",
    body: "Ekki tókst að hlaða síðuna. Reyndu aftur; ef það dugar ekki skaltu koma aftur eftir smástund.",
    retry: "Reyna aftur",
    reference: "Tilvísun",
  },
  rondva: {
    lang: "en",
    title: "Something went wrong",
    body: "The page couldn't be loaded. Try again, and if that doesn't help, come back in a few minutes.",
    retry: "Try again",
    reference: "Reference",
  },
} as const;

const LOOK = {
  beton: { bg: "#e0e0db", ink: "#000000", muted: "#4a4a44", accent: "#003fba", accentText: "#e0e0db", font: "system-ui, -apple-system, 'Segoe UI', sans-serif", radius: "9999px" },
  rondva: { bg: "#fafbfc", ink: "#101418", muted: "#5a6672", accent: "#1b4fd8", accentText: "#ffffff", font: "system-ui, -apple-system, 'Segoe UI', sans-serif", radius: "9999px" },
} as const;

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const look = useSyncExternalStore(noop, readLook, serverLook);
  useEffect(() => {
    console.error(error);
  }, [error]);

  const t = COPY[look];
  const c = LOOK[look];

  return (
    <html lang={t.lang}>
      <body style={{ margin: 0, background: c.bg, color: c.ink, fontFamily: c.font }}>
        <main
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            maxWidth: "32rem",
            margin: "0 auto",
            padding: "1.5rem 1rem",
          }}
        >
          <title>{t.title}</title>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>{t.title}</h1>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", lineHeight: 1.6, color: c.muted }}>{t.body}</p>
          {error.digest ? (
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: c.muted }}>
              {t.reference}: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              marginTop: "1.5rem",
              minHeight: "2.75rem",
              padding: "0 1.5rem",
              border: 0,
              borderRadius: c.radius,
              background: c.accent,
              color: c.accentText,
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
