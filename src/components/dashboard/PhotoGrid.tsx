"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Photo } from "@/lib/supabase/types";
import { dashboardCopy, format, type DashboardCopy, type DashboardLocale } from "@/lib/i18n/dashboard";

type PhotoCopy = DashboardCopy["photos"];

type SignedUrlState = { path: string; url: string | null; failed: boolean };

// Undirritað slóð fyrir myndina. Ástandið geymir slóðina sem það á við, svo breyting á
// storage_path (næsta mynd í skoðaranum) sýnir aldrei fyrri mynd eða fyrri villu.
function useSignedUrl(storagePath: string | null): { url: string | null; failed: boolean } {
  const [state, setState] = useState<SignedUrlState | null>(null);

  useEffect(() => {
    if (!storagePath) return;
    let cancelled = false;
    createClient()
      .storage.from("inspection-photos")
      .createSignedUrl(storagePath, 3600)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.signedUrl) setState({ path: storagePath, url: null, failed: true });
        else setState({ path: storagePath, url: data.signedUrl, failed: false });
      })
      .catch(() => {
        if (!cancelled) setState({ path: storagePath, url: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  if (!storagePath) return { url: null, failed: true };
  if (!state || state.path !== storagePath) return { url: null, failed: false };
  return { url: state.url, failed: state.failed };
}

function PhotoThumbnail({
  photo,
  index,
  total,
  onClick,
  t,
}: {
  photo: Photo;
  index: number;
  total: number;
  onClick: () => void;
  t: PhotoCopy;
}) {
  const { url, failed } = useSignedUrl(photo.storage_path);
  const label = format(t.openPhoto, { n: index + 1, total });

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={photo.caption ? `${label}: ${photo.caption}` : label}
      className="relative aspect-square overflow-hidden rounded-lg bg-paper-alt transition-shadow hover:ring-2 hover:ring-navy"
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={photo.caption || format(t.photoAlt, { n: index + 1, total })}
          className="h-full w-full object-cover"
        />
      ) : failed ? (
        <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-fog">
          {t.unavailable}
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-fog">
          {t.loading}
        </div>
      )}
      {photo.photo_type === "thermal" && (
        <span className="absolute right-1 top-1 rounded bg-ink px-1.5 py-0.5 text-xs font-semibold text-paper">
          {t.thermal}
        </span>
      )}
    </button>
  );
}

const ICON_BUTTON =
  "absolute flex size-11 items-center justify-center rounded-full bg-surface text-ink shadow-sm transition-colors hover:bg-paper-alt";

function Lightbox({
  photo,
  index,
  total,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  t,
}: {
  photo: Photo;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  t: PhotoCopy;
}) {
  const { url, failed } = useSignedUrl(photo.storage_path);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Opna sem modal: fókus fer inn og lokast inni, bakgrunnur óvirkur. Fókus fer aftur á
  // smámyndina þegar skoðarinn lokast (þættinum er eytt, svo það er gert hér).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialog.showModal();
    // Bakgrunnurinn skrunar ekki meðan skoðarinn er opinn.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label={t.viewer}
      onCancel={(event) => {
        // Escape: React ræður lokun svo ástandið haldist í takt.
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // Smellur á dökka bakgrunninn lendir á <dialog> sjálfu.
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" && hasPrev) onPrev();
        if (event.key === "ArrowRight" && hasNext) onNext();
      }}
      className="m-auto h-dvh max-h-dvh w-dvw max-w-none overflow-hidden bg-transparent p-4 backdrop:bg-ink/80 transition-[opacity,transform] duration-200 motion-reduce:transition-none open:opacity-100 open:scale-100 starting:open:opacity-0 starting:open:scale-95"
    >
      <div
        className="relative mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={photo.caption || format(t.photoAlt, { n: index + 1, total })}
            className="max-h-[80dvh] w-full rounded-lg object-contain"
          />
        ) : (
          <div className="flex h-96 w-full items-center justify-center rounded-lg bg-surface text-sm text-fog">
            {failed ? t.unavailable : t.loadingPhoto}
          </div>
        )}

        <p className="mt-3 text-center text-sm text-paper" aria-live="polite">
          {photo.caption ? `${photo.caption} · ` : ""}
          {index + 1} / {total}
        </p>

        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className={`${ICON_BUTTON} right-0 top-0`}
        >
          <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {hasPrev && (
          <button
            type="button"
            onClick={onPrev}
            aria-label={t.previous}
            className={`${ICON_BUTTON} left-2 top-1/2 -translate-y-1/2`}
          >
            <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {hasNext && (
          <button
            type="button"
            onClick={onNext}
            aria-label={t.next}
            className={`${ICON_BUTTON} right-2 top-1/2 -translate-y-1/2`}
          >
            <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </dialog>
  );
}

export function PhotoGrid({ photos, locale }: { photos: Photo[]; locale: DashboardLocale }) {
  const t = dashboardCopy(locale).photos;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {sorted.map((photo, i) => (
          <PhotoThumbnail
            key={photo.id}
            photo={photo}
            index={i}
            total={sorted.length}
            onClick={() => setLightboxIndex(i)}
            t={t}
          />
        ))}
      </div>

      {lightboxIndex !== null && sorted[lightboxIndex] && (
        <Lightbox
          photo={sorted[lightboxIndex]}
          index={lightboxIndex}
          total={sorted.length}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((prev) => (prev ?? 0) - 1)}
          onNext={() => setLightboxIndex((prev) => (prev ?? 0) + 1)}
          hasPrev={lightboxIndex > 0}
          hasNext={lightboxIndex < sorted.length - 1}
          t={t}
        />
      )}
    </>
  );
}
