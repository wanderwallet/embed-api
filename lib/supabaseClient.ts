import { Config } from "@/server/utils/config/config.constants"
import { createClient } from "@supabase/supabase-js"

// TODO: Use separate client/server clients. See https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=environment&environment=client

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// const supabaseUrl = Config.SUPABASE_URL || ""
// const supabaseAnonKey = Config.SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
