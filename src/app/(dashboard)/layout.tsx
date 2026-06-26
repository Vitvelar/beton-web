import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardRealtimeRefresh } from "@/components/dashboard/DashboardRealtimeRefresh";

export const metadata = {
  title: {
    default: "Stjórnborð | Beton ehf.",
    template: "%s | Stjórnborð — Beton ehf.",
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The cookie client uses NEXT_PUBLIC_* which bake in EMPTY on the beton.is
  // Docker image — so getUser() can throw there. The worker-token report render
  // legitimately reaches this layout on beton.is; treat any failure as "no
  // session" and render children bare (the report page uses the service client).
  let user: User | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-paper">
      <DashboardRealtimeRefresh />
      <DashboardHeader email={user.email ?? ""} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
