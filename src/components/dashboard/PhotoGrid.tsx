"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Photo } from "@/lib/supabase/types";

function useSignedUrl(storagePath: string | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!storagePath) return;
    const supabase = createClient();
    supabase.storage
      .from("inspection-photos")
      .createSignedUrl(storagePath, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setUrl(data.signedUrl);
      });
  }, [storagePath]);

  return url;
}

function PhotoThumbnail({
  photo,
  onClick,
}: {
  photo: Photo;
  onClick: () => void;
}) {
  const url = useSignedUrl(photo.storage_path);

  return (
    <button
      onClick={onClick}
      className="relative aspect-square rounded-lg overflow-hidden bg-concrete/30 hover:ring-2 hover:ring-navy transition-all"
    >
      {url ? (
        <img
          src={url}
          alt={photo.caption ?? ""}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-fog text-xs">
          Hleð...
        </div>
      )}
      {photo.photo_type === "thermal" && (
        <span className="absolute top-1 right-1 rounded bg-sev-danger/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          Hiti
        </span>
      )}
    </button>
  );
}

function Lightbox({
  photo,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  photo: Photo;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const url = useSignedUrl(photo.storage_path);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    },
    [onClose, onPrev, onNext, hasPrev, hasNext]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {url ? (
          <img
            src={url}
            alt={photo.caption ?? ""}
            className="w-full h-full object-contain rounded-lg"
          />
        ) : (
          <div className="bg-concrete/30 rounded-lg h-96 flex items-center justify-center text-white">
            Hleð mynd...
          </div>
        )}

        {photo.caption && (
          <p className="text-white text-sm text-center mt-3">
            {photo.caption}
          </p>
        )}

        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 rounded-full bg-white/90 p-1.5 text-ink hover:bg-white transition-colors shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {hasPrev && (
          <button
            onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink hover:bg-white transition-colors shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink hover:bg-white transition-colors shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {sorted.map((photo, i) => (
          <PhotoThumbnail
            key={photo.id}
            photo={photo}
            onClick={() => setLightboxIndex(i)}
          />
        ))}
      </div>

      {lightboxIndex !== null && sorted[lightboxIndex] && (
        <Lightbox
          photo={sorted[lightboxIndex]}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((prev) => (prev ?? 0) - 1)}
          onNext={() => setLightboxIndex((prev) => (prev ?? 0) + 1)}
          hasPrev={lightboxIndex > 0}
          hasNext={lightboxIndex < sorted.length - 1}
        />
      )}
    </>
  );
}
