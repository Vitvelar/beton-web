import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Derive the project URL from a legacy service-role JWT (its payload carries the
// project `ref`). Lets the worker run with only the service key set — no separate
// SUPABASE_URL needed — when NEXT_PUBLIC_SUPABASE_URL baked in empty on Docker.
function deriveUrlFromKey(key: string | undefined): string | undefined {
  if (!key || !key.startsWith("eyJ")) return undefined;
  try {
    const part = key.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/");
    if (!part) return undefined;
    const ref = JSON.parse(Buffer.from(part, "base64").toString("utf8")).ref;
    return typeof ref === "string" && ref ? `https://${ref}.supabase.co` : undefined;
  } catch {
    return undefined;
  }
}

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
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    deriveUrlFromKey(key);
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
