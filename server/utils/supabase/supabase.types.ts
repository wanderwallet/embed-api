
import type { User } from "@supabase/supabase-js";

export interface SupabaseUserMetadata {
  hasPassword: boolean;
}

export interface SupabaseUser extends User {
  user_metadata: SupabaseUserMetadata;
}
