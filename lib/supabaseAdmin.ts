import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;

    if (!url || !key) {
      throw new Error(
        "Supabase admin is not configured (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY required)"
      );
    }

    adminClient = createClient(url, key);
  }

  return adminClient;
}
