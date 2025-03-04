import { SupabaseClientOptions, createClient } from "@supabase/supabase-js";

export function createSupabaseClient(
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  supabaseOptions: SupabaseClientOptions<"public"> = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
) {
  return createClient(
    supabaseUrl,
    supabaseKey,
    supabaseOptions,
  );
}
