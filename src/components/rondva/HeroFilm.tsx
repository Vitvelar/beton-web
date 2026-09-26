"use client";

// Kynningarmynd Rondva, á fullum skjá efst á forsíðu (15 s, 60 fps, hljóðlaus, lykkja).
// Tvær útgáfur af sömu mynd, valdar eftir stefnu skjásins: "wide" (16:9, liggjandi skjár)
// og "tall" (9:16, standandi — sími/spjaldtölva; sýndarmyndavél rammar hvert skot upp á
// nýtt og kaflaheitin eru í borða neðst með öruggri spássíu). Frumskrár og endurgerð:
// plan/rondva/hero-film/.
//
// - Fyllir kassann sinn (cover) en sker aldrei meira en ~3,5 % af hvorri hlið; ef skjárinn
//   víkur meira frá hlutföllum myndarinnar fyllir blekflöturinn og teikninetið afganginn
//   (mjúkir jaðrar, sjá .rv-film í rondva.css).
// - Þjónninn birtir veggspjaldið (rammi 165, t = 2,75 s) aðeins fyrir útgáfuna sem passar
//   (<picture> með media), svo hin sækist aldrei. Myndbandið festist aðeins þegar útgáfan
//   passar og hreyfing er leyfð, og byrjar á sama ramma og veggspjaldið.
// - iOS Safari sækir engin gögn í myndband sem er í hléi, svo `seeked` kemur aldrei ef beðið
//   er eftir því: play() er kallað strax eftir að byrjunartími er settur. `muted` er líka
//   sett sem eigind (React setur bara eiginleikann) — iOS krefst þess fyrir sjálfspilun.
//   Ef spilun er hindruð (orkusparnaður, gagnasparnaður) birtist veggspjaldið, aldrei svartur flötur.
// - prefers-reduced-motion: kyrrmynd af skýrslusíðunum; myndbandið er aldrei sótt.
import { useEffect, useRef, useState } from "react";

const BASE = "/rondva/hero";
const START_AT = 2.75; // sekúndur — sami rammi og veggspjöldin
const BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

const VARIANTS = {
  wide: {
    media: "(orientation: landscape)",
    ratio: 16 / 9,
    width: 1920,
    height: 1080,
    poster: "rondva-hero-poster-product",
    still: "rondva-hero-reduced-motion",
    // WebM fyrst (2,5 MB á móti 4,2 MB); bæði lykkjuskil innan 4 litastiga.
    sources: [
      { src: "rondva-hero-1080p60.webm", type: "video/webm" },
      { src: "rondva-hero-1080p60.mp4", type: "video/mp4" },
    ],
  },
  tall: {
    media: "(orientation: portrait)",
    ratio: 9 / 16,
    width: 1080,
    height: 1920,
    poster: "rondva-hero-tall-poster",
    still: "rondva-hero-tall-reduced-motion",
    sources: [{ src: "rondva-hero-tall-720x1280.mp4", type: "video/mp4" }],
  },
} as const;

const POSTER_ALT = "Rondva: a phone with the rooms of a flat next to a drafted floor plan rising into 3D.";
const STILL_ALT =
  "Four report pages from a Rondva inspection, one per room, each with a severity label and the inspector's company name.";

type Mode = "pending" | "off" | "reduced" | "motion" | "blocked";

export function HeroFilm({ variant, className }: { variant: keyof typeof VARIANTS; className?: string }) {
  const V = VARIANTS[variant];
  const ref = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<Mode>("pending");

  useEffect(() => {
    const fits = window.matchMedia(V.media);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setMode((m) => (!fits.matches ? "off" : reduce.matches ? "reduced" : m === "blocked" ? "blocked" : "motion"));
    update();
    fits.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      fits.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, [V.media]);

  useEffect(() => {
    const v = ref.current;
    if (!v || mode !== "motion") return;
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    let alive = true;
    const play = () => {
      const p = v.play();
      // Aðeins raunveruleg hindrun (NotAllowedError/NotSupportedError) sýnir veggspjaldið;
      // AbortError (truflað af hleðslu) er hunsað.
      if (p)
        p.catch((e: unknown) => {
          const name = e instanceof DOMException ? e.name : "";
          if (alive && v.paused && (name === "NotAllowedError" || name === "NotSupportedError")) setMode("blocked");
        });
    };
    const start = () => {
      try {
        v.currentTime = START_AT;
      } catch {
        // sumir vafrar leyfa ekki tímasetningu fyrr en lýsigögn eru komin
      }
      play();
    };
    if (v.readyState >= 1) start();
    else v.addEventListener("loadedmetadata", start, { once: true });
    // Vafrar gera hlé á myndböndum í bakgrunnsflipa; höldum áfram þegar síðan sést aftur.
    const onVisible = () => {
      if (document.visibilityState === "visible" && v.paused) play();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      v.removeEventListener("loadedmetadata", start);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [mode]);

  // Hindruð spilun (bakgrunnsflipi, orkusparnaður): reynum aftur þegar síðan sést eða við
  // fyrstu snertingu/smell — þá telst notandinn hafa leyft spilun.
  useEffect(() => {
    if (mode !== "blocked") return;
    const retry = () => {
      if (document.visibilityState === "visible") setMode("motion");
    };
    document.addEventListener("visibilitychange", retry);
    window.addEventListener("pointerdown", retry, { once: true });
    window.addEventListener("keydown", retry, { once: true });
    return () => {
      document.removeEventListener("visibilitychange", retry);
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
    };
  }, [mode]);

  const image = mode === "reduced" ? V.still : V.poster;
  const style = { "--ar": V.ratio } as React.CSSProperties;
  return (
    <div className={`rv-film ${className ?? ""}`} style={style}>
      {mode === "motion" ? (
        <video
          ref={ref}
          className="rv-film-media"
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          poster={`${BASE}/${V.poster}.webp`}
          width={V.width}
          height={V.height}
          aria-label="Rondva in 15 seconds: set up the property, walk and record, the inspector picks the severity, Rondva drafts the report around the inspector's notes, review and export."
        >
          {V.sources.map((s) => (
            <source key={s.src} src={`${BASE}/${s.src}`} type={s.type} />
          ))}
        </video>
      ) : (
        <picture>
          {/* media-skilyrðin tryggja að sími sæki aldrei breiða veggspjaldið og öfugt */}
          <source media={V.media} srcSet={`${BASE}/${image}.webp`} type="image/webp" />
          <source media={V.media} srcSet={`${BASE}/${image}.jpg`} />
          <img
            src={BLANK}
            alt={mode === "reduced" ? STILL_ALT : POSTER_ALT}
            width={V.width}
            height={V.height}
            fetchPriority="high"
            decoding="async"
            className="rv-film-media"
          />
        </picture>
      )}
    </div>
  );
}
