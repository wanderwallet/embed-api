// (DB) Types:

export type { DbWallet, WalletInfo, WalletSource, RecoverableAccount } from "@/prisma/types/types";

export type {
  Challenge as DbChallenge,
  Session as DbSession,
  UserProfile as DbUserProfile,
} from "@prisma/client";


// (DB) Enums:

export {
  AuthProviderType,
  Chain,
  ExportType,
  WalletPrivacySetting,
  WalletSourceFrom,
  WalletSourceType,
  WalletStatus,
} from "@prisma/client";


// Auth:

export type { SupabaseUser, SupabaseUserMetadata } from "@/server/utils/supabase/supabase.types"

export type { AuthError as SupabaseAuthError } from "@supabase/supabase-js";


// Errors:

export { ErrorMessages } from "@/server/utils/error/error.constants";


// Clients:

export { createTRPCClient } from "@/client/utils/trpc/trpc-client.utils";

export { createSupabaseClient } from "@/client/utils/supabase/supabase-client.utils";

export { ChallengeClientV1 } from "@/server/utils/challenge/clients/challenge-client-v1";

export type { AppRouter } from "@/server/routers/_app";
