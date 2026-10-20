import { notFound } from "next/navigation";

// Óþekkt slóð undir /dashboard → not-found.tsx stjórnborðsins (með haus) í stað almennrar 404-síðu.
export default function DashboardUnknownPath() {
  notFound();
}
