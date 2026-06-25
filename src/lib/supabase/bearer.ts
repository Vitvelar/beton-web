import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getBearerAuthorization(value: string | null): string | null {
  if (!value) return null;
  return value.toLowerCase().startsWith("bearer ") ? value : null;
}

export function createBearerClient(authorization: string): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
