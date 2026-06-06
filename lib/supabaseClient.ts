import { getSupabaseBrowserClient } from "@/lib/supabase";

/** Browser Supabase client for client components (auth + realtime). */
export const supabase = getSupabaseBrowserClient();
