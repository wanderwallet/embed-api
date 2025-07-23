import type { JwtPayload } from "jwt-decode";
import type { Provider } from "@supabase/supabase-js";
import { Session } from "@prisma/client";

export type SupabaseJwtSessionData = Omit<Session, "id" | "userId">;

export type SupabaseJwtSessionHeaders = Pick<SupabaseJwtSessionData, "userAgent" | "deviceNonce" | "ip">;

export type SupabaseProvider = Extract<Provider, "google" | "facebook" | "twitter" | "apple">;

export interface SupabaseJwtPayload extends JwtPayload {
  session_id: string;
  sessionData: SupabaseJwtSessionData;
  app_metadata: {
    provider: SupabaseProvider | "email";
    providers: (SupabaseProvider | "email")[];
  };
}
