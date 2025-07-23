
import type { Session, User } from "@supabase/supabase-js";

export type SupabaseSession = Session;

export interface SupabaseUserMetadata {
  hasPassword?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  email?: string;
  user_name?: string;
  preferred_username?: string;
  name?: string;
  full_name?: string;
  avatar_url?: string;
  picture?: string;
}

export interface SupabaseUser extends User {
  user_metadata: SupabaseUserMetadata;
}
