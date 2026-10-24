"use client";

import Link from "next/link";
import { pendingLeaveMessage } from "./useUnsavedGuard";

// <Link> sem spyr áður en óvistaðar breytingar (useUnsavedGuard) tapast. Má nota í server-síðum.
export function GuardedLink(props: React.ComponentProps<typeof Link>) {
  const { onClick, ...rest } = props;
  return (
    <Link
      {...rest}
      onClick={(event) => {
        const message = pendingLeaveMessage();
        if (message && !window.confirm(message)) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    />
  );
}
