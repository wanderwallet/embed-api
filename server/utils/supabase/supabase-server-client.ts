import { ensureIsServer } from "@/server/utils/env/env.utils"
import { createServerClient as supabaseCreateServerClient } from "@supabase/ssr"
import { cookies } from 'next/headers'

ensureIsServer("supabase-server-client.ts");

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export async function createServerClient() {
  const cookieStore = await cookies();

  return supabaseCreateServerClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
    },
  );
}
