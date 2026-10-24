"use client";

import { useFormStatus } from "react-dom";
import { signOut } from "@/app/(dashboard)/actions";
import { spinner } from "@/lib/ui";

// Útskráningarhnappur með biðstöðu: meðan aðgerðin keyrir er hnappurinn óvirkur
// (engin tvísmella) og sýnir „Skrái út…“. Haus stjórnborðsins og nýskráningarsíðurnar
// nota hann; útlitið kemur frá kallanum (className).

function Submit({
  label,
  pendingLabel,
  className,
  withSpinner,
}: {
  label: string;
  pendingLabel: string;
  className: string;
  withSpinner: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending && withSpinner ? <span className={spinner} aria-hidden="true" /> : null}
      {pending ? pendingLabel : label}
    </button>
  );
}

export function SignOutButton({
  label,
  pendingLabel,
  className,
  formClassName,
  withSpinner = false,
}: {
  label: string;
  pendingLabel: string;
  className: string;
  formClassName?: string;
  withSpinner?: boolean;
}) {
  return (
    <form action={signOut} className={formClassName}>
      <Submit label={label} pendingLabel={pendingLabel} className={className} withSpinner={withSpinner} />
    </form>
  );
}
