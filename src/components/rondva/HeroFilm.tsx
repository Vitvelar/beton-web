"use client";

// Kynningarmynd Rondva, á fullum skjá efst á forsíðu (15 s, 60 fps, hljóðlaus, lykkja).
// Tvær útgáfur af sömu mynd, valdar eftir stefnu skjásins: "wide" (16:9, liggjandi skjár)
// og "tall" (9:16, standandi — sími/spjaldtölva; sýndarmyndavél rammar hvert skot upp á
// nýtt og kaflaheitin eru í borða neðst með öruggri spássíu). Frumskrár og endurgerð:
// plan/rondva/hero-film/.
//
// - Fyllir kassann sinn (cover) en sker aldrei meira en ~3,5 % af hvorri hlið (sjá .rv-film
//   í rondva.css); víki skjárinn meira frá hlutföllunum fyllir blekflöturinn afganginn.
// - Veggspjaldið (merkið, rammi 0) liggur ALLTAF undir myndbandinu. Myndbandið byrjar á
//   ramma 0 — engin tímasetning (seek) — og birtist ekki fyrr en það spilar, svo hvergi sést
//   svartur flötur. (iOS sækir engin gögn í myndband í hléi: fyrri útgáfa beið eftir `seeked`
//   sem kom aldrei.) `muted` er sett sem eigind, iOS krefst þess fyrir sjálfspilun.
// - Hindruð spilun (orkusparnaður, bakgrunnsflipi): veggspjaldið stendur; play() er kallað
//   beint í næstu snertingu/smelli/lyklaborði og þegar síðan sést aftur.
// - Hnappur til að gera hlé/spila (WCAG 2.2.2). Val notandans heldur.
// - Þjónninn velur mynd eftir media (<picture>): sími sækir aldrei breiða veggspjaldið og
//   prefers-reduced-motion fær kyrrmyndina strax, án JavaScript. Þá er myndbandið aldrei sótt.
// - Ef útgáfan hættir að passa (snúningur) er niðurhali myndbandsins hætt.
import { useEffect, useRef, useState } from "react";

const BASE = "/rondva/hero";
const BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
const REDUCE = "(prefers-reduced-motion: reduce)";

const VARIANTS = {
  wide: {
    media: "(orientation: landscape)",
    ratio: 16 / 9,
    width: 1920,
    height: 1080,
    poster: "rondva-hero-poster-lockup",
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
    poster: "rondva-hero-tall-poster-lockup",
    still: "rondva-hero-tall-reduced-motion",
    // Stærri standandi skjáir (spjaldtölvur) fá 1080p; símar 720p (1,8 MB).
    sources: [
      { src: "rondva-hero-tall-1080x1920.mp4", type: "video/mp4", media: "(min-width: 600px)" },
      { src: "rondva-hero-tall-720x1280.mp4", type: "video/mp4" },
    ],
  },
} as const;

const ALT =
  "Rondva film: an inspection is set up and walked room by room on a phone, the inspector picks the severity, and Rondva drafts the report — one page per room.";

type Mode = "pending" | "off" | "reduced" | "motion";

function stopDownload(v: HTMLVideoElement) {
  v.pause();
  v.querySelectorAll("source").forEach((s) => s.remove());
  v.removeAttribute("src");
  v.load();
}

export function HeroFilm({ variant, className }: { variant: keyof typeof VARIANTS; className?: string }) {
  const V = VARIANTS[variant];
  const ref = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const [mode, setMode] = useState<Mode>("pending");
  const [started, setStarted] = useState(false); // hefur spilað → myndbandið sést
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const fits = window.matchMedia(V.media);
    const reduce = window.matchMedia(REDUCE);
    const update = () => setMode(!fits.matches ? "off" : reduce.matches ? "reduced" : "motion");
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
    const tryPlay = () => {
      if (userPaused.current || !v.paused) return;
      v.play()?.catch(() => {
        // Hindrað (orkusparnaður/bakgrunnur): veggspjaldið stendur; reynt aftur hér að neðan.
      });
    };
    const onPlaying = () => {
      setStarted(true);
      setPlaying(true);
    };
    const onPause = () => setPlaying(false);
    // Kallað beint innan snertingar/smells svo WebKit telji það leyfða spilun.
    const onGesture = () => tryPlay();
    const onVisible = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    v.addEventListener("playing", onPlaying);
    v.addEventListener("pause", onPause);
    window.addEventListener("touchend", onGesture, { passive: true });
    window.addEventListener("click", onGesture);
    window.addEventListener("keydown", onGesture);
    document.addEventListener("visibilitychange", onVisible);
    tryPlay();
    return () => {
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("pause", onPause);
      window.removeEventListener("touchend", onGesture);
      window.removeEventListener("click", onGesture);
      window.removeEventListener("keydown", onGesture);
      document.removeEventListener("visibilitychange", onVisible);
      // Myndbandið er farið úr DOM (snúningur, reduced motion): hættum niðurhali þess.
      if (!v.isConnected) stopDownload(v);
      setStarted(false);
      setPlaying(false);
    };
  }, [mode]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      v.play()?.catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  };

  const style = { "--ar": V.ratio } as React.CSSProperties;
  return (
    <div className={`rv-film ${className ?? ""}`} style={style}>
      <picture>
        {/* media-skilyrðin: rétt útgáfa, og kyrrmynd fyrir reduced motion áður en JS keyrir */}
        <source media={`${V.media} and ${REDUCE}`} srcSet={`${BASE}/${V.still}.webp`} type="image/webp" />
        <source media={`${V.media} and ${REDUCE}`} srcSet={`${BASE}/${V.still}.jpg`} />
        <source media={V.media} srcSet={`${BASE}/${V.poster}.webp`} type="image/webp" />
        <source media={V.media} srcSet={`${BASE}/${V.poster}.jpg`} />
        <img
          src={BLANK}
          alt={mode === "motion" ? "" : ALT}
          aria-hidden={mode === "motion" ? true : undefined}
          width={V.width}
          height={V.height}
          fetchPriority="high"
          decoding="async"
          className="rv-film-media"
        />
      </picture>
      {mode === "motion" ? (
        <>
          <video
            ref={ref}
            className="rv-film-media rv-film-video"
            data-started={started ? "true" : "false"}
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            width={V.width}
            height={V.height}
            aria-label={ALT}
          >
            {V.sources.map((s) => (
              <source key={s.src} src={`${BASE}/${s.src}`} type={s.type} media={"media" in s ? s.media : undefined} />
            ))}
          </video>
          <button
            type="button"
            onClick={toggle}
            className="rv-film-toggle"
            aria-label={playing ? "Pause film" : "Play film"}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
                <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
              </svg>
            )}
          </button>
        </>
      ) : null}
    </div>
  );
}
