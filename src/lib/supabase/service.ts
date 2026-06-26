import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role Supabase client — bypasses RLS. SERVER ONLY, and only on the
// Docker/beton.is deployment where SUPABASE_SERVICE_ROLE_KEY is set (the report
// worker tick endpoint and the worker-token report render path). Never import
// this from client components. Throws clearly if the key is missing so we don't
// silently fall back to an under-privileged client.
export function createServiceClient(): SupabaseClient {
  // Prefer a RUNTIME url var. NEXT_PUBLIC_* is inlined at build time and bakes in
  // empty on the beton.is Docker image (the Dockerfile doesn't pass it as a build
  // arg), so the worker can't rely on it — SUPABASE_URL is read live like the
  // service key. Accept both key names this repo has used.
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const missing: string[] = [];
  if (!url) missing.push("SUPABASE_URL (eða NEXT_PUBLIC_SUPABASE_URL)");
  if (!key) missing.push("SUPABASE_SERVICE_ROLE_KEY (eða SUPABASE_SECRET_KEY)");
  if (missing.length > 0) {
    throw new Error(`Service-client vantar á beton.is: ${missing.join(" + ")}`);
  }
  return createClient(url!, key!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
