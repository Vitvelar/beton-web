import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role Supabase client — bypasses RLS. SERVER ONLY, and only on the
// Docker/beton.is deployment where SUPABASE_SERVICE_ROLE_KEY is set (the report
// worker tick endpoint and the worker-token report render path). Never import
// this from client components. Throws clearly if the key is missing so we don't
// silently fall back to an under-privileged client.
export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Accept either env name — the service-role key has gone by both in this repo.
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "Service-client vantar: NEXT_PUBLIC_SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY (eða SUPABASE_SECRET_KEY) verða að vera sett (beton.is)."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
