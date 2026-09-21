"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { CONSENT_CHANGED_EVENT, readConsent, type ConsentState } from "@/lib/rondva-consent";

// Mælitæki rondva.com — hlaðin AÐEINS eftir samþykki (sjá ConsentBanner).
//   Vercel Web Analytics: kökulaust, engin samþykkisþörf, alltaf á.
//   Google Analytics 4:   analytics-samþykki  (NEXT_PUBLIC_RONDVA_GA_ID)
//   Meta Pixel:           marketing-samþykki  (NEXT_PUBLIC_RONDVA_META_PIXEL_ID)

const GA_ID = process.env.NEXT_PUBLIC_RONDVA_GA_ID;
const PIXEL_ID = process.env.NEXT_PUBLIC_RONDVA_META_PIXEL_ID;

export function RondvaAnalytics() {
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    setConsent(readConsent());
    const onChange = (e: Event) => setConsent((e as CustomEvent<ConsentState>).detail);
    window.addEventListener(CONSENT_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, onChange);
  }, []);

  const analyticsOk = !!consent?.analytics;
  const marketingOk = !!consent?.marketing;

  return (
    <>
      <VercelAnalytics />
      {GA_ID && analyticsOk && <GoogleAnalytics gaId={GA_ID} />}
      {PIXEL_ID && marketingOk && (
        <Script id="rv-meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
