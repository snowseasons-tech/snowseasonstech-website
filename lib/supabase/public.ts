import { createClient } from "@supabase/supabase-js";

// Anonymous client for public pages. It only calls the public_* database
// functions, so it never reads the tables directly. Returns null when the
// environment is not configured so pages can render a message instead of failing.
export function createSupabasePublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
