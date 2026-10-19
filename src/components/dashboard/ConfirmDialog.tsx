"use client";

import { useEffect, useId, useRef } from "react";
import { btn, spinner } from "@/lib/ui";

// Staðfestingargluggi á innfæddu <dialog> (DESIGN.md §6): fókus færður inn og lokaður inni,
// Escape og smellur á bakgrunn loka, fókus fer aftur á hnappinn sem opnaði hann.
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  busy = false,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape: láta React stýra opnun svo ástandið haldist í takt.
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => {
        // Smellur á bakgrunninn (::backdrop) lendir á <dialog> sjálfu.
        if (event.target === event.currentTarget) onCancel();
      }}
      className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-xl border border-concrete bg-surface p-0 text-ink shadow-sm backdrop:bg-ink/60 transition-[opacity,transform] duration-200 motion-reduce:transition-none open:opacity-100 open:scale-100 starting:open:opacity-0 starting:open:scale-95"
    >
      <div className="p-6">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-2 space-y-2 text-sm text-fog">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" autoFocus onClick={onCancel} disabled={busy} className={btn("secondary")}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy}
            className={btn("primary")}
          >
            {busy ? <span aria-hidden="true" className={spinner} /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
