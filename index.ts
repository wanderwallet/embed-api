
// (DB) Types:

import { WalletInfo, WalletSource } from "@/server/utils/wallet/wallet.types";

import type {
  Wallet,
} from "@prisma/client";

export interface DbWallet extends Omit<Wallet, "info" | "source"> {
  info: null | WalletInfo;
  source: null | WalletSource;
}

export type { WalletInfo, WalletSource };

export type {
  Challenge as DbChallenge,
  Session as DbSession,
  UserProfile as DbUserProfile,
} from "@prisma/client";

export type { RecoverableAccount } from "@/server/routers/account-recovery/fetchRecoverableAccounts";

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

export type {
  User as SupabaseUser,
} from "@supabase/supabase-js";

// Clients:

export { createTRPCClient } from "@/client/utils/trpc/trpc-client.utils";

export { createSupabaseClient } from "@/client/utils/supabase/supabase-client.utils";

export { ChallengeClientV1 } from "@/server/utils/challenge/clients/challenge-client-v1";
